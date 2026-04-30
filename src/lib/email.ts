/**
 * Email utility using Resend REST API (no npm package required).
 * Set RESEND_API_KEY in your .env to enable real emails.
 * In development without the key, emails are logged to console.
 *
 * Get a free API key at: https://resend.com
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'BahirDar Homes <noreply@bahirdarhomes.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'BahirDar Homes'

interface EmailPayload {
  to: string
  subject: string
  html: string
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    // Dev fallback — log to console
    console.log('\n📧 [EMAIL - DEV MODE]')
    console.log(`To: ${payload.to}`)
    console.log(`Subject: ${payload.subject}`)
    console.log(`Body preview: ${payload.html.replace(/<[^>]+>/g, '').slice(0, 200)}`)
    console.log('---')
    return true
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Email] Resend error:', err)
      return false
    }
    return true
  } catch (e) {
    console.error('[Email] Failed to send:', e)
    return false
  }
}

// ── Email templates ──────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">${APP_NAME}</h1>
            <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Bahir Dar, Ethiopia</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
              <a href="${APP_URL}" style="color:#2563eb;text-decoration:none;">${APP_URL}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendPasswordResetEmail(to: string, token: string, name?: string | null): Promise<boolean> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Reset Your Password</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      Hi ${name || 'there'}, we received a request to reset your password.
      Click the button below to choose a new one.
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${resetUrl}"
        style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:600;font-size:15px;
               padding:14px 32px;border-radius:10px;text-decoration:none;">
        Reset Password
      </a>
    </div>
    <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;text-align:center;">
      This link expires in <strong>1 hour</strong>.
    </p>
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
      If you didn't request this, you can safely ignore this email.
    </p>
    <div style="margin:24px 0 0;padding:16px;background:#f9fafb;border-radius:8px;word-break:break-all;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">Or copy this link:</p>
      <p style="margin:4px 0 0;color:#2563eb;font-size:12px;">${resetUrl}</p>
    </div>
  `)
  return sendEmail({ to, subject: `Reset your ${APP_NAME} password`, html })
}

export async function sendEmailVerificationEmail(to: string, token: string, name?: string | null): Promise<boolean> {
  const verifyUrl = `${APP_URL}/auth/verify-email?token=${token}`
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Verify Your Email</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      Welcome to ${APP_NAME}${name ? `, ${name}` : ''}! Please verify your email address to activate your account.
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${verifyUrl}"
        style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:600;font-size:15px;
               padding:14px 32px;border-radius:10px;text-decoration:none;">
        Verify Email Address
      </a>
    </div>
    <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;text-align:center;">
      This link expires in <strong>24 hours</strong>.
    </p>
    <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `)
  return sendEmail({ to, subject: `Verify your ${APP_NAME} email`, html })
}

export async function sendInquiryNotificationEmail(
  to: string,
  landlordName: string | null,
  tenantName: string | null,
  propertyTitle: string,
  message: string,
  propertyId: string,
): Promise<boolean> {
  const propertyUrl = `${APP_URL}/properties/${propertyId}`
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">New Inquiry Received</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      Hi ${landlordName || 'there'}, <strong>${tenantName || 'A tenant'}</strong> sent an inquiry about your property.
    </p>
    <div style="background:#f0f9ff;border-left:4px solid #2563eb;padding:16px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0 0 4px;color:#1e40af;font-size:13px;font-weight:600;">Property</p>
      <p style="margin:0 0 12px;color:#111827;font-size:15px;font-weight:600;">${propertyTitle}</p>
      <p style="margin:0 0 4px;color:#1e40af;font-size:13px;font-weight:600;">Message</p>
      <p style="margin:0;color:#374151;font-size:14px;">${message}</p>
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}/dashboard/landlord"
        style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:600;font-size:14px;
               padding:12px 28px;border-radius:10px;text-decoration:none;">
        Reply in Dashboard
      </a>
    </div>
  `)
  return sendEmail({ to, subject: `New inquiry on "${propertyTitle}"`, html })
}

export async function sendInquiryReplyEmail(
  to: string,
  tenantName: string | null,
  landlordName: string | null,
  propertyTitle: string,
  reply: string,
  propertyId: string,
): Promise<boolean> {
  const propertyUrl = `${APP_URL}/properties/${propertyId}`
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Your Inquiry Was Answered</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      Hi ${tenantName || 'there'}, <strong>${landlordName || 'The landlord'}</strong> replied to your inquiry about:
    </p>
    <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0 0 4px;color:#15803d;font-size:13px;font-weight:600;">Property</p>
      <p style="margin:0 0 12px;color:#111827;font-size:15px;font-weight:600;">${propertyTitle}</p>
      <p style="margin:0 0 4px;color:#15803d;font-size:13px;font-weight:600;">Reply</p>
      <p style="margin:0;color:#374151;font-size:14px;">${reply}</p>
    </div>
    <div style="text-align:center;">
      <a href="${propertyUrl}"
        style="display:inline-block;background:#16a34a;color:#ffffff;font-weight:600;font-size:14px;
               padding:12px 28px;border-radius:10px;text-decoration:none;">
        View Property
      </a>
    </div>
  `)
  return sendEmail({ to, subject: `Reply to your inquiry on "${propertyTitle}"`, html })
}

export async function sendPropertyVerificationEmail(
  to: string,
  landlordName: string | null,
  propertyTitle: string,
  status: 'VERIFIED' | 'REJECTED',
  notes?: string | null,
): Promise<boolean> {
  const isVerified = status === 'VERIFIED'
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">
      Property ${isVerified ? '✅ Verified' : '❌ Rejected'}
    </h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      Hi ${landlordName || 'there'}, your property listing has been reviewed.
    </p>
    <div style="background:${isVerified ? '#f0fdf4' : '#fef2f2'};border-left:4px solid ${isVerified ? '#16a34a' : '#dc2626'};
                padding:16px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0 0 4px;color:${isVerified ? '#15803d' : '#b91c1c'};font-size:13px;font-weight:600;">Property</p>
      <p style="margin:0 0 12px;color:#111827;font-size:15px;font-weight:600;">${propertyTitle}</p>
      <p style="margin:0 0 4px;color:${isVerified ? '#15803d' : '#b91c1c'};font-size:13px;font-weight:600;">Status</p>
      <p style="margin:0 0 ${notes ? '12px' : '0'};color:#374151;font-size:14px;font-weight:600;">
        ${isVerified ? '✅ Verified — your listing is now live!' : '❌ Rejected — please review and resubmit.'}
      </p>
      ${notes ? `
        <p style="margin:0 0 4px;color:${isVerified ? '#15803d' : '#b91c1c'};font-size:13px;font-weight:600;">Admin Notes</p>
        <p style="margin:0;color:#374151;font-size:14px;">${notes}</p>
      ` : ''}
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}/dashboard/landlord"
        style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:600;font-size:14px;
               padding:12px 28px;border-radius:10px;text-decoration:none;">
        Go to Dashboard
      </a>
    </div>
  `)
  return sendEmail({
    to,
    subject: `Your property "${propertyTitle}" has been ${isVerified ? 'verified' : 'rejected'}`,
    html,
  })
}
