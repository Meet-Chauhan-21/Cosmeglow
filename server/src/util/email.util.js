const nodemailer = require('nodemailer');
const dns = require('dns');
const {
  getVerificationTemplate,
  getForgotPasswordTemplate,
  getOrderConfirmationTemplate,
  getAdminNewOrderTemplate,
  getCustomAdminEmailTemplate
} = require('./emailTemplates');

// Force DNS resolver to prefer IPv4 over IPv6 to resolve ENETUNREACH in IPv4-only cloud environments like Render
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const createTransporter = () => {
  // If SMTP service/configurations are provided, use them (such as Brevo)
  if (process.env.SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: If host is gmail/googlemail, use the built-in gmail service configuration
  if (
    process.env.SMTP_HOST &&
    (process.env.SMTP_HOST.includes('gmail') || process.env.SMTP_HOST.includes('googlemail'))
  ) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });
  }

  // Generic SMTP transport configuration (e.g. for Brevo SMTP host smtp-relay.brevo.com)
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    const isSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465';
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
      tls: {
        rejectUnauthorized: false, // Prevents certificate chain validation failures in production
      },
    });
  }

  return null;
};

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Parses and sanitizes recipient emails from strings or arrays.
 * Handles "email@domain.com", "Name <email@domain.com>", comma/semicolon/newline separated values.
 */
const sanitizeRecipientList = (input) => {
  if (!input) return [];
  const rawItems = Array.isArray(input) ? input : String(input).split(/[,;\n\r]+/);
  const recipients = [];

  for (let item of rawItems) {
    if (!item) continue;
    if (typeof item === 'object' && item.email) {
      const cleanEmail = String(item.email).trim().toLowerCase();
      if (EMAIL_REGEX.test(cleanEmail)) {
        recipients.push({ email: cleanEmail, ...(item.name ? { name: String(item.name).trim() } : {}) });
      }
      continue;
    }

    const str = String(item).trim();
    if (!str) continue;

    const angleMatch = str.match(/^(?:["']?([^"']*)["']?\s*)?<([^>]+)>$/);
    if (angleMatch) {
      const name = angleMatch[1]?.trim();
      const email = angleMatch[2]?.trim().toLowerCase();
      if (email && EMAIL_REGEX.test(email)) {
        recipients.push({ email, ...(name ? { name } : {}) });
        continue;
      }
    }

    const cleanEmail = str.replace(/^[<"']+|[>"']+$/g, '').trim().toLowerCase();
    if (EMAIL_REGEX.test(cleanEmail)) {
      recipients.push({ email: cleanEmail });
    }
  }

  return recipients;
};

/**
 * Clean helper function to send emails.
 * Supports both Brevo REST API (HTTPS/443, required for Render Free Tier) and standard Nodemailer (SMTP).
 */
const sendEmail = async ({ to, subject, html, cc, bcc }) => {
  const cleanTo = sanitizeRecipientList(to);
  const cleanCc = sanitizeRecipientList(cc);
  const cleanBcc = sanitizeRecipientList(bcc);

  // Option 1: Brevo REST API (highly recommended for Render Free Tier to bypass SMTP port blocks)
  if (process.env.BREVO_API_KEY) {
    console.log("📨 Sending email via Brevo REST API (HTTPS)...");
    const fromEmail = process.env.EMAIL_FROM || 'dabhisanjay901@gmail.com';
    
    // Parse sender name and email from "Name <email>" format
    let senderName = 'CosmeGlow Skincare';
    let senderEmail = 'dabhisanjay901@gmail.com';
    const match = fromEmail.match(/^(?:["']?([^"']*)["']?\s*)?<([^>]+)>$/);
    if (match) {
      senderName = match[1] || 'CosmeGlow Skincare';
      senderEmail = match[2];
    }

    const fallbackTo = Array.isArray(to) ? to.map(e => ({ email: typeof e === 'string' ? e.trim() : e.email.trim() })) : [{ email: to.trim() }];
    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: cleanTo.length > 0 ? cleanTo : fallbackTo,
      subject: subject,
      htmlContent: html
    };

    if (cleanCc.length > 0) {
      payload.cc = cleanCc;
    }

    if (cleanBcc.length > 0) {
      payload.bcc = cleanBcc;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Brevo API sending failed');
    }
    console.log("✅ Email sent via Brevo REST API successfully:", data);
    return true;
  }

  // Option 2: Standard Nodemailer (SMTP/Gmail)
  const transporter = createTransporter();
  if (transporter) {
    const fromEmail = process.env.EMAIL_FROM || `"CosmeGlow Skincare" <${process.env.SMTP_USER}>`;
    const mailOptions = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: html,
    };
    if (cleanCc.length > 0) {
      mailOptions.cc = cleanCc.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email).join(', ');
    }
    if (cleanBcc.length > 0) {
      mailOptions.bcc = cleanBcc.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email).join(', ');
    }

    const email_info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent via SMTP successfully:", email_info);
    return true;
  }

  // No sender configured, fallback to mock logs in development
  return false;
};

