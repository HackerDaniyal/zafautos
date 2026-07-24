/**
 * Branded email templates for Supabase Auth.
 *
 * These HTML templates are configured in the Supabase Dashboard:
 * Authentication → Email Templates
 *
 * Supabase supports these template variables:
 * {{ .Email }}        - user's email
 * {{ .Token }}        - confirmation/reset token
 * {{ .TokenHash }}    - hashed token
 * {{ .SiteURL }}      - your site URL
 * {{ .RedirectTo }}   - redirect URL
 * {{ .Data }}         - user metadata
 */

const BRANDING = {
  appName: 'ZafAutos Japan',
  logoUrl: 'https://placehold.co/200x50/0A0A0A/E5231B?text=ZAF+AUTOS',
  primaryColor: '#E5231B',
  darkBg: '#0A0A0A',
  carbonBg: '#1A1A1A',
  white: '#FFFFFF',
  ash: '#9A9A9A',
  steel: '#6E6E6E',
  footerText: 'ZafAutos Japan — Imported. Inspected. Ready.',
  baseUrl: 'http://localhost:3000',
};

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRANDING.appName}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRANDING.darkBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRANDING.darkBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:${BRANDING.carbonBg};border-radius:10px;border:1px solid #2A2A2A;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #2A2A2A;">
              <img src="${BRANDING.logoUrl}" alt="${BRANDING.appName}" width="160" style="display:inline-block;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2A2A2A;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:${BRANDING.steel};">${BRANDING.footerText}</p>
              <p style="margin:0;font-size:11px;color:${BRANDING.steel};">
                <a href="${BRANDING.baseUrl}" style="color:${BRANDING.steel};text-decoration:underline;">Website</a>
                &nbsp;&bull;&nbsp;
                <a href="${BRANDING.baseUrl}/contact" style="color:${BRANDING.steel};text-decoration:underline;">Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Template: Email Verification ───────────────────────────────────────────

export function verificationEmail(tokenHash: string, redirectTo?: string): string {
  const verifyUrl = `${BRANDING.baseUrl}/auth/callback?token=${tokenHash}${redirectTo ? `&next=${encodeURIComponent(redirectTo)}` : ''}`;

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:${BRANDING.white};">Verify your email</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BRANDING.ash};">
      Thanks for signing up for ${BRANDING.appName}. Please confirm your email address to get started.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background-color:${BRANDING.primaryColor};color:${BRANDING.white};font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:${BRANDING.steel};">
      Or copy this link:
    </p>
    <p style="margin:0;font-size:12px;color:${BRANDING.steel};word-break:break-all;">
      ${verifyUrl}
    </p>
    <p style="margin:24px 0 0;font-size:13px;color:${BRANDING.steel};">
      If you didn&apos;t create an account, you can safely ignore this email.
    </p>`;

  return wrapTemplate(content);
}

// ─── Template: Password Reset ───────────────────────────────────────────────

export function passwordResetEmail(tokenHash: string): string {
  const resetUrl = `${BRANDING.baseUrl}/reset-password?token=${tokenHash}`;

  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:${BRANDING.white};">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BRANDING.ash};">
      We received a request to reset the password for your ${BRANDING.appName} account.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background-color:${BRANDING.primaryColor};color:${BRANDING.white};font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:${BRANDING.steel};">
      Or copy this link:
    </p>
    <p style="margin:0;font-size:12px;color:${BRANDING.steel};word-break:break-all;">
      ${resetUrl}
    </p>
    <p style="margin:24px 0 0;font-size:13px;color:${BRANDING.steel};">
      This link expires in 1 hour. If you didn&apos;t request a password reset, you can safely ignore this email.
    </p>`;

  return wrapTemplate(content);
}

// ─── Template: User Invitation ──────────────────────────────────────────────

export function invitationEmail(inviteUrl: string, invitedBy?: string): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:${BRANDING.white};">You&apos;re invited!</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BRANDING.ash};">
      ${invitedBy ? `<strong>${invitedBy}</strong> has invited you to join` : `You&apos;ve been invited to join`} ${BRANDING.appName}.
      Set your password to activate your account.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;background-color:${BRANDING.primaryColor};color:${BRANDING.white};font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:${BRANDING.steel};">
      Or copy this link:
    </p>
    <p style="margin:0;font-size:12px;color:${BRANDING.steel};word-break:break-all;">
      ${inviteUrl}
    </p>
    <p style="margin:24px 0 0;font-size:13px;color:${BRANDING.steel};">
      If you weren&apos;t expecting this invitation, you can safely ignore this email.
    </p>`;

  return wrapTemplate(content);
}

// ─── Template: Welcome ──────────────────────────────────────────────────────

export function welcomeEmail(firstName?: string): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:${BRANDING.white};">
      Welcome to ${BRANDING.appName}${firstName ? `, ${firstName}` : ''}!
    </h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BRANDING.ash};">
      Your account is now active. You can start browsing our inventory of quality Japanese vehicles.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${BRANDING.baseUrl}/vehicles" style="display:inline-block;padding:14px 32px;background-color:${BRANDING.primaryColor};color:${BRANDING.white};font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
            Browse Vehicles
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:${BRANDING.ash};line-height:1.6;">
      Here&apos;s what you can do with your account:
    </p>
    <ul style="margin:16px 0 24px;padding-left:20px;font-size:14px;color:${BRANDING.ash};line-height:1.8;">
      <li>Browse and search our vehicle inventory</li>
      <li>Save vehicles to your wishlist</li>
      <li>Compare vehicles side by side</li>
      <li>Place orders and track shipments</li>
    </ul>`;

  return wrapTemplate(content);
}

// ─── Template: Magic Link ───────────────────────────────────────────────────

export function magicLinkEmail(magicLinkUrl: string): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:${BRANDING.white};">Sign in to ${BRANDING.appName}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${BRANDING.ash};">
      Click the button below to sign in to your account.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${magicLinkUrl}" style="display:inline-block;padding:14px 32px;background-color:${BRANDING.primaryColor};color:${BRANDING.white};font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
            Sign In
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:${BRANDING.steel};">
      This link expires in 5 minutes. If you didn&apos;t request this, you can safely ignore this email.
    </p>`;

  return wrapTemplate(content);
}
