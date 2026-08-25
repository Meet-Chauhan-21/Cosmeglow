const getVerificationTemplate = (name, verificationUrl, currentYear) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Verify Your Email</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 10px !important; }
      .container { padding: 20px 15px !important; width: 100% !important; max-width: 100% !important; }
      .title { font-size: 19px !important; }
      .text { font-size: 14px !important; }
      .button { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; padding: 14px 10px !important; }
      .link-box { word-break: break-all !important; font-size: 12px !important; }
    }
  </style>
</head>
<body style="background:#f9fafb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#222222; line-height:1.6; margin:0; padding:0; box-sizing:border-box;">
  <div class="email-wrapper" style="width:100%; background:#f9fafb; padding: 30px 10px; box-sizing: border-box;">
    <div class="container" style="max-width:600px; width:100%; margin:0 auto; padding:35px 25px; background:#ffffff; border: 1px solid #eaeaea; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); box-sizing: border-box;">
      <div class="header" style="border-bottom:1px solid #e5e5e5; padding-bottom:20px; text-align: center;">
        <div class="logo" style="font-size:26px; font-weight:800; letter-spacing:4px; color:#111111; font-family:Arial,sans-serif;">
          COSMEGLOW
        </div>
        <div style="font-size:10px; text-transform:uppercase; letter-spacing:2px; color:#666666; margin-top:4px;">Biological Cellular Restoration Apothecary</div>
      </div>
      
      <div class="section" style="padding:25px 0; border-bottom:1px solid #ececec;">
        <div class="title" style="font-size:22px; font-weight:700; color:#111111; margin-bottom:16px; text-align: center;">
          Verify Your Email Address
        </div>
        <p class="text" style="font-size:15px; color:#444444; margin-bottom:16px; line-height: 1.6;">
          Hello <strong>${name}</strong>,
        </p>
        <p class="text" style="font-size:15px; color:#444444; margin-bottom:24px; line-height: 1.6;">
          Thank you for creating your COSMEGLOW account. Please verify your email address to activate your account and complete your registration.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" target="_blank" class="button" style="display:inline-block; background:#111111; color:#ffffff !important; text-decoration:none; padding:14px 32px; font-size:14px; font-weight:600; border-radius: 6px; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
            Verify Email Address
          </a>
        </div>
        <p class="expiry" style="margin-top:20px; font-size:13px; color:#888888; text-align: center;">
          This verification link will expire in <strong>24 hours</strong>.
        </p>
      </div>

      <div class="section" style="padding:25px 0; border-bottom:1px solid #ececec;">
        <div class="section-title" style="font-size:15px; font-weight:600; color:#111111; margin-bottom:10px;">
          Verification Link
        </div>
        <p class="text" style="font-size:13px; color:#666666; margin-bottom:10px;">
          If the button above doesn't work, copy and paste the following link into your web browser:
        </p>
        <div class="link-box" style="padding:12px; border:1px solid #e5e5e5; background:#fafafa; font-size:12px; color:#444444; word-break:break-all; word-wrap:break-word; border-radius: 6px; line-height: 1.5;">
          ${verificationUrl}
        </div>
      </div>

      <div class="section" style="padding:20px 0; border-bottom:1px solid #ececec;">
        <div class="section-title" style="font-size:14px; font-weight:600; color:#111111; margin-bottom:8px;">
          Security Notice
        </div>
        <p class="note" style="font-size:13px; color:#777777; line-height: 1.5; margin: 0;">
          If you did not create a COSMEGLOW account, you can safely ignore this email. No account will be activated unless the email address is verified.
        </p>
      </div>

      <div class="section support" style="padding:20px 0; border-bottom: none; text-align: center;">
        <p class="text" style="font-size:13px; color:#666666; margin: 0;">
          Need assistance? Contact our support team at
          <a href="mailto:support@cosmeglow.com" style="color:#111111; text-decoration:none; font-weight:600;">support@cosmeglow.com</a>.
        </p>
      </div>

      <div class="footer" style="padding-top:20px; text-align:center; font-size:12px; color:#999999; border-top: 1px solid #eaeaea;">
        © ${currentYear} <strong>COSMEGLOW</strong>. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;

