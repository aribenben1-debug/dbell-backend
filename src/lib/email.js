import nodemailer from 'nodemailer';

// Create transporter
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Base HTML wrapper
function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>D-Bell</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="background:#1d4ed8;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
          <span style="font-size:32px;">🔔</span>
          <h1 style="color:#ffffff;margin:8px 0 0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">D-Bell</h1>
          <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">Home services you can trust</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:none;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} D-Bell · Home services you can trust
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text, url, color = '#2563eb') {
  return `<a href="${url}" style="display:inline-block;background:${color};color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;margin-top:20px;">${text}</a>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;"/>`;
}

function infoRow(label, value) {
  return `
  <tr>
    <td style="padding:8px 0;color:#6b7280;font-size:13px;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:600;">${value}</td>
  </tr>`;
}

// ─── Email templates ───────────────────────────────────────────────

export function welcomeCustomerEmail(firstName) {
  return {
    subject: 'Welcome to D-Bell! 🔔',
    html: baseTemplate(`
      <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 8px;">Hi ${firstName}, welcome! 👋</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
        You're now part of D-Bell — the easiest way to book trusted home service professionals.
      </p>
      <div style="background:#eff6ff;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 12px;font-weight:700;color:#1d4ed8;">What you can do:</p>
        <p style="margin:4px 0;color:#374151;font-size:14px;">📋 &nbsp;Book plumbers, electricians, painters & more</p>
        <p style="margin:4px 0;color:#374151;font-size:14px;">💰 &nbsp;Get transparent price estimates upfront</p>
        <p style="margin:4px 0;color:#374151;font-size:14px;">💬 &nbsp;Chat directly with your provider</p>
        <p style="margin:4px 0;color:#374151;font-size:14px;">⭐ &nbsp;Leave reviews after every job</p>
      </div>
      ${btn('Book your first service →', process.env.CLIENT_URL + '/book')}
    `),
  };
}

export function welcomeProviderEmail(firstName) {
  return {
    subject: 'Application received — D-Bell 🔔',
    html: baseTemplate(`
      <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 8px;">Hi ${firstName}, we got your application! 🛠️</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Thanks for applying to join D-Bell as a service provider. Our team will review your profile and get back to you shortly.
      </p>
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0;color:#92400e;font-size:14px;">⏳ &nbsp;<strong>Review time:</strong> Usually within 24 hours</p>
      </div>
      <p style="color:#6b7280;font-size:14px;">Once approved, you'll receive an email and can start accepting bookings immediately.</p>
    `),
  };
}

export function providerApprovedEmail(firstName) {
  return {
    subject: "You're approved on D-Bell! 🎉",
    html: baseTemplate(`
      <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 8px;">Congratulations ${firstName}! 🎉</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Your D-Bell provider account has been approved. You can now receive bookings from customers!
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 10px;font-weight:700;color:#166534;">Next steps:</p>
        <p style="margin:4px 0;color:#374151;font-size:14px;">1. &nbsp;Set your weekly availability</p>
        <p style="margin:4px 0;color:#374151;font-size:14px;">2. &nbsp;Complete your profile & bio</p>
        <p style="margin:4px 0;color:#374151;font-size:14px;">3. &nbsp;Wait for your first booking to arrive!</p>
      </div>
      ${btn('Go to your dashboard →', process.env.CLIENT_URL + '/provider/dashboard', '#16a34a')}
    `),
  };
}

export function bookingConfirmationEmail(customer, booking, provider, trade) {
  return {
    subject: `Booking confirmed — ${trade} service 📅`,
    html: baseTemplate(`
      <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 8px;">Your booking is confirmed! ✅</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Hi ${customer}, here are your booking details:
      </p>

      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Service', trade)}
          ${infoRow('Provider', provider)}
          ${infoRow('Date', booking.scheduledDate)}
          ${infoRow('Time', booking.scheduledTime)}
          ${infoRow('Address', booking.address + ', ' + booking.city)}
          ${infoRow('Est. price', '$' + booking.estimatedMin + ' – $' + booking.estimatedMax)}
        </table>
      </div>

      <div style="background:#eff6ff;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;color:#1d4ed8;font-size:13px;">
          💰 <strong>Price guarantee:</strong> Final price will be within ±20% of the estimate shown above.
        </p>
      </div>

      ${btn('View booking →', process.env.CLIENT_URL + '/bookings/' + booking.id)}
    `),
  };
}

export function newBookingProviderEmail(provider, customer, booking, trade) {
  return {
    subject: `New booking request — ${trade} 🔔`,
    html: baseTemplate(`
      <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 8px;">You have a new booking! 🎯</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Hi ${provider}, <strong>${customer}</strong> has requested your ${trade} service.
      </p>

      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Customer', customer)}
          ${infoRow('Service', trade)}
          ${infoRow('Date', booking.scheduledDate)}
          ${infoRow('Time', booking.scheduledTime)}
          ${infoRow('Address', booking.address + ', ' + booking.city)}
          ${infoRow('Est. price', '$' + booking.estimatedMin + ' – $' + booking.estimatedMax)}
        </table>
      </div>

      <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;color:#92400e;font-size:13px;">
          ⚡ <strong>Action needed:</strong> Please confirm or decline this booking from your dashboard.
        </p>
      </div>

      ${btn('View & confirm booking →', process.env.CLIENT_URL + '/provider/dashboard', '#d97706')}
    `),
  };
}

export function bookingStatusEmail(customer, status, booking, trade) {
  const configs = {
    CONFIRMED: {
      emoji: '✅', title: 'Booking confirmed by provider!',
      body: 'Great news! Your provider has confirmed your booking. They will arrive at the scheduled time.',
      color: '#16a34a',
    },
    COMPLETED: {
      emoji: '🎉', title: 'Job completed!',
      body: 'Your service has been marked as complete. We hope everything went well! Leave a review to help others.',
      color: '#2563eb',
    },
    CANCELLED: {
      emoji: '❌', title: 'Booking cancelled',
      body: 'Your booking has been cancelled. You can book a new service anytime.',
      color: '#dc2626',
    },
  };

  const c = configs[status];
  if (!c) return null;

  return {
    subject: `${c.emoji} ${c.title} — D-Bell`,
    html: baseTemplate(`
      <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 8px;">${c.emoji} ${c.title}</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Hi ${customer}, ${c.body}
      </p>
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Service', trade)}
          ${infoRow('Date', booking.scheduledDate)}
          ${infoRow('Time', booking.scheduledTime)}
        </table>
      </div>
      ${status === 'COMPLETED'
        ? btn('Leave a review ⭐', process.env.CLIENT_URL + '/bookings/' + booking.id, c.color)
        : btn('View booking →', process.env.CLIENT_URL + '/bookings/' + booking.id, c.color)
      }
    `),
  };
}

// ─── Send helper ───────────────────────────────────────────────────

export async function sendEmail(to, { subject, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[EMAIL SKIPPED] No credentials. Would send "${subject}" to ${to}`);
    return;
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"D-Bell" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL SENT] "${subject}" → ${to}`);
  } catch (err) {
    console.error(`[EMAIL FAILED] ${err.message}`);
  }
}
