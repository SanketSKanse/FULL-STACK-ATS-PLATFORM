const nodemailer = require('nodemailer');

let cachedTransporter = null;
let isTestTransporter = false;

async function getTransporter() {
  require('dotenv').config();

  // If real SMTP credentials are provided in .env
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    if (!cachedTransporter || isTestTransporter) {
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = Number(process.env.SMTP_PORT) || (host.includes('gmail') ? 465 : 587);
      const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465;

      cachedTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      isTestTransporter = false;
      console.log(`[EmailService] Active LIVE SMTP transporter configured for ${process.env.SMTP_USER} via ${host}:${port}`);
    }
    return { transporter: cachedTransporter, isTest: false };
  }

  if (cachedTransporter && isTestTransporter) {
    return { transporter: cachedTransporter, isTest: true };
  }

  // Automatic testing fallback: Ethereal Email test account (instant preview link without real credentials)
  console.log('[EmailService] ⚠️ No SMTP_USER / SMTP_PASS found in server/.env.');
  console.log('[EmailService] Emails cannot reach real inboxes without SMTP credentials. Using Ethereal test account...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isTestTransporter = true;
    console.log(`[EmailService] Ethereal test account created: ${testAccount.user}`);
    return { transporter: cachedTransporter, isTest: true };
  } catch (err) {
    console.error('[EmailService] Failed to create Ethereal test account, using JSON/stream transporter fallback:', err.message);
    cachedTransporter = nodemailer.createTransport({ jsonTransport: true });
    isTestTransporter = true;
    return { transporter: cachedTransporter, isTest: true };
  }
}

/**
 * Dispatches an official branded invitation email to a teammate.
 */
async function sendInvitationEmail({ to, name, inviterName, companyName, role, note, inviteUrl }) {
  const { transporter, isTest } = await getTransporter();

  const fromAddress = process.env.SMTP_FROM || `"${companyName || 'AvantHire'} via AvantHire" <no-reply@avanthire.com>`;
  const subject = `You've been invited by ${inviterName} to join ${companyName} on AvantHire`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to join ${companyName} on AvantHire</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F2854; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0F2854; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.1);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F2854 0%, #1C4D8D 60%, #4988C4 100%); padding: 36px 36px 30px; text-align: left;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width: 44px; height: 44px; background-color: #BDE8F5; border-radius: 12px; text-align: center; vertical-align: middle; font-weight: 800; font-size: 22px; color: #0F2854; font-family: monospace;">
                    A
                  </td>
                  <td style="padding-left: 14px;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #BDE8F5;">Enterprise ATS</div>
                    <div style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.03em;">AvantHire</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <div style="display: inline-block; padding: 4px 12px; background-color: #e0f2fe; color: #0369a1; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 16px; border: 1px solid #bae6fd;">
                TEAM INVITATION
              </div>

              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #0F2854; letter-spacing: -0.03em; line-height: 1.3;">
                Hi ${name || 'there'}, join the hiring team at ${companyName}
              </h1>

              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #334155;">
                <strong style="color: #0F2854;">${inviterName}</strong> has invited you to collaborate on the hiring pipeline for <strong style="color: #1C4D8D;">${companyName}</strong> on AvantHire as <span style="display: inline-block; background-color: #f1f5f9; padding: 2px 8px; border-radius: 6px; font-weight: 600; color: #1C4D8D;">${role}</span>.
              </p>

              ${note ? `
              <!-- Personal Note Quote -->
              <div style="margin: 22px 0; padding: 16px 20px; background-color: #f8fafc; border-left: 4px solid #4988C4; border-radius: 0 12px 12px 0;">
                <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;">Note from ${inviterName}:</div>
                <div style="font-size: 14px; font-style: italic; color: #1e293b; line-height: 1.5;">"${note}"</div>
              </div>
              ` : ''}

              <p style="margin: 20px 0 28px; font-size: 14px; line-height: 1.6; color: #64748b;">
                As a team member, you will be able to review candidate applications, manage talent stages, coordinate interviews, and streamline your recruitment workflows.
              </p>

              <!-- CTA Button -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0 24px;">
                <tr>
                  <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #1C4D8D 0%, #0F2854 100%);">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(15,40,84,0.35);">
                      Accept Invitation & Join Team &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Link -->
              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                If the button above does not work, copy and paste this link into your browser:
                <br>
                <a href="${inviteUrl}" target="_blank" style="color: #1C4D8D; word-break: break-all; text-decoration: underline;">
                  ${inviteUrl}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 36px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This invitation was sent by AvantHire ATS to <span style="color: #64748b;">${to}</span>. This link will expire in 7 days.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${name || 'there'},

${inviterName} has invited you to join ${companyName}'s hiring team on AvantHire as ${role}.

${note ? `Note from ${inviterName}: "${note}"\n\n` : ''}
To accept this invitation and join your team workspace, open the link below:
${inviteUrl}

This link will expire in 7 days.

Best regards,
The AvantHire Team
  `.trim();

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  console.log(`[EmailService] Invitation email successfully dispatched to: ${to}`);
  console.log(`[EmailService] Message ID: ${info.messageId}`);
  if (previewUrl) {
    console.log(`[EmailService] 🔗 TEST EMAIL PREVIEW URL: ${previewUrl}`);
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
    isTestAccount: isTest,
  };
}

module.exports = {
  sendInvitationEmail,
};