const sendVerificationEmail = async (email, name, token) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verificationUrl = `${clientUrl}/verify-email?token=${token}`;
  const currentYear = new Date().getFullYear().toString();

  const htmlContent = getVerificationTemplate(name, verificationUrl, currentYear);

  console.log("📧 sendVerificationEmail called");
  console.log("Recipient:", email);

  try {
    const sent = await sendEmail({ to: email, subject: 'Verify Your Email Address — COSMEGLOW', html: htmlContent });
    if (!sent) {
      // Development fallback logs
      console.log('\n==================================================');
      console.log('🌿 [MOCK EMAIL] Verification Email Sent');
      console.log(`👤 Recipient Name: ${name}`);
      console.log(`📧 Recipient Email: ${email}`);
      console.log(`🔗 Verification Link: ${verificationUrl}`);
      console.log('==================================================\n');
    }
  } catch (error) {
    console.error("❌ SEND VERIFICATION MAIL ERROR");
    console.error(error);
    throw error;
  }

  return true;
};

const sendOrderConfirmationEmail = async (order, userEmail) => {
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 13px;">${item.name} (${item.selectedSize || '50ml'})</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; text-align: right;">₹${(item.price || 0).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; text-align: right; font-weight: bold;">₹${((item.price || 0) * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const paymentMethodMap = {
    razorpay: 'Razorpay',
    card: 'Online Card',
    cod: 'Cash on Delivery',
  };
  const paymentMethod = paymentMethodMap[order.payment?.method] || order.payment?.method || 'Cash on Delivery';
  const paymentStatus = (order.payment?.status || 'Paid').toUpperCase();
  const transactionId = order.payment?.transactionId || order.payment?.razorpayPaymentId || 'N/A';
  const orderDate = order.payment?.paidAt
    ? new Date(order.payment.paidAt).toLocaleString()
    : new Date().toLocaleString();
  const currentYear = new Date().getFullYear().toString();

  const htmlContent = getOrderConfirmationTemplate(
    order,
    itemsHtml,
    paymentMethod,
    paymentStatus,
    transactionId,
    orderDate,
    currentYear
  );

  try {
    const sent = await sendEmail({ to: userEmail, subject: `Order Confirmation #${order.orderNumber} — COSMEGLOW`, html: htmlContent });
    if (!sent) {
      console.log('\n==================================================');
      console.log('🌿 [MOCK EMAIL] Customer Order Confirmation Email');
      console.log(`📧 Recipient: ${userEmail}`);
      console.log(`📦 Order Number: #${order.orderNumber}`);
      console.log(`💳 Payment Status: ${order.payment?.status}`);
      console.log(`💵 Total Amount: ₹${order.totals?.total}`);
      console.log('==================================================\n');
    }
  } catch (error) {
    console.error("❌ SEND ORDER CONFIRMATION EMAIL ERROR");
    console.error(error);
    throw error;
  }

  return true;
};

