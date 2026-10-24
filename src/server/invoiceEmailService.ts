import { jsPDF } from "jspdf";
import nodemailer from "nodemailer";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export interface InvoiceEmailResult {
  success: boolean;
  orderId: string;
  invoiceNo: string;
  companyEmailStatus: "sent" | "failed" | "simulated" | "pending";
  customerEmailStatus: "sent" | "failed" | "not_required" | "simulated" | "pending";
  companySentAt?: string | null;
  customerSentAt?: string | null;
  duplicatePrevented?: boolean;
  message?: string;
  error?: string | null;
}

// HTML escape helper
function escapeHTML(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Generate high quality, clean A4 PDF invoice
export function generateInvoicePdf(params: {
  orderId: string;
  invoiceNo: string;
  orderDate: string;
  customer: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items: Array<{
    name?: string;
    variant?: string;
    cartQuantity?: number;
    quantity?: number;
    price?: number;
    unit?: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  coupon?: string;
  grandTotal: number;
  paymentMethod: string;
  status: string;
  trackingCode?: string;
  courier?: string;
}): Buffer {
  const {
    orderId,
    invoiceNo,
    orderDate,
    customer,
    items,
    subtotal,
    deliveryCharge,
    discount,
    grandTotal,
    paymentMethod,
    status,
    trackingCode,
    courier,
  } = params;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Top header banner in brand forest green (#005900)
  doc.setFillColor(0, 89, 0);
  doc.rect(0, 0, 210, 32, "F");

  // Title in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("AHOROON", 15, 17);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Quality Food Products From Bengal", 15, 24);

  // INVOICE text right aligned in banner
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 195, 21, { align: "right" });

  // Company contact line below banner
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Mohammadpur, Bosila, Dhaka-1207 | Tel: +8801796361024 | Email: projectahoroon@gmail.com",
    15,
    38
  );

  // Top Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 41, 195, 41);

  // Meta Box (Invoice No, Order ID, Date, Status)
  let y = 49;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y - 4, 180, 22, 2, 2, "F");

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE NO", 20, y + 2);
  doc.text("ORDER NUMBER", 70, y + 2);
  doc.text("ORDER DATE", 125, y + 2);
  doc.text("STATUS", 170, y + 2);

  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(invoiceNo, 20, y + 10);
  doc.text("#" + orderId.slice(-8).toUpperCase(), 70, y + 10);
  doc.text(orderDate, 125, y + 10);
  doc.setTextColor(0, 89, 0);
  doc.text(String(status || "PENDING").toUpperCase(), 170, y + 10);

  // Customer Information Box
  y = 78;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("BILL TO / CUSTOMER INFORMATION", 15, y);

  y += 5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y, 180, 26, 2, 2, "S");

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(customer.name || "Valued Customer", 20, y + 7);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Phone: " + (customer.phone || "N/A"), 20, y + 13);
  doc.text("Email: " + (customer.email || "Not Provided"), 110, y + 13);
  const cleanAddress = (customer.address || "N/A").replace(/[\r\n]+/g, " ");
  doc.text("Address: " + cleanAddress.slice(0, 95), 20, y + 19);

  // Items Table Header
  y = 114;
  doc.setFillColor(0, 89, 0);
  doc.rect(15, y, 180, 8, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("#", 18, y + 5.5);
  doc.text("PRODUCT / ITEM DESCRIPTION", 28, y + 5.5);
  doc.text("QTY", 120, y + 5.5, { align: "center" });
  doc.text("UNIT PRICE", 155, y + 5.5, { align: "right" });
  doc.text("TOTAL", 190, y + 5.5, { align: "right" });

  // Items Rows
  y += 8;
  items.forEach((item, index) => {
    // Page break protection if table is long
    if (y > 240) {
      doc.addPage();
      y = 20;
      doc.setFillColor(0, 89, 0);
      doc.rect(15, y, 180, 8, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("#", 18, y + 5.5);
      doc.text("PRODUCT / ITEM DESCRIPTION", 28, y + 5.5);
      doc.text("QTY", 120, y + 5.5, { align: "center" });
      doc.text("UNIT PRICE", 155, y + 5.5, { align: "right" });
      doc.text("TOTAL", 190, y + 5.5, { align: "right" });
      y += 8;
    }

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 9, "F");
    }
    doc.setDrawColor(241, 245, 249);
    doc.line(15, y + 9, 195, y + 9);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(String(index + 1), 18, y + 6);

    let itemName = (item.name || "Product").slice(0, 50);
    if (item.variant) {
      itemName += ` (${item.variant})`;
    }
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text(itemName, 28, y + 6);

    const qty = item.cartQuantity || item.quantity || 1;
    const price = item.price || 0;
    const lineTotal = price * qty;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(String(qty), 120, y + 6, { align: "center" });
    doc.text("BDT " + price.toLocaleString(), 155, y + 6, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("BDT " + lineTotal.toLocaleString(), 190, y + 6, { align: "right" });

    y += 9;
  });

  // Financial Summary Box
  y = Math.max(y + 8, 172);
  const summaryX = 115;
  const summaryW = 80;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, y, summaryW, 40, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);

  doc.text("Subtotal:", summaryX + 6, y + 8);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text("BDT " + Number(subtotal).toLocaleString(), summaryX + summaryW - 6, y + 8, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Delivery Charge:", summaryX + 6, y + 15);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text(
    deliveryCharge === 0 ? "FREE" : "BDT " + Number(deliveryCharge).toLocaleString(),
    summaryX + summaryW - 6,
    y + 15,
    { align: "right" }
  );

  if (discount > 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 38, 38);
    doc.text("Discount:", summaryX + 6, y + 22);
    doc.setFont("helvetica", "bold");
    doc.text("-BDT " + Number(discount).toLocaleString(), summaryX + summaryW - 6, y + 22, {
      align: "right",
    });
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 6, y + 27, summaryX + summaryW - 6, y + 27);

  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 89, 0);
  doc.text("Total Payable:", summaryX + 6, y + 35);
  doc.text("BDT " + Number(grandTotal).toLocaleString(), summaryX + summaryW - 6, y + 35, {
    align: "right",
  });

  // Payment Details on left of summary
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("PAYMENT & DELIVERY", 15, y + 8);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Payment Method: " + (paymentMethod || "Cash on Delivery"), 15, y + 15);
  doc.text(
    "Payment Status: " + (status === "delivered" ? "Completed" : "Payable on Delivery"),
    15,
    y + 21
  );
  if (trackingCode) {
    doc.text(`Courier: ${courier || "Assigned"} | Tracking: ${trackingCode}`, 15, y + 27);
  }

  // Footer / Terms
  const footerY = 265;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, footerY, 195, footerY);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Terms: Goods once received in sound condition are subject to standard return policies. Keep this invoice for warranty and verification.",
    15,
    footerY + 5
  );
  doc.text(
    "Official computer-generated electronic invoice from Ahoroon. No physical signature required.",
    15,
    footerY + 9
  );
  doc.text(
    "Official Store: www.ahoroon.com | Hotline: +8801796361024 | Email: projectahoroon@gmail.com",
    15,
    footerY + 13
  );

  return Buffer.from(doc.output("arraybuffer"));
}

