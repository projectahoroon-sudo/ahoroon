// Client-side Gmail Workspace API Service

export interface GmailOrderEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  bodyHtml?: string;
  bodyText?: string;
  isUnread: boolean;
  orderId?: string;
}

export interface GmailUserProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

// Base64URL encoder helper for RFC 2822 emails
function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeBase64Url(base64UrlStr: string): string {
  try {
    let base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return '';
  }
}

export const gmailService = {
  // Get authenticated user's Gmail profile
  async getProfile(accessToken: string): Promise<GmailUserProfile> {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch Gmail profile');
    }
    return res.json();
  },

  // Fetch list of order emails from user's Gmail inbox
  async listOrderEmails(accessToken: string, queryStr = 'subject:(Order OR অর্ডার OR Ahoroon OR Invoice)'): Promise<GmailOrderEmail[]> {
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(queryStr)}&maxResults=30`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!listRes.ok) {
      const err = await listRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to list Gmail messages');
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];
    if (messages.length === 0) return [];

    // Fetch full details for the top messages (in parallel, capped at 15 for snappy response)
    const detailed = await Promise.all(
      messages.slice(0, 15).map(async (m: { id: string; threadId: string }) => {
        try {
          const detailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (!detailRes.ok) return null;
          const msg = await detailRes.json();

          const headers: Record<string, string> = {};
          (msg.payload?.headers || []).forEach((h: { name: string; value: string }) => {
            headers[h.name.toLowerCase()] = h.value;
          });

          // Extract body parts
          let bodyHtml = '';
          let bodyText = '';

          function extractParts(part: any) {
            if (!part) return;
            if (part.mimeType === 'text/html' && part.body?.data) {
              bodyHtml = decodeBase64Url(part.body.data);
            } else if (part.mimeType === 'text/plain' && part.body?.data) {
              bodyText = decodeBase64Url(part.body.data);
            }
            if (part.parts && Array.isArray(part.parts)) {
              part.parts.forEach(extractParts);
            }
          }

          extractParts(msg.payload);
          if (!bodyHtml && !bodyText && msg.payload?.body?.data) {
            bodyText = decodeBase64Url(msg.payload.body.data);
          }

          // Try to extract order ID from subject
          const subject = headers['subject'] || '(No Subject)';
          const orderMatch = subject.match(/#([a-zA-Z0-9_-]+)/);
          const orderId = orderMatch ? orderMatch[1] : undefined;

          const isUnread = (msg.labelIds || []).includes('UNREAD');

          return {
            id: msg.id,
            threadId: msg.threadId,
            subject,
            from: headers['from'] || 'Unknown Sender',
            to: headers['to'] || '',
            date: headers['date'] || new Date(Number(msg.internalDate)).toLocaleString(),
            snippet: msg.snippet || '',
            bodyHtml,
            bodyText,
            isUnread,
            orderId,
          } as GmailOrderEmail;
        } catch (err) {
          console.warn('Failed to load message detail:', m.id, err);
          return null;
        }
      })
    );

    return detailed.filter((m): m is GmailOrderEmail => m !== null);
  },

  // Deliver an order notification directly to the user's Gmail Inbox (using messages.insert with INBOX label)
  async deliverOrderToInbox(order: any, accessToken: string, userEmail?: string): Promise<{ success: boolean; id?: string }> {
    const orderId = order.id || 'N/A';
    const customer = order.customer || {};
    const customerName = customer.name || 'Customer';
    const customerPhone = customer.phone || 'N/A';
    const customerEmail = customer.email || 'N/A';
    const customerAddress = customer.address || 'N/A';
    const paymentMethod = order.paymentMethod || 'Cash on Delivery';
    const subtotal = order.subtotal || order.total || 0;
    const deliveryCharge = order.deliveryCharge || 0;
    const discount = order.discount || 0;
    const grandTotal = order.grandTotal || (subtotal + deliveryCharge - discount);
    const items = order.items || [];

    const recipient = userEmail || 'me';

    let productRows = '';
    items.forEach((item: any, idx: number) => {
      const lineTotal = (item.price || 0) * (item.cartQuantity || item.quantity || 1);
      productRows += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-size: 13px; color: #475569;">${idx + 1}</td>
          <td style="padding: 10px; font-size: 13px; color: #1e293b; font-weight: 600;">
            ${item.name || 'Product'}
            ${item.selectedVariant ? `<br><small style="color: #64748b;">${item.selectedVariant}</small>` : ''}
          </td>
          <td style="padding: 10px; font-size: 13px; text-align: center; color: #475569;">${item.cartQuantity || item.quantity || 1}</td>
          <td style="padding: 10px; font-size: 13px; text-align: right; color: #475569;">৳${(item.price || 0).toLocaleString()}</td>
          <td style="padding: 10px; font-size: 13px; text-align: right; font-weight: 700; color: #1e293b;">৳${lineTotal.toLocaleString()}</td>
        </tr>
      `;
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <div style="background-color: #005900; color: #ffffff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🛒 আহরোণ - New Order Notification</h1>
      <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Order #${orderId} &bull; ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}</p>
    </div>

    <div style="padding: 25px;">
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Customer Details</h3>
        <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Name:</strong> ${customerName}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Phone:</strong> <a href="tel:${customerPhone}" style="color: #005900; font-weight: bold; text-decoration: none;">${customerPhone}</a></p>
        <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Email:</strong> ${customerEmail}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Delivery Address:</strong> ${customerAddress}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #1e293b;"><strong>Payment Method:</strong> ${paymentMethod}</p>
      </div>

      <h3 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Purchased Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">
            <th style="padding: 10px;">#</th>
            <th style="padding: 10px;">Product</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Unit Price</th>
            <th style="padding: 10px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0; text-align: right;">
        <div style="margin-bottom: 6px; font-size: 13px; color: #475569;">Subtotal: <strong>৳${subtotal.toLocaleString()}</strong></div>
        ${discount > 0 ? `<div style="margin-bottom: 6px; font-size: 13px; color: #dc2626;">Discount: <strong>-৳${discount.toLocaleString()}</strong></div>` : ''}
        <div style="margin-bottom: 6px; font-size: 13px; color: #475569;">Delivery Charge: <strong>৳${deliveryCharge.toLocaleString()}</strong></div>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #e2e8f0; font-size: 18px; font-weight: 800; color: #005900;">
          Grand Total: ৳${grandTotal.toLocaleString()}
        </div>
      </div>
    </div>

    <div style="background-color: #f1f5f9; padding: 15px 25px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
      আহরোণ (Ahoroon) eCommerce Order System &bull; Delivered straight to your Gmail Inbox
    </div>
  </div>