const sendAdminNewOrderEmail = async (order, adminEmail) => {
  const paidDate = order.payment?.paidAt
    ? new Date(order.payment.paidAt).toLocaleString()
    : new Date().toLocaleString();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const adminDashboardUrl = process.env.ADMIN_DASHBOARD_URL || `${clientUrl}/admin`;
  const adminOrderUrl = `${adminDashboardUrl}/orders/${order.orderNumber}`;

  const paymentMethodMap = {
    razorpay: 'Razorpay',
    card: 'Online Card',
    cod: 'Cash on Delivery',
  };
  const paymentMethod = paymentMethodMap[order.payment?.method] || order.payment?.method || 'N/A';
  const paymentStatus = (order.payment?.status || 'N/A').toUpperCase();
  const transactionId = order.payment?.transactionId || order.payment?.razorpayPaymentId || 'N/A';
  const currentYear = new Date().getFullYear().toString();

  const htmlContent = getAdminNewOrderTemplate(
    order,
    paidDate,
    adminOrderUrl,
    paymentMethod,
    paymentStatus,
    transactionId,
    currentYear
  );

  try {
    const sent = await sendEmail({ to: adminEmail, subject: `🚨 New Order #${order.orderNumber} Placed — ₹${(order.totals?.total || 0).toFixed(2)}`, html: htmlContent });
    if (!sent) {
      console.log('\n==================================================');
      console.log('🚨 [MOCK EMAIL] Admin New Order Notification');
      console.log(`📧 Admin Email: ${adminEmail}`);
      console.log(`📦 Order Number: #${order.orderNumber}`);
      console.log(`💵 Total Amount: ₹${order.totals?.total}`);
      console.log('==================================================\n');
    }
  } catch (error) {
    console.error("❌ SEND ADMIN NEW ORDER EMAIL ERROR");
    console.error(error);
    throw error;
  }

  return true;
};

const sendPasswordResetEmail = async (email, name, token) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;
  const currentYear = new Date().getFullYear().toString();

  const htmlContent = getForgotPasswordTemplate(name, resetUrl, currentYear);

  console.log("📧 sendPasswordResetEmail called");
  console.log("Recipient:", email);

  try {
    const sent = await sendEmail({ to: email, subject: 'Reset Your Password — COSMEGLOW', html: htmlContent });
    if (!sent) {
      console.log('\n==================================================');
      console.log('🔑 [MOCK EMAIL] Password Reset Email Sent');
      console.log(`👤 Recipient Name: ${name}`);
      console.log(`📧 Recipient Email: ${email}`);
      console.log(`🔗 Password Reset Link: ${resetUrl}`);
      console.log('==================================================\n');
    }
  } catch (error) {
    console.error("❌ SEND PASSWORD RESET MAIL ERROR");
    console.error(error);
    throw error;
  }

  return true;
};

const sendCustomAdminEmail = async ({ to, subject, message, cc, bcc, logoUrl }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resolvedLogo = logoUrl || `${clientUrl}/logo.png`;
  const currentYear = new Date().getFullYear().toString();
  const htmlContent = getCustomAdminEmailTemplate(subject, message, currentYear, resolvedLogo);

  console.log("📧 sendCustomAdminEmail called");
  console.log("Recipient:", to);
  if (cc) console.log("CC:", cc);
  if (bcc) console.log("BCC:", bcc);
  console.log("Subject:", subject);

  try {
    const sent = await sendEmail({ to, subject, html: htmlContent, cc, bcc });
    if (!sent) {
      console.log('\n==================================================');
      console.log('✉️ [MOCK EMAIL] Custom Admin Email Dispatched');
      console.log(`📧 Recipient: ${to}`);
      if (cc) console.log(`📋 CC: ${cc}`);
      if (bcc) console.log(`🔒 BCC: ${bcc}`);
      console.log(`📌 Subject: ${subject}`);
      console.log(`📝 Message:\n${message}`);
      console.log('==================================================\n');
    }
  } catch (error) {
    console.error("❌ SEND CUSTOM ADMIN EMAIL ERROR");
    console.error(error);
    throw error;
  }

  return true;
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendAdminNewOrderEmail,
  sendCustomAdminEmail,
};