// Build Customer Order Confirmation HTML Email (Clean, branded, mobile-friendly)
export function buildCustomerOrderConfirmationEmailHtml(params: {
  orderId: string;
  invoiceNo: string;
  orderDate: string;
  orderDateTime: string;
  logoUrl?: string;
  customer: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items: Array<{
    name?: string;
    variant?: string;
    cartQuantity?: number;
    quantity?: number;
    price?: number;
    unit?: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  coupon?: string;
  grandTotal: number;
  paymentMethod: string;
  status: string;
  courier?: string;
  trackingCode?: string;
}): string {
  const {
    orderId,
    invoiceNo,
    orderDate,
    orderDateTime,
    logoUrl,
    customer,
    items,
    subtotal,
    deliveryCharge,
    discount,
    coupon,
    grandTotal,
    paymentMethod,
    status,
    courier,
    trackingCode,
  } = params;

  const customerNameGreeting = customer.name && customer.name.trim() 
    ? `Dear ${escapeHTML(customer.name.trim())},`
    : `Dear Valued Customer,`;

  let productRowsHtml = "";
  items.forEach((item, index) => {
    const name = escapeHTML(item.name || "Product");
    const variant = item.variant ? escapeHTML(item.variant) : "";
    const quantity = item.cartQuantity || item.quantity || 1;
    const price = item.price || 0;
    const lineTotal = price * quantity;

    productRowsHtml += `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 10px; font-size: 13px; color: #64748b; text-align: left; width: 6%;">${index + 1}</td>
        <td style="padding: 12px 10px; font-size: 13px; color: #1e293b; font-weight: 600; text-align: left;">
          ${name}
          ${variant ? `<br><span style="font-size: 11px; color: #64748b; background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px;">Variant: ${variant}</span>` : ""}
        </td>
        <td style="padding: 12px 10px; font-size: 13px; color: #475569; text-align: center; font-weight: 600;">${quantity}</td>
        <td style="padding: 12px 10px; font-size: 13px; color: #475569; text-align: right;">৳${price.toLocaleString()}</td>
        <td style="padding: 12px 10px; font-size: 13px; color: #1e293b; font-weight: 700; text-align: right;">৳${lineTotal.toLocaleString()}</td>
      </tr>
    `;
  });

  const displayLogo = logoUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation – Order #${escapeHTML(orderId)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 24px 10px; box-sizing: border-box; }
    .container { max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .header { background-color: #005900; padding: 32px 24px; text-align: center; color: #ffffff; }
    .brand-title { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }
    .header-sub { font-size: 14px; opacity: 0.95; margin-top: 6px; font-weight: 500; }
    .content { padding: 28px 24px; }
    .greeting { font-size: 16px; font-weight: 700; color: #005900; margin-top: 0; margin-bottom: 8px; }
    .message { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .meta-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .grid { width: 100%; border-collapse: collapse; }
    .grid td { padding: 6px 0; vertical-align: top; width: 50%; }
    .label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
    .value { font-size: 13px; color: #1e293b; font-weight: 600; }
    .address-card { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 24px; }
    .table th { background-color: #f8fafc; color: #475569; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 10px; border-bottom: 2px solid #e2e8f0; }
    .summary-box { background-color: #f8fafc; border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
    .summary-row { margin-bottom: 6px; font-size: 13px; color: #475569; }
    .summary-total { margin-top: 12px; padding-top: 12px; border-top: 2px solid #e2e8f0; font-size: 18px; font-weight: 800; color: #005900; }
    .attachment-card { background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; text-align: center; }
    .footer { background-color: #f1f5f9; padding: 22px 24px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1 class="brand-title">আহরোণ (Ahoroon)</h1>
        <p class="header-sub">Order Confirmation &bull; অর্ডার নিশ্চিতকরণ</p>
      </div>

      <div class="content">
        <!-- Greeting & Thank you -->
        <h2 class="greeting">${customerNameGreeting}</h2>
        <p class="message">
          <strong>Thank you for placing your order with Ahoroon!</strong> We are delighted to confirm that your order has been placed successfully. Our team is carefully preparing your pure, natural agricultural products for prompt delivery.
        </p>

        <!-- Order Meta -->
        <div class="meta-box">
          <table class="grid">
            <tr>
              <td>
                <div class="label">Order ID</div>
                <div class="value" style="color: #005900; font-family: monospace; font-size: 14px; font-weight: 800;">#${escapeHTML(orderId)}</div>
              </td>
              <td>
                <div class="label">Order Date &amp; Time</div>
                <div class="value">${escapeHTML(orderDateTime)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 10px;">
                <div class="label">Payment Method</div>
                <div class="value">${escapeHTML(paymentMethod || "Cash on Delivery (ক্যাশ অন ডেলিভারি)")}</div>
              </td>
              <td style="padding-top: 10px;">
                <div class="label">Order Status</div>
                <div class="value"><span style="background-color: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Confirmed / Pending Dispatch</span></div>
              </td>
            </tr>
            ${trackingCode ? `
            <tr>
              <td colspan="2" style="padding-top: 10px;">
                <div class="label">Courier Tracking</div>
                <div class="value">${escapeHTML(courier || "Assigned Courier")}: <strong>${escapeHTML(trackingCode)}</strong></div>
              </td>
            </tr>
            ` : ""}
          </table>
        </div>

        <!-- Customer Shipping Address -->
        <div class="address-card">
          <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
            📍 Shipping / Delivery Address
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
            ${escapeHTML(customer.name || "Customer")}
          </div>
          ${customer.phone ? `<div style="font-size: 13px; color: #475569; margin-bottom: 4px;">Phone: <strong>${escapeHTML(customer.phone)}</strong></div>` : ""}
          <div style="font-size: 13px; color: #334155; line-height: 1.5;">
            ${escapeHTML(customer.address || "As provided during checkout")}
          </div>
        </div>

        <!-- Ordered Products -->
        <h3 class="section-title">Ordered Items</h3>
        <table class="table">
          <thead>
            <tr>
              <th style="text-align: left;">#</th>
              <th style="text-align: left;">Product</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${productRowsHtml}
          </tbody>
        </table>

        <!-- Order Total & Financial Summary -->
        <div class="summary-box">
          <table style="width: 100%; border-collapse: collapse;">
            <tr class="summary-row">
              <td style="color: #475569;">Subtotal:</td>
              <td style="text-align: right; font-weight: 600; color: #1e293b;">৳${subtotal.toLocaleString()}</td>
            </tr>
            ${discount > 0 ? `
            <tr class="summary-row" style="color: #dc2626;">
              <td>Discount ${coupon ? `(${escapeHTML(coupon)})` : ""}:</td>
              <td style="text-align: right; font-weight: 600;">-৳${discount.toLocaleString()}</td>
            </tr>
            ` : ""}
            <tr class="summary-row">
              <td style="color: #475569;">Delivery Charge:</td>
              <td style="text-align: right; font-weight: 600; color: #1e293b;">
                ${deliveryCharge === 0 ? "FREE" : `৳${deliveryCharge.toLocaleString()}`}
              </td>
            </tr>
            <tr class="summary-total">
              <td style="padding-top: 10px; font-weight: 800;">Total Order Amount:</td>
              <td style="padding-top: 10px; text-align: right; font-weight: 800; font-size: 20px;">৳${grandTotal.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <!-- Attachment Note -->
        <div class="attachment-card">
          <p style="margin: 0; font-size: 12px; color: #475569;">
            📎 <strong>Official PDF Invoice Attached:</strong> A printable copy (<strong>Invoice #${escapeHTML(invoiceNo)}</strong>) has been generated and attached to this email for your personal records.
          </p>
        </div>

        <!-- Need Help -->
        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
          If you have any questions about your order or need changes, please contact our support team at <strong>+8801796361024</strong> or reply directly to <strong>projectahoroon@gmail.com</strong>.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="font-weight: 700; color: #334155; font-size: 13px; margin: 0 0 4px 0;">আহরোণ (Ahoroon)</p>
        <p style="margin: 2px 0;">Pure &amp; Natural Agriculture &bull; Bosila, Mohammadpur, Dhaka-1207, Bangladesh</p>
        <p style="margin: 2px 0;">Hotline: +8801796361024 &bull; Email: projectahoroon@gmail.com</p>
        <p style="font-size: 10px; color: #94a3b8; margin-top: 12px;">&copy; ${new Date().getFullYear()} Ahoroon. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Build Business Order Notification HTML Email (Designed for rapid merchant order processing)
export function buildBusinessOrderNotificationEmailHtml(params: {
  orderId: string;
  invoiceNo: string;
  orderDate: string;
  orderDateTime: string;
  customer: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items: Array<{
    name?: string;
    variant?: string;
    cartQuantity?: number;
    quantity?: number;
    price?: number;
    unit?: string;
  }>;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  coupon?: string;
  grandTotal: number;
  paymentMethod: string;
  status: string;
  courier?: string;
  trackingCode?: string;
}): string {
  const {
    orderId,
    invoiceNo,
    orderDateTime,
    customer,
    items,
    subtotal,
    deliveryCharge,
    discount,
    coupon,
    grandTotal,
    paymentMethod,
    courier,
    trackingCode,
  } = params;

  let productRowsHtml = "";
  items.forEach((item, index) => {
    const name = escapeHTML(item.name || "Product");
    const variant = item.variant ? escapeHTML(item.variant) : "";
    const quantity = item.cartQuantity || item.quantity || 1;
    const price = item.price || 0;
    const lineTotal = price * quantity;

    productRowsHtml += `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-size: 13px; color: #64748b; text-align: left; width: 6%;">${index + 1}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #0f172a; font-weight: 700; text-align: left;">
          ${name}
          ${variant ? `<br><span style="font-size: 11px; color: #475569; background-color: #f1f5f9; padding: 1px 6px; border-radius: 4px; display: inline-block;">Variant: ${variant}</span>` : ""}
        </td>
        <td style="padding: 10px 8px; font-size: 14px; color: #0f172a; text-align: center; font-weight: 800;">${quantity}</td>
        <td style="padding: 10px 8px; font-size: 13px; color: #475569; text-align: right;">৳${price.toLocaleString()}</td>
        <td style="padding: 10px 8px; font-size: 14px; color: #005900; font-weight: 800; text-align: right;">৳${lineTotal.toLocaleString()}</td>
      </tr>
    `;
  });

  const rawPhone = (customer.phone || "").replace(/[^\d+]/g, "");
  const cleanPhoneForWa = rawPhone.replace(/^\+/, "").replace(/^0/, "880");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Received – Order #${escapeHTML(orderId)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; }
    .wrapper { width: 100%; background-color: #f1f5f9; padding: 20px 8px; box-sizing: border-box; }
    .container { max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .header { background-color: #0f172a; padding: 24px; color: #ffffff; border-bottom: 4px solid #005900; }
    .title { font-size: 20px; font-weight: 900; margin: 0; color: #38bdf8; }
    .content { padding: 24px; }
    .customer-card { background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .customer-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 2px; }
    .customer-val { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .address-highlight { background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin-top: 10px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 20px; }
    .table th { background-color: #f1f5f9; color: #334155; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 8px; border-bottom: 2px solid #cbd5e1; }
    .summary-box { background-color: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .btn { display: inline-block; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; text-decoration: none; margin-right: 8px; margin-top: 4px; }
    .btn-call { background-color: #005900; color: #ffffff; }
    .btn-wa { background-color: #25d366; color: #ffffff; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Business Header -->
      <div class="header">
        <h1 class="title">📦 New Order Received – Order #${escapeHTML(orderId)}</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">
          Received on <strong>${escapeHTML(orderDateTime)}</strong> &bull; Total Amount: <strong style="color: #4ade80;">৳${grandTotal.toLocaleString()}</strong>
        </p>
      </div>

      <div class="content">
        <!-- Quick Customer & Shipping Details for Fast Processing -->
        <div class="customer-card">
          <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #005900; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            👤 Customer Contact &amp; Shipping Details
          </div>

          <div style="display: flex; flex-wrap: wrap;">
            <div style="width: 50%; float: left; margin-bottom: 10px;">
              <div class="customer-label">Customer Name</div>
              <div class="customer-val">${escapeHTML(customer.name || "N/A")}</div>
            </div>
            <div style="width: 50%; float: left; margin-bottom: 10px;">
              <div class="customer-label">Phone Number</div>
              <div class="customer-val" style="color: #005900;">${escapeHTML(customer.phone || "N/A")}</div>
            </div>
            <div style="clear: both;"></div>
          </div>

          <div style="margin-bottom: 10px;">
            <div class="customer-label">Customer Email</div>
            <div class="customer-val">
              ${customer.email ? `<a href="mailto:${escapeHTML(customer.email)}" style="color: #2563eb; text-decoration: underline;">${escapeHTML(customer.email)}</a>` : '<span style="color: #94a3b8; font-weight: normal;">Not Provided</span>'}
            </div>
          </div>

          <!-- Quick Action Buttons for Merchant -->
          ${customer.phone ? `
          <div style="margin-bottom: 12px;">
            <a href="tel:${escapeHTML(customer.phone)}" class="btn btn-call">📞 Call Customer</a>
            <a href="https://wa.me/${cleanPhoneForWa}" target="_blank" class="btn btn-wa">💬 WhatsApp Message</a>
          </div>
          ` : ""}

          <!-- Shipping Address -->
          <div class="address-highlight">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #b45309; margin-bottom: 4px;">
              🚚 Full Shipping / Courier Address
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${escapeHTML(customer.address || "N/A")}</div>
          </div>
        </div>

        <!-- Order Information Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; background-color: #f8fafc; border-radius: 8px; padding: 12px; font-size: 13px;">
          <tr>
            <td style="padding: 6px 12px; color: #64748b; font-weight: bold; width: 40%;">Order ID:</td>
            <td style="padding: 6px 12px; color: #0f172a; font-family: monospace; font-weight: 800;">#${escapeHTML(orderId)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; color: #64748b; font-weight: bold;">Order Date &amp; Time:</td>
            <td style="padding: 6px 12px; color: #0f172a; font-weight: 600;">${escapeHTML(orderDateTime)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; color: #64748b; font-weight: bold;">Payment Method:</td>
            <td style="padding: 6px 12px; color: #0f172a; font-weight: 600;">${escapeHTML(paymentMethod || "Cash on Delivery")}</td>
          </tr>
          ${trackingCode ? `
          <tr>
            <td style="padding: 6px 12px; color: #64748b; font-weight: bold;">Courier Tracking:</td>
            <td style="padding: 6px 12px; color: #005900; font-weight: 800;">${escapeHTML(courier || "Assigned Courier")}: ${escapeHTML(trackingCode)}</td>
          </tr>
          ` : ""}
        </table>

        <!-- Ordered Products -->
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">
          🛒 Ordered Products (${items.length} item${items.length === 1 ? '' : 's'})
        </div>
        <table class="table">
          <thead>
            <tr>
              <th style="text-align: left;">#</th>
              <th style="text-align: left;">Product</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${productRowsHtml}
          </tbody>
        </table>

        <!-- Financial Summary -->
        <div class="summary-box">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #475569; font-size: 13px;">Subtotal:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #1e293b; font-size: 13px;">৳${subtotal.toLocaleString()}</td>
            </tr>
            ${discount > 0 ? `
            <tr>
              <td style="padding: 4px 0; color: #dc2626; font-size: 13px;">Discount ${coupon ? `(${escapeHTML(coupon)})` : ""}:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #dc2626; font-size: 13px;">-৳${discount.toLocaleString()}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 4px 0; color: #475569; font-size: 13px;">Delivery Fee:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #1e293b; font-size: 13px;">
                ${deliveryCharge === 0 ? "FREE" : `৳${deliveryCharge.toLocaleString()}`}
              </td>
            </tr>
            <tr style="border-top: 2px solid #86efac; font-size: 16px;">
              <td style="padding-top: 8px; font-weight: 800; color: #005900;">Total Payable / COD Amount:</td>
              <td style="padding-top: 8px; text-align: right; font-weight: 900; font-size: 20px; color: #005900;">৳${grandTotal.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px; font-size: 12px; color: #475569; text-align: center;">
          📎 A complete PDF invoice has been attached to this email. You can also process this order directly in your <strong>Ahoroon Admin Panel</strong>.
        </div>
      </div>

      <div style="background-color: #e2e8f0; padding: 14px; text-align: center; color: #64748b; font-size: 11px;">
        Ahoroon Internal Order Processing &bull; projectahoroon@gmail.com
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Backward compatibility alias for any existing callers
export function buildInvoiceEmailHtml(params: any): string {
  if (params.recipientType === "customer") {
    return buildCustomerOrderConfirmationEmailHtml({
      ...params,
      orderDateTime: params.orderDate || new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    });
  }
  return buildBusinessOrderNotificationEmailHtml({
    ...params,
    orderDateTime: params.orderDate || new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
  });
}

// Unified Order Invoice Sending Engine
export async function sendOrderInvoiceEmails(
  db: any,
  orderId: string,
  force: boolean = false,
  fallbackOrderData?: any
): Promise<InvoiceEmailResult> {
  if (!orderId) {
    return {
      success: false,
      orderId: "",
      invoiceNo: "",
      companyEmailStatus: "failed",
      customerEmailStatus: "failed",
      error: "orderId is required",
    };
  }

  console.log(`[INVOICE_EMAIL] Processing invoice delivery for Order: ${orderId} (force: ${force})`);

  try {
    let orderData: any = null;
    let orderRef: any = null;

    if (db) {
      try {
        orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          orderData = orderSnap.data();
        }
      } catch (readErr: any) {
        console.warn(`[INVOICE_EMAIL] Firestore order read notice (${orderId}): ${readErr.message || readErr}`);
      }
    }

    if (!orderData && fallbackOrderData) {
      console.log(`[INVOICE_EMAIL] Using provided checkout order data as fallback for ${orderId}`);
      orderData = fallbackOrderData;
    }

    if (!orderData) {
      return {
        success: false,
        orderId,
        invoiceNo: "",
        companyEmailStatus: "failed",
        customerEmailStatus: "failed",
        error: `Order ${orderId} was not found in database or local context.`,
      };
    }
    const existingDelivery = orderData.invoiceDelivery;

    // Duplicate Prevention (Unless explicit admin force retry)
    if (!force && existingDelivery) {
      const companyDone = existingDelivery.companyEmailStatus === "sent";
      const customerDone =
        existingDelivery.customerEmailStatus === "sent" ||
        existingDelivery.customerEmailStatus === "not_required";

      if (companyDone && customerDone) {
        console.log(`[DUPLICATE_PREVENTED] Invoice already delivered for order ${orderId}.`);
        return {
          success: true,
          orderId,
          invoiceNo: existingDelivery.invoiceNo || `INV-${orderId.slice(-8).toUpperCase()}`,
          companyEmailStatus: existingDelivery.companyEmailStatus,
          customerEmailStatus: existingDelivery.customerEmailStatus,
          companySentAt: existingDelivery.companySentAt,
          customerSentAt: existingDelivery.customerSentAt,
          duplicatePrevented: true,
          message: "Duplicate email prevented. Invoice already dispatched.",
        };
      }
    }

    // Extract Order & Customer Details
    const customer = orderData.customer || {};
    const customerName = customer.name || orderData.customerName || "Customer";
    const customerPhone = customer.phone || orderData.phoneNumber || "N/A";
    const rawCustomerEmail = (customer.email || "").trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasValidCustomerEmail = Boolean(rawCustomerEmail && emailRegex.test(rawCustomerEmail));
    const customerEmail = hasValidCustomerEmail ? rawCustomerEmail : "";
    const customerAddress = customer.address || orderData.address || "N/A";

    const items = orderData.items || [];
    const subtotal = Number(orderData.subtotal || orderData.total || 0);
    const deliveryCharge = Number(
      orderData.deliveryCharge !== undefined ? orderData.deliveryCharge : 0
    );
    const discount = Number(orderData.discount || 0);
    const coupon = orderData.coupon || "";
    const grandTotal = Number(
      orderData.grandTotal || subtotal + deliveryCharge - discount || orderData.total || 0
    );
    const paymentMethod = orderData.paymentMethod || "Cash on Delivery";
    const status = orderData.status || "pending";
    const courier = orderData.courier || "";
    const trackingCode = orderData.trackingCode || "";

    // Formatted date and time in Dhaka timezone (BST)
    let orderDate = new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    let orderDateTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    if (orderData.createdAt) {
      try {
        const d = orderData.createdAt.toDate
          ? orderData.createdAt.toDate()
          : new Date(orderData.createdAt);
        orderDate = d.toLocaleDateString("en-US", {
          timeZone: "Asia/Dhaka",
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        orderDateTime = d.toLocaleString("en-US", {
          timeZone: "Asia/Dhaka",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      } catch (err) {
        // fallback to current date
      }
    }

    const invoiceNo =
      existingDelivery?.invoiceNo || `INV-${orderId.slice(-8).toUpperCase()}`;

    // 1. Generate PDF Invoice Buffer
    console.log(`[INVOICE_PDF] Generating PDF for Invoice #${invoiceNo}...`);
    const pdfBuffer = generateInvoicePdf({
      orderId,
      invoiceNo,
      orderDate,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
      },
      items,
      subtotal,
      deliveryCharge,
      discount,
      coupon,
      grandTotal,
      paymentMethod,
      status,
      trackingCode,
      courier,
    });
    console.log(`[INVOICE_PDF] Generated PDF successfully (${pdfBuffer.length} bytes).`);

    // 2. Build HTML Emails
    const companyEmailHtml = buildBusinessOrderNotificationEmailHtml({
      orderId,
      invoiceNo,
      orderDate,
      orderDateTime,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
      },
      items,
      subtotal,
      deliveryCharge,
      discount,
      coupon,
      grandTotal,
      paymentMethod,
      status,
      courier,
      trackingCode,
    });

    const customerEmailHtml = hasValidCustomerEmail
      ? buildCustomerOrderConfirmationEmailHtml({
          orderId,
          invoiceNo,
          orderDate,
          orderDateTime,
          customer: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            address: customerAddress,
          },
          items,
          subtotal,
          deliveryCharge,
          discount,
          coupon,
          grandTotal,
          paymentMethod,
          status,
          courier,
          trackingCode,
        })
      : "";

    // Exact Subjects as specified by requirements
    const companySubject = `New Order Received – Order #${orderId}`;
    const customerSubject = `Order Confirmation – Your Order Has Been Placed Successfully`;

    // Target Recipients
    const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "projectahoroon@gmail.com";

    // 3. Email Dispatch Configuration
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
    const SMTP_SECURE = process.env.SMTP_SECURE !== "false"; // default true for 465
    const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;

    let companyStatus: "sent" | "failed" | "simulated" = "failed";
    let customerStatus: "sent" | "failed" | "not_required" | "simulated" = hasValidCustomerEmail
      ? "failed"
      : "not_required";
    let companySentAt: string | null = null;
    let customerSentAt: string | null = null;
    let lastError: string | null = null;

    // Check if live credentials exist
    const hasSmtp = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
    const hasResend = Boolean(RESEND_API_KEY);

    if (hasResend) {
      // Send via Resend API
      try {
        console.log(`[RESEND_API] Dispatching invoice to company: ${COMPANY_EMAIL}`);
        const resendCompany = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || `Ahoroon <orders@ahoroon.com>`,
            to: COMPANY_EMAIL,
            subject: companySubject,
            html: companyEmailHtml,
            attachments: [
              {
                filename: `Invoice-${invoiceNo}.pdf`,
                content: pdfBuffer.toString("base64"),
              },
            ],
          }),
        });
        const resendCompanyData = await resendCompany.json();
        if (resendCompany.ok) {
          companyStatus = "sent";
          companySentAt = new Date().toISOString();
          console.log(`[RESEND_API] Company email delivered successfully.`);
        } else {
          throw new Error(resendCompanyData.message || "Failed to dispatch via Resend");
        }

        if (hasValidCustomerEmail) {
          console.log(`[RESEND_API] Dispatching invoice to customer: ${customerEmail}`);
          const resendCustomer = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || `Ahoroon <orders@ahoroon.com>`,
              to: customerEmail,
              subject: customerSubject,
              html: customerEmailHtml,
              attachments: [
                {
                  filename: `Invoice-${invoiceNo}.pdf`,
                  content: pdfBuffer.toString("base64"),
                },
              ],
            }),
          });
          if (resendCustomer.ok) {
            customerStatus = "sent";
            customerSentAt = new Date().toISOString();
            console.log(`[RESEND_API] Customer email delivered successfully.`);
          } else {
            const customerErrData = await resendCustomer.json();
            customerStatus = "failed";
            console.error(`[RESEND_API] Customer email failed:`, customerErrData);
          }
        }
      } catch (resendErr: any) {
        console.error(`[RESEND_API_ERROR]`, resendErr);
        lastError = resendErr.message || String(resendErr);
      }
    } else if (hasSmtp) {
      // Send via Nodemailer (SMTP)
      try {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_SECURE,
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        });

        // 1. Dispatch Company Email
        console.log(`[SMTP_SEND] Sending invoice email to company: ${COMPANY_EMAIL}`);
        const companyInfo = await transporter.sendMail({
          from: `"Ahoroon Orders" <${SMTP_USER}>`,
          to: COMPANY_EMAIL,
          subject: companySubject,
          html: companyEmailHtml,
          attachments: [
            {
              filename: `Invoice-${invoiceNo}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });
        console.log(`[SMTP_SUCCESS] Company invoice sent: ${companyInfo.messageId}`);
        companyStatus = "sent";
        companySentAt = new Date().toISOString();

        // 2. Dispatch Customer Email (if provided)
        if (hasValidCustomerEmail) {
          try {
            console.log(`[SMTP_SEND] Sending invoice email to customer: ${customerEmail}`);
            const customerInfo = await transporter.sendMail({
              from: `"Ahoroon" <${SMTP_USER}>`,
              to: customerEmail,
              subject: customerSubject,
              html: customerEmailHtml,
              attachments: [
                {
                  filename: `Invoice-${invoiceNo}.pdf`,
                  content: pdfBuffer,
                  contentType: "application/pdf",
                },
              ],
            });
            console.log(`[SMTP_SUCCESS] Customer invoice sent: ${customerInfo.messageId}`);
            customerStatus = "sent";
            customerSentAt = new Date().toISOString();
          } catch (custErr: any) {
            console.error(`[SMTP_ERROR] Failed sending customer invoice:`, custErr);
            customerStatus = "failed";
            lastError = `Customer email error: ${custErr.message || custErr}`;
          }
        }
      } catch (smtpErr: any) {
        console.error(`[SMTP_ERROR] Failed to dispatch via SMTP:`, smtpErr);
        companyStatus = "failed";
        if (hasValidCustomerEmail) customerStatus = "failed";
        lastError = smtpErr.message || String(smtpErr);
      }
    } else {
      // Graceful Simulation Mode when secrets are not yet configured in environment
      console.warn(
        `[INVOICE_EMAIL_SIMULATED] SMTP / Resend credentials are not configured in environment.`
      );
      console.log(`---------------- AUTOMATIC INVOICE EMAIL SIMULATION ----------------`);
      console.log(`[COMPANY RECIPIENT]: ${COMPANY_EMAIL}`);
      console.log(`[SUBJECT]: ${companySubject}`);
      console.log(`[ATTACHMENT]: Invoice-${invoiceNo}.pdf (${pdfBuffer.length} bytes)`);
      if (hasValidCustomerEmail) {
        console.log(`[CUSTOMER RECIPIENT]: ${customerEmail}`);
        console.log(`[SUBJECT]: ${customerSubject}`);
        console.log(`[ATTACHMENT]: Invoice-${invoiceNo}.pdf (${pdfBuffer.length} bytes)`);
      } else {
        console.log(`[CUSTOMER RECIPIENT]: None provided by customer (Customer email skipped)`);
      }
      console.log(`[FINANCIALS]: Subtotal: ৳${subtotal}, Delivery: ৳${deliveryCharge}, Total: ৳${grandTotal}`);
      console.log(`--------------------------------------------------------------------`);

      companyStatus = "simulated";
      companySentAt = new Date().toISOString();
      if (hasValidCustomerEmail) {
        customerStatus = "simulated";
        customerSentAt = new Date().toISOString();
      }
    }

    // 4. Update Firestore Order with Delivery Metadata
    const invoiceDelivery = {
      companyEmailStatus: companyStatus,
      customerEmailStatus: customerStatus,
      companySentAt: companySentAt || existingDelivery?.companySentAt || null,
      customerSentAt: customerSentAt || existingDelivery?.customerSentAt || null,
      lastAttemptAt: new Date().toISOString(),
      lastError,
      invoiceNo,
    };

    if (orderRef) {
      try {
        await updateDoc(orderRef, {
          invoiceDelivery,
          adminEmailSent: companyStatus === "sent" || companyStatus === "simulated",
          updatedAt: serverTimestamp(),
        });
        console.log(`[INVOICE_DB_SAVED] Order ${orderId} updated with invoice delivery record.`);
      } catch (dbErr: any) {
        console.error(`[INVOICE_DB_ERROR] Failed saving invoiceDelivery to Firestore:`, dbErr);
      }
    }

    return {
      success: true,
      orderId,
      invoiceNo,
      companyEmailStatus: companyStatus,
      customerEmailStatus: customerStatus,
      companySentAt,
      customerSentAt,
      error: lastError,
    };
  } catch (fatalErr: any) {
    console.error(`[INVOICE_FATAL_ERROR] Unexpected error processing order invoice:`, fatalErr);
    // Never fail order creation
    return {
      success: true,
      orderId,
      invoiceNo: `INV-${orderId.slice(-8).toUpperCase()}`,
      companyEmailStatus: "failed",
      customerEmailStatus: "failed",
      error: fatalErr.message || String(fatalErr),
    };
  }
}
