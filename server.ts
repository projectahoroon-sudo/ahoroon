import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API endpoint
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.post("/api/generate-description", async (req, res) => {
    try {
      const { productName } = req.body;
      if (!productName) {
        return res.status(400).json({ error: "Product name is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Write a compelling product description (in Bengali) for a product named '${productName}'. It's natural and eco-friendly. Keep it concise.`,
      });

      res.json({ description: response.text });
    } catch (error) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: "Failed to generate description" });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { productName } = req.body;
      if (!productName) {
        return res.status(400).json({ error: "Product name is required" });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: `A professional, high-quality, studio-lit commercial product photo of '${productName}', clean background, isolated.` }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          },
        },
      });

      let base64Image = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!base64Image) {
        throw new Error("No image generated");
      }

      res.json({ image: base64Image });
    } catch (error: any) {
      console.error("Gemini Image API error:", error);
      
      // Check for quota exhaustion or rate limits
      if (
        (error?.status === 'RESOURCE_EXHAUSTED') || 
        (error?.message?.includes('429')) ||
        (error?.error?.code === 429)
      ) {
        return res.status(429).json({ error: "AI service quota exceeded. Please try again in a few minutes." });
      }

      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Initialize Firebase for backend notifications
  let db: any = null;
  try {
    const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(firebaseConfigPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
      const firebaseApp = initializeApp(firebaseConfig);
      db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      console.log("Firebase initialized on server. Database ID:", firebaseConfig.firestoreDatabaseId);
    } else {
      console.warn("firebase-applet-config.json not found in server root.");
    }
  } catch (err) {
    console.error("Failed to initialize Firebase on backend server:", err);
  }

  // HTML sanitization helper
  function escapeHTML(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Automatic Order Notification Email Endpoint
  app.post("/api/orders/notify", async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: "orderId is required" });
      }

      if (!db) {
        console.warn("[DB_NOT_READY] Firestore is not initialized on the backend. Attempting to skip database checks.");
        return res.status(500).json({ error: "Firestore is not initialized on the backend." });
      }

      console.log(`[ORDER_NOTIFICATION] Processing order: ${orderId}`);

      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        return res.status(404).json({ error: `Order ${orderId} not found in database.` });
      }

      const orderData = orderSnap.data();

      // Prevent duplicate notification emails
      if (orderData.adminEmailSent) {
        console.log(`[DUPLICATE_PREVENTED] Email already dispatched previously for order ${orderId}.`);
        return res.json({ success: true, message: "Duplicate notification ignored." });
      }

      // Optimistically update order in Firestore to mark notification sent
      await updateDoc(orderRef, { adminEmailSent: true });

      // Fetch custom company logo from settings if available
      let logoUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200";
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
        if (settingsSnap.exists()) {
          const settingsData = settingsSnap.data();
          if (settingsData && settingsData.logoUrl) {
            logoUrl = settingsData.logoUrl;
          }
        }
      } catch (settingsErr) {
        console.error("Failed to fetch site settings logo:", settingsErr);
      }

      // Customer Info extraction
      const customer = orderData.customer || {};
      const customerName = customer.name || 'Guest Customer';
      const customerPhone = customer.phone || 'N/A';
      const customerEmail = customer.email || 'N/A';
      const customerAddress = customer.address || 'N/A';
      const customerNotes = orderData.notes || orderData.customerNotes || 'None';
      const paymentMethod = orderData.paymentMethod || 'Cash on Delivery';
      const orderStatus = orderData.status || 'pending';
      const courier = orderData.courier || 'Not Assigned';

      // Date Formatting (Local Dhaka Time)
      let orderDateFormatted = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
      if (orderData.createdAt) {
        try {
          const date = orderData.createdAt.toDate ? orderData.createdAt.toDate() : new Date(orderData.createdAt);
          orderDateFormatted = date.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
        } catch (dateErr) {
          console.error("Failed parsing createdAt date:", dateErr);
        }
      }

      // Financial Details
      const items = orderData.items || [];
      const subtotal = orderData.subtotal || orderData.total || 0;
      const discount = orderData.discount || 0;
      const coupon = orderData.coupon || 'None';
      const deliveryCharge = orderData.deliveryCharge !== undefined ? orderData.deliveryCharge : 0;
      const grandTotal = orderData.grandTotal || (subtotal + deliveryCharge - discount);

      // Construct Product List HTML Table Rows
      let productRowsHtml = "";
      items.forEach((item: any, index: number) => {
        const name = escapeHTML(item.name || 'Product');
        const variant = escapeHTML(item.variant || item.selectedVariant || 'N/A');
        const quantity = item.cartQuantity || item.quantity || 1;
        const price = item.price || 0;
        const lineTotal = price * quantity;

        productRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; font-size: 14px; color: #475569; text-align: left;">${index + 1}</td>
            <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600; text-align: left;">
              ${name}
              ${variant !== 'N/A' ? `<br><span style="font-size: 11px; color: #64748b; font-weight: normal; background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px;">Variant: ${variant}</span>` : ''}
            </td>
            <td style="padding: 12px; font-size: 14px; color: #475569; text-align: center;">${quantity}</td>
            <td style="padding: 12px; font-size: 14px; color: #475569; text-align: right;">৳${price.toLocaleString()}</td>
            <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 700; text-align: right;">৳${lineTotal.toLocaleString()}</td>
          </tr>
        `;
      });

      // Escape all human-submitted parameters
      const escName = escapeHTML(customerName);
      const escPhone = escapeHTML(customerPhone);
      const escEmail = escapeHTML(customerEmail);
      const escAddress = escapeHTML(customerAddress);
      const escNotes = escapeHTML(customerNotes);
      const escPaymentMethod = escapeHTML(paymentMethod);
      const escOrderStatus = escapeHTML(orderStatus);
      const escCourier = escapeHTML(courier);
      const escCoupon = escapeHTML(coupon);

      // Build Responsive HTML Email template
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Received - Ahoroon</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 30px 10px;
      box-sizing: border-box;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #005900;
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .logo {
      max-height: 55px;
      margin-bottom: 15px;
      border-radius: 6px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      opacity: 0.95;
    }
    .content {
      padding: 30px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-top: 0;
      margin-bottom: 15px;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 8px;
    }
    .grid {
      width: 100%;
      margin-bottom: 20px;
      border-collapse: collapse;
    }
    .grid td {
      padding-bottom: 15px;
      vertical-align: top;
      width: 50%;
    }
    .info-label {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .info-value {
      font-size: 14px;
      color: #1e293b;
      font-weight: 600;
    }
    .info-value-highlight {
      color: #005900;
      font-weight: 700;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 30px;
    }
    .table th {
      background-color: #f8fafc;
      color: #475569;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    .table td {
      border-bottom: 1px solid #f1f5f9;
    }
    .summary-container {
      width: 100%;
      text-align: right;
      margin-bottom: 20px;
    }
    .summary-box {
      display: inline-block;
      width: 100%;
      max-width: 320px;
      background-color: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e2e8f0;
      text-align: left;
      box-sizing: border-box;
    }
    .summary-row {
      margin-bottom: 8px;
      font-size: 14px;
      color: #475569;
    }
    .summary-row-total {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #e2e8f0;
      font-size: 18px;
      font-weight: 800;
      color: #005900;
    }
    .notes-box {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 25px;
    }
    .notes-title {
      font-size: 11px;
      font-weight: 800;
      color: #b45309;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .notes-text {
      font-size: 13px;
      color: #78350f;
      margin: 0;
      font-weight: 500;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 25px 30px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 4px 0;
    }
    .footer-brand {
      font-weight: 700;
      color: #334155;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <img class="logo" src="${logoUrl}" alt="Ahoroon Logo">
        <h1>New Order Received</h1>
        <p>Order #${escapeHTML(orderId)} &bull; ${escapeHTML(orderDateFormatted)}</p>
      </div>

      <div class="content">
        <!-- Order Overview Grid -->
        <h2 class="section-title">Order Overview</h2>
        <table class="grid">
          <tr>
            <td>
              <div class="info-label">Order ID</div>
              <div class="info-value">#${escapeHTML(orderId)}</div>
            </td>
            <td>
              <div class="info-label">Order Status</div>
              <div class="info-value">
                <span style="text-transform: uppercase; background-color: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">
                  ${escOrderStatus}
                </span>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div class="info-label">Payment Method</div>
              <div class="info-value">${escPaymentMethod}</div>
            </td>
            <td>
              <div class="info-label">Courier</div>
              <div class="info-value">${escCourier}</div>
            </td>
          </tr>
        </table>

        <!-- Customer Information Grid -->
        <h2 class="section-title">Customer Information</h2>
        <table class="grid">
          <tr>
            <td>
              <div class="info-label">Customer Name</div>
              <div class="info-value">${escName}</div>
            </td>
            <td>
              <div class="info-label">Phone Number</div>
              <div class="info-value info-value-highlight">${escPhone}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <div class="info-label">Email Address</div>
              <div class="info-value">${escEmail}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 8px;">
              <div class="info-label">Delivery Address</div>
              <div class="info-value" style="font-weight: 500; line-height: 1.45; color: #334155;">${escAddress}</div>
            </td>
          </tr>
        </table>

        <!-- Customer Notes if any -->
        ${customerNotes !== 'None' ? `
        <div class="notes-box">
          <div class="notes-title">Customer Notes</div>
          <p class="notes-text">${escNotes}</p>
        </div>
        ` : ''}

        <!-- Product Table -->
        <h2 class="section-title">Product List</h2>
        <table class="table">
          <thead>
            <tr>
              <th style="width: 5%; text-align: left;">#</th>
              <th style="width: 50%; text-align: left;">Product</th>
              <th style="width: 10%; text-align: center;">Qty</th>
              <th style="width: 15%; text-align: right;">Unit Price</th>
              <th style="width: 20%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${productRowsHtml}
          </tbody>
        </table>

        <!-- Pricing Summary Box -->
        <div class="summary-container">
          <div class="summary-box">
            <table style="width: 100%; border-collapse: collapse;">
              <tr class="summary-row">
                <td style="padding: 3px 0; color: #475569; font-weight: 500;">Subtotal:</td>
                <td style="padding: 3px 0; text-align: right; font-weight: 600; color: #1e293b;">৳${subtotal.toLocaleString()}</td>
              </tr>
              ${discount > 0 ? `
              <tr class="summary-row" style="color: #dc2626;">
                <td style="padding: 3px 0; font-weight: 500;">Discount:</td>
                <td style="padding: 3px 0; text-align: right; font-weight: 600;">-৳${discount.toLocaleString()}</td>
              </tr>
              ` : ''}
              ${escCoupon !== 'None' ? `
              <tr class="summary-row" style="color: #10b981;">
                <td style="padding: 3px 0; font-weight: 500;">Coupon (${escCoupon}):</td>
                <td style="padding: 3px 0; text-align: right; font-weight: 600;">Applied</td>
              </tr>
              ` : ''}
              <tr class="summary-row">
                <td style="padding: 3px 0; color: #475569; font-weight: 500;">Delivery Charge:</td>
                <td style="padding: 3px 0; text-align: right; font-weight: 600; color: #1e293b;">
                  ${deliveryCharge === 0 ? 'FREE' : `৳${deliveryCharge.toLocaleString()}`}
                </td>
              </tr>
              <tr class="summary-row-total">
                <td style="padding-top: 15px; font-weight: 800; color: #005900; font-size: 16px;">Grand Total:</td>
                <td style="padding-top: 15px; text-align: right; font-weight: 800; color: #005900; font-size: 20px;">৳${grandTotal.toLocaleString()}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-brand">আহরোণ (Ahoroon)</p>
        <p>This is an automated operational notification. Please do not reply directly.</p>
        <p>&copy; ${new Date().getFullYear()} Ahoroon. All rights reserved.</p>
        <p style="font-size: 10px; color: #94a3b8; font-family: monospace; margin-top: 15px;">Generated: ${escapeHTML(new Date().toISOString())}</p>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      // Read SMTP/recipient from environment
      const ADMIN_ORDER_EMAIL = process.env.ADMIN_ORDER_EMAIL || "ahorooon@gmail.com";
      const SMTP_HOST = process.env.SMTP_HOST;
      const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
      const SMTP_USER = process.env.SMTP_USER;
      const SMTP_PASS = process.env.SMTP_PASS;
      const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

      const subject = `🛒 New Order Received - Order #${orderId}`;

      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.warn("[SMTP_CONFIG_MISSING] SMTP credentials are not configured in environment secrets.");
        console.log("------------------ DEVELOPER MODE / SIMULATED EMAIL RECEIPT ------------------");
        console.log(`RECIPIENT: ${ADMIN_ORDER_EMAIL}`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`CUSTOMER: ${customerName} (${customerPhone})`);
        console.log(`DELIVERY ADDRESS: ${customerAddress}`);
        console.log(`TOTAL PAYABLE: ৳${grandTotal.toLocaleString()}`);
        console.log("------------------ SIMULATED EMAIL CONTENT END ------------------");

        return res.json({ 
          success: true, 
          emailSent: false, 
          simulated: true,
          message: "Order received. Email logged to console because SMTP credentials are not configured in environment." 
        });
      }

      // Nodemailer setup
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      console.log(`[SMTP_SEND] Dispatching order email to: ${ADMIN_ORDER_EMAIL}`);
      const info = await transporter.sendMail({
        from: `"Ahoroon eCommerce" <${SMTP_USER}>`,
        to: ADMIN_ORDER_EMAIL,
        subject: subject,
        html: emailHtml,
      });

      console.log(`[EMAIL_SUCCESS] Email sent successfully. MessageID: ${info.messageId}`);
      res.json({ success: true, emailSent: true, messageId: info.messageId });

    } catch (error: any) {
      console.error("[EMAIL_FAILURE] Failed to dispatch order notification email:", error);
      // Resilience fallback: always return success: true to the client so checkout does not fail
      res.json({ success: true, emailSent: false, error: error.message || error });
    }
  });

  // Contact Form Submission Endpoint (with Validation & Honeypot Spam Protection)
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message, website_honeypot } = req.body;

      // 1. Basic Spam Protection (Honeypot)
      if (website_honeypot) {
        console.warn("[SPAM_PREVENTED] Honeypot field was filled by a bot.");
        return res.status(400).json({ error: "Spam submission rejected by security filter." });
      }

      // 2. Server-side Validation
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: "আপনার নাম দেওয়া আবশ্যক।" });
      }

      if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ error: "আপনার ইমেইল ঠিকানা দেওয়া আবশ্যক।" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: "সঠিক ইমেইল ঠিকানা প্রদান করুন।" });
      }

      if (!message || typeof message !== 'string' || message.trim().length < 10) {
        return res.status(400).json({ error: "আপনার বার্তাটি অত্যন্ত সংক্ষিপ্ত। অনুগ্রহ করে অন্তত ১০টি অক্ষর লিখুন।" });
      }

      const sanitizedName = name.trim();
      const sanitizedEmail = email.trim();
      const sanitizedSubject = (subject || 'General Inquiry').trim();
      const sanitizedMessage = message.trim();

      // 3. Save to Firestore (Database Persistence)
      let savedToDb = false;
      if (db) {
        try {
          await addDoc(collection(db, 'contacts'), {
            name: sanitizedName,
            email: sanitizedEmail,
            subject: sanitizedSubject,
            message: sanitizedMessage,
            createdAt: serverTimestamp(),
          });
          console.log(`[CONTACT_SUCCESS] Saved submission from ${sanitizedName} to database.`);
          savedToDb = true;
        } catch (dbErr) {
          console.error("[CONTACT_DB_ERROR] Failed to save contact submission to Firestore:", dbErr);
        }
      } else {
        console.warn("[CONTACT_DB_WARNING] Firestore is not initialized on backend; skipping DB persistence.");
      }

      // 4. Dispatch Email Notification if SMTP is configured
      const ADMIN_ORDER_EMAIL = process.env.ADMIN_ORDER_EMAIL || "ahorooon@gmail.com";
      const SMTP_HOST = process.env.SMTP_HOST;
      const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
      const SMTP_USER = process.env.SMTP_USER;
      const SMTP_PASS = process.env.SMTP_PASS;
      const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

      let emailSent = false;
      if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
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

          const contactEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>New Contact Inquiry - Ahoroon</title>
              <style>
                body { font-family: sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 20px; }
                .card { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; }
                .header { border-bottom: 2px solid #005900; padding-bottom: 15px; margin-bottom: 20px; }
                .title { color: #005900; margin: 0; font-size: 20px; font-weight: bold; }
                .field { margin-bottom: 15px; }
                .label { font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 3px; }
                .value { font-size: 14px; color: #1e293b; font-weight: 600; }
                .message { background-color: #f1f5f9; padding: 15px; border-radius: 8px; font-weight: normal; font-size: 14px; white-space: pre-wrap; line-height: 1.5; color: #334155; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1 class="title">New Contact Form Submission</h1>
                </div>
                <div class="field">
                  <div class="label">Sender Name</div>
                  <div class="value">${escapeHTML(sanitizedName)}</div>
                </div>
                <div class="field">
                  <div class="label">Sender Email</div>
                  <div class="value">${escapeHTML(sanitizedEmail)}</div>
                </div>
                <div class="field">
                  <div class="label">Subject</div>
                  <div class="value">${escapeHTML(sanitizedSubject)}</div>
                </div>
                <div class="field">
                  <div class="label">Message</div>
                  <div class="message">${escapeHTML(sanitizedMessage)}</div>
                </div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 25px; text-align: center;">
                  Received: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} &bull; Ahoroon
                </div>
              </div>
            </body>
            </html>
          `;

          await transporter.sendMail({
            from: `"Ahoroon Contact Form" <${SMTP_USER}>`,
            to: ADMIN_ORDER_EMAIL,
            subject: `📬 New Contact Inquiry: ${sanitizedSubject}`,
            html: contactEmailHtml,
          });

          console.log(`[CONTACT_EMAIL_SUCCESS] Dispatched inquiry email to ${ADMIN_ORDER_EMAIL}`);
          emailSent = true;
        } catch (emailErr) {
          console.error("[CONTACT_EMAIL_ERROR] Failed to send contact inquiry email:", emailErr);
        }
      } else {
        console.log("------------------ SIMULATED CONTACT FORM RECEIVED ------------------");
        console.log(`NAME: ${sanitizedName}`);
        console.log(`EMAIL: ${sanitizedEmail}`);
        console.log(`SUBJECT: ${sanitizedSubject}`);
        console.log(`MESSAGE: ${sanitizedMessage}`);
        console.log("----------------------------------------------------------------------");
      }

      res.json({ success: true, savedToDb, emailSent });
    } catch (error: any) {
      console.error("[CONTACT_API_FAILURE] Failed to process contact submission:", error);
      res.status(500).json({ error: "অভ্যন্তরীণ সার্ভার ত্রুটি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