</body>
</html>
    `;

    const subject = `🛒 New Order #${orderId} - ${customerName} (৳${grandTotal.toLocaleString()})`;

    // Form RFC 2822 email format
    const rfc2822 = [
      `To: ${recipient}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent,
    ].join('\r\n');

    const raw = encodeBase64Url(rfc2822);

    // Insert directly into INBOX with UNREAD badge
    const insertRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?internalDateSource=dateHeader', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw,
        labelIds: ['INBOX', 'UNREAD'],
      }),
    });

    if (!insertRes.ok) {
      // Fallback to sending via users/me/messages/send
      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });

      if (!sendRes.ok) {
        const err = await sendRes.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to deliver order email to Gmail');
      }
      const sendData = await sendRes.json();
      return { success: true, id: sendData.id };
    }

    const insertData = await insertRes.json();
    return { success: true, id: insertData.id };
  },

  // Send an outgoing email to a customer or recipient from the authenticated user's Gmail
  async sendEmail(to: string, subject: string, htmlContent: string, accessToken: string): Promise<{ success: boolean; id: string }> {
    const rfc2822 = [
      `To: ${to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent,
    ].join('\r\n');

    const raw = encodeBase64Url(rfc2822);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to send email via Gmail');
    }

    const data = await res.json();
    return { success: true, id: data.id };
  },
};