const getForgotPasswordTemplate = (name, resetUrl, currentYear) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Reset Your Password</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 10px !important; }
      .container { padding: 20px 15px !important; width: 100% !important; max-width: 100% !important; }
      .title { font-size: 19px !important; }
      .text { font-size: 14px !important; }
      .button { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; padding: 14px 10px !important; }
      .link-box { word-break: break-all !important; font-size: 12px !important; }
    }
  </style>
</head>
<body style="background:#f9fafb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#222222; line-height:1.6; margin:0; padding:0; box-sizing:border-box;">
  <div class="email-wrapper" style="width:100%; background:#f9fafb; padding: 30px 10px; box-sizing: border-box;">
    <div class="container" style="max-width:600px; width:100%; margin:0 auto; padding:35px 25px; background:#ffffff; border: 1px solid #eaeaea; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); box-sizing: border-box;">
      <div class="header" style="border-bottom:1px solid #e5e5e5; padding-bottom:20px; text-align: center;">
        <div class="logo" style="font-size:26px; font-weight:800; letter-spacing:4px; color:#111111; font-family:Arial,sans-serif;">
          COSMEGLOW
        </div>
        <div style="font-size:10px; text-transform:uppercase; letter-spacing:2px; color:#666666; margin-top:4px;">Biological Cellular Restoration Apothecary</div>
      </div>
      
      <div class="section" style="padding:25px 0; border-bottom:1px solid #ececec;">
        <div class="title" style="font-size:22px; font-weight:700; color:#111111; margin-bottom:16px; text-align: center;">
          Password Reset Request
        </div>
        <p class="text" style="font-size:15px; color:#444444; margin-bottom:16px; line-height: 1.6;">
          Hello <strong>${name}</strong>,
        </p>
        <p class="text" style="font-size:15px; color:#444444; margin-bottom:24px; line-height: 1.6;">
          We received a request to reset your password for your COSMEGLOW account. Click the button below to set a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" target="_blank" class="button" style="display:inline-block; background:#111111; color:#ffffff !important; text-decoration:none; padding:14px 32px; font-size:14px; font-weight:600; border-radius: 6px; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
            Reset Password
          </a>
        </div>
        <p class="expiry" style="margin-top:20px; font-size:13px; color:#888888; text-align: center;">
          This password reset link will expire in <strong>1 hour</strong>.
        </p>
      </div>

      <div class="section" style="padding:25px 0; border-bottom:1px solid #ececec;">
        <div class="section-title" style="font-size:15px; font-weight:600; color:#111111; margin-bottom:10px;">
          Reset Link
        </div>
        <p class="text" style="font-size:13px; color:#666666; margin-bottom:10px;">
          If the button above doesn't work, copy and paste the following link into your web browser:
        </p>
        <div class="link-box" style="padding:12px; border:1px solid #e5e5e5; background:#fafafa; font-size:12px; color:#444444; word-break:break-all; word-wrap:break-word; border-radius: 6px; line-height: 1.5;">
          ${resetUrl}
        </div>
      </div>

      <div class="section" style="padding:20px 0; border-bottom:1px solid #ececec;">
        <div class="section-title" style="font-size:14px; font-weight:600; color:#111111; margin-bottom:8px;">
          Security Notice
        </div>
        <p class="note" style="font-size:13px; color:#777777; line-height: 1.5; margin: 0;">
          If you did not request a password reset, please ignore this email or contact support if you have concerns about your account security.
        </p>
      </div>

      <div class="section support" style="padding:20px 0; border-bottom: none; text-align: center;">
        <p class="text" style="font-size:13px; color:#666666; margin: 0;">
          Need assistance? Contact our support team at
          <a href="mailto:support@cosmeglow.com" style="color:#111111; text-decoration:none; font-weight:600;">support@cosmeglow.com</a>.
        </p>
      </div>

      <div class="footer" style="padding-top:20px; text-align:center; font-size:12px; color:#999999; border-top: 1px solid #eaeaea;">
        © ${currentYear} <strong>COSMEGLOW</strong>. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;

const getOrderConfirmationTemplate = (order, itemsHtml, paymentMethod, paymentStatus, transactionId, orderDate, currentYear) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Order Confirmation</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 8px !important; }
      .container { padding: 18px 12px !important; width: 100% !important; max-width: 100% !important; }
      .title { font-size: 19px !important; }
      .info-table td { padding: 6px 0 !important; font-size: 13px !important; }
      .items-table th, .items-table td { padding: 8px 4px !important; font-size: 12px !important; word-break: break-word !important; }
      .totals-box { width: 100% !important; max-width: 100% !important; margin-left: 0 !important; }
    }
  </style>
</head>
<body style="background:#f9fafb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#222222; line-height:1.6; margin:0; padding:0; box-sizing:border-box;">
  <div class="email-wrapper" style="width:100%; background:#f9fafb; padding: 25px 10px; box-sizing: border-box;">
    <div class="container" style="max-width:600px; width:100%; margin:0 auto; padding:35px 25px; background:#ffffff; border: 1px solid #eaeaea; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); box-sizing: border-box;">
      <div class="header" style="border-bottom:1px solid #e5e5e5; padding-bottom:20px; text-align: center;">
        <div class="logo" style="font-size:26px; font-weight:800; letter-spacing:4px; color:#111111; font-family:Arial,sans-serif;">
          COSMEGLOW
        </div>
        <div style="font-size:10px; text-transform:uppercase; letter-spacing:2px; color:#666666; margin-top:4px;">Biological Cellular Restoration Apothecary</div>
      </div>
      
      <div class="section" style="padding:25px 0; border-bottom:1px solid #ececec;">
        <div class="title" style="font-size:22px; font-weight:700; color:#111111; margin-bottom:16px; text-align: center;">
          Order Confirmed
        </div>
        <p class="text" style="font-size:15px; color:#444444; margin-bottom:12px;">
          Hello <strong>${order.shippingAddress?.name || ''}</strong>,
        </p>
        <p class="text" style="font-size:14px; color:#555555; margin-bottom:18px;">
          Thank you for shopping with COSMEGLOW. Your order has been successfully placed and is currently being processed. We'll notify you again once your order has been shipped.
        </p>
      </div>

      <div class="section" style="padding:25px 0; border-bottom:1px solid #ececec;">
        <div class="section-title" style="font-size:15px; font-weight:600; color:#111111; margin-bottom:15px;">
          Order Details
        </div>
        <table class="info-table" style="width:100%; border-collapse:collapse; table-layout:fixed;">
          <tr>
            <td style="padding:8px 0; font-size:14px; color:#666666; word-break:break-word;">Order Number</td>
            <td style="padding:8px 0; font-size:14px; color:#111111; font-weight:600; text-align:right; word-break:break-all;">#${order.orderNumber || ''}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-size:14px; color:#666666; word-break:break-word;">Payment Method</td>
            <td style="padding:8px 0; font-size:14px; color:#111111; font-weight:600; text-align:right; word-break:break-word;">${paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-size:14px; color:#666666; word-break:break-word;">Payment Status</td>
            <td style="padding:8px 0; font-size:14px; color:#111111; font-weight:600; text-align:right; word-break:break-word;">${paymentStatus}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-size:14px; color:#666666; word-break:break-word;">Transaction ID</td>
            <td style="padding:8px 0; font-size:14px; color:#111111; font-weight:600; text-align:right; word-break:break-all;">${transactionId}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-size:14px; color:#666666; word-break:break-word;">Order Date</td>
            <td style="padding:8px 0; font-size:14px; color:#111111; font-weight:600; text-align:right; word-break:break-word;">${orderDate}</td>
          </tr>
        </table>
      </div>

      <div class="section" style="padding:25px 0; border-bottom:1px solid #ececec;">
        <div class="section-title" style="font-size:15px; font-weight:600; color:#111111; margin-bottom:15px;">
          Items Ordered
        </div>
        <div style="width:100%; overflow-x:auto;">
          <table class="items-table" style="width:100%; border-collapse:collapse; table-layout:fixed;">
            <thead>
              <tr>
                <th style="text-align:left; font-size:13px; color:#666666; padding:10px 4px; border-bottom:1px solid #dddddd; width:45%;">Item</th>
                <th style="text-align:center; font-size:13px; color:#666666; padding:10px 4px; border-bottom:1px solid #dddddd; width:15%;">Qty</th>
                <th style="text-align:right; font-size:13px; color:#666666; padding:10px 4px; border-bottom:1px solid #dddddd; width:20%;">Price</th>
                <th style="text-align:right; font-size:13px; color:#666666; padding:10px 4px; border-bottom:1px solid #dddddd; width:20%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        
        <div class="totals-box" style="width:100%; max-width:260px; margin-left:auto; margin-top:20px;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0; font-size:14px; color:#666666;">Subtotal</td>
              <td style="padding:6px 0; font-size:14px; color:#111111; text-align:right;">₹${(order.totals?.subtotal || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; font-size:14px; color:#666666;">Shipping</td>
              <td style="padding:6px 0; font-size:14px; color:#111111; text-align:right;">₹${(order.totals?.shipping || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0; font-size:14px; color:#666666;">Tax</td>
              <td style="padding:6px 0; font-size:14px; color:#111111; text-align:right;">₹${(order.totals?.tax || 0).toFixed(2)}</td>
            </tr>
            <tr class="grand-total">
              <td style="border-top:1px solid #dddddd; padding-top:10px; font-size:16px; font-weight:bold; color:#111111;">Total</td>
              <td style="border-top:1px solid #dddddd; padding-top:10px; font-size:16px; font-weight:bold; color:#111111; text-align:right;">₹${(order.totals?.total || 0).toFixed(2)}</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="section" style="padding:25px 0; border-bottom:1px solid #ececec;">
        <div class="section-title" style="font-size:15px; font-weight:600; color:#111111; margin-bottom:15px;">
          Shipping Address
        </div>
        <div class="address" style="font-size:14px; color:#555555; line-height:1.8; word-break:break-word;">
          <strong>${order.shippingAddress?.name || ''}</strong><br>
          ${order.shippingAddress?.street || ''}<br>
          ${order.shippingAddress?.district || ''}, ${order.shippingAddress?.state || ''}<br>
          ${order.shippingAddress?.country || ''} - ${order.shippingAddress?.zip || ''}<br>
          Phone: ${order.shippingAddress?.phone || ''}
        </div>
      </div>

      <div class="section support" style="padding:20px 0; border-bottom: none; text-align: center;">
        <p style="font-size:13px; color:#666666; margin: 0; line-height: 1.6;">
          If you have any questions regarding your order, please contact us at
          <a href="mailto:support@cosmeglow.com" style="color:#111111; text-decoration:none; font-weight:600;">support@cosmeglow.com</a>
          and include your order number in your message.
        </p>
      </div>

      <div class="footer" style="padding-top:20px; text-align:center; font-size:12px; color:#999999; border-top: 1px solid #eaeaea;">
        © ${currentYear} <strong>COSMEGLOW</strong>. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;

const getAdminNewOrderTemplate = (order, paidDate, adminOrderUrl, paymentMethod, paymentStatus, transactionId, currentYear) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>New Paid Order - COSMEGLOW Admin</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 8px !important; }
      .container { padding: 18px 12px !important; width: 100% !important; max-width: 100% !important; }
      .title { font-size: 19px !important; }
      .amount { font-size: 28px !important; }
      .info-table td { padding: 8px 0 !important; font-size: 13px !important; }
      .button { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="background:#f9fafb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#222222; line-height:1.6; margin:0; padding:0; box-sizing:border-box;">
  <div class="email-wrapper" style="width:100%; background:#f9fafb; padding: 25px 10px; box-sizing: border-box;">
    <div class="container" style="max-width:600px; width:100%; margin:0 auto; padding:35px 25px; background:#ffffff; border: 1px solid #eaeaea; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); box-sizing: border-box;">
      <div class="header" style="border-bottom:1px solid #e5e5e5; padding-bottom:20px; text-align: center;">
        <div class="logo" style="font-size:26px; font-weight:800; letter-spacing:4px; color:#111111; font-family:Arial,sans-serif;">
          COSMEGLOW
        </div>
        <div style="font-size:10px; text-transform:uppercase; letter-spacing:2px; color:#666666; margin-top:4px;">Admin Notification System</div>
      </div>
      
      <div class="section" style="padding:25px 0; border-bottom:1px solid #ececec; text-align: center;">
        <div class="title" style="font-size:22px; font-weight:700; color:#c2410c; margin-bottom:12px;">
          🚨 New Paid Order Received
        </div>
        <p class="text" style="font-size:14px; color:#555555; margin-bottom:18px;">
          A customer has successfully placed an order. Please review and process for fulfillment.
        </p>
        <div class="amount" style="font-size:34px; font-weight:800; color:#111111; margin-top:10px;">
          ₹${(order.totals?.total || 0).toFixed(2)}
        </div>
      </div>

      <div class="section" style="padding:25px 0; border-bottom:1px solid #ececec;">
        <div class="section-title" style="font-size:15px; font-weight:600; color:#111111; margin-bottom:15px;">
          Order Details
        </div>
        <table class="info-table" style="width:100%; border-collapse:collapse; table-layout:fixed;">
          <tr>
            <td style="padding:10px 0; font-size:14px; color:#666666; border-bottom:1px solid #f3f3f3; width:40%; word-break:break-word;">Order Number</td>
            <td style="padding:10px 0; font-size:14px; color:#111111; font-weight:600; border-bottom:1px solid #f3f3f3; width:60%; word-break:break-all;">#${order.orderNumber || ''}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; font-size:14px; color:#666666; border-bottom:1px solid #f3f3f3; word-break:break-word;">Customer Name</td>
            <td style="padding:10px 0; font-size:14px; color:#111111; font-weight:600; border-bottom:1px solid #f3f3f3; word-break:break-word;">${order.shippingAddress?.name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; font-size:14px; color:#666666; border-bottom:1px solid #f3f3f3; word-break:break-word;">Customer Phone</td>
            <td style="padding:10px 0; font-size:14px; color:#111111; font-weight:600; border-bottom:1px solid #f3f3f3; word-break:break-word;">${order.shippingAddress?.phone || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; font-size:14px; color:#666666; border-bottom:1px solid #f3f3f3; word-break:break-word;">Payment Method</td>
            <td style="padding:10px 0; font-size:14px; color:#111111; font-weight:600; border-bottom:1px solid #f3f3f3; word-break:break-word;">${paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; font-size:14px; color:#666666; border-bottom:1px solid #f3f3f3; word-break:break-word;">Payment Status</td>
            <td style="padding:10px 0; font-size:14px; color:#111111; font-weight:600; border-bottom:1px solid #f3f3f3; word-break:break-word;">${paymentStatus}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; font-size:14px; color:#666666; border-bottom:1px solid #f3f3f3; word-break:break-word;">Transaction ID</td>
            <td style="padding:10px 0; font-size:14px; color:#111111; font-weight:600; border-bottom:1px solid #f3f3f3; word-break:break-all;">${transactionId}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; font-size:14px; color:#666666; border-bottom:1px solid #f3f3f3; word-break:break-word;">Date</td>
            <td style="padding:10px 0; font-size:14px; color:#111111; font-weight:600; border-bottom:1px solid #f3f3f3; word-break:break-word;">${paidDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; font-size:14px; color:#666666; border-bottom:1px solid #f3f3f3; word-break:break-word;">Total Items</td>
            <td style="padding:10px 0; font-size:14px; color:#111111; font-weight:600; border-bottom:1px solid #f3f3f3; word-break:break-word;">${(order.items || []).length}</td>
          </tr>
        </table>
      </div>

      <div class="section" style="padding:25px 0; border-bottom: none; text-align: center;">
        <a href="${adminOrderUrl}" target="_blank" class="button" style="display:inline-block; background:#111111; color:#ffffff !important; text-decoration:none; padding:14px 32px; font-size:14px; font-weight:600; border-radius: 6px; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
          View Order in Dashboard
        </a>
        <p class="note" style="margin-top:16px; font-size:13px; color:#666666;">
          Open CosmeGlow Admin Dashboard to manage shipping and fulfillment.
        </p>
      </div>

      <div class="footer" style="padding-top:20px; text-align:center; font-size:12px; color:#999999; border-top: 1px solid #eaeaea;">
        © ${currentYear} <strong>COSMEGLOW Admin</strong>. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  getVerificationTemplate,
  getForgotPasswordTemplate,
  getOrderConfirmationTemplate,
  getAdminNewOrderTemplate
};
