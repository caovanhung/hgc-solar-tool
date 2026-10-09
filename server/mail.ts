import nodemailer from 'nodemailer';

export function createMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (user && pass) {
    if (host) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
  }
  return null;
}

export async function sendVerificationEmail(toEmail: string, fullName: string, code: string) {
  const transporter = createMailTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || '"HGC Solar" <noreply@hgcvn.cloud>';

  console.log(`\n======================================================`);
  console.log(`[HGC Solar Email Service] Đang gửi mã OTP kích hoạt tài khoản:`);
  console.log(`Người nhận: ${fullName} <${toEmail}>`);
  console.log(`MÃ XÁC THỰC OTP: >>> ${code} <<<`);
  console.log(`======================================================\n`);

  if (!transporter) {
    console.warn(`[HGC Solar Email Service] CHƯA CẤU HÌNH SMTP_USER & SMTP_PASS trong file .env trên VPS.`);
    return { sent: false, reason: 'no_smtp_configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `[HGC Solar] Mã OTP kích hoạt tài khoản của bạn: ${code}`,
      text: `Xin chào ${fullName},\n\nMã xác thực OTP kích hoạt tài khoản HGC Solar của bạn là: ${code}\nMã có hiệu lực trong vòng 15 phút.\n\nTrân trọng,\nĐội ngũ HGC Solar Power`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #0F2A45 0%, #1e40af 100%); padding: 24px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">HGC SOLAR POWER</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Xác Thực Tài Khoản Người Dùng</p>
          </div>
          <div style="padding: 28px 24px; background: #ffffff;">
            <p style="margin: 0 0 16px; font-size: 15px; color: #1e293b;">Xin chào <strong>${fullName}</strong>,</p>
            <p style="margin: 0 0 20px; font-size: 14px; color: #475569; line-height: 1.6;">
              Cảm ơn bạn đã đăng ký tài khoản trên nền tảng <strong>HGC Solar Design & Quotation Tool</strong>. Vui lòng nhập mã OTP bên dưới để kích hoạt tài khoản của bạn:
            </p>
            <div style="background: #f8fafc; border: 2px dashed #0F2A45; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #E4572E; font-family: monospace;">${code}</span>
            </div>
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">• Mã xác thực có hiệu lực trong vòng 15 phút.</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">• Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            CÔNG TY TNHH HGC VIỆT NAM<br>
            Hotline Kỹ Thuật: 0974 04 19 84 | Website: <a href="https://hgcvn.cloud" style="color: #0F2A45; text-decoration: none;">hgcvn.cloud</a>
          </div>
        </div>
      `,
    });
    console.log(`[HGC Solar Email Service] ✓ Đã gửi email thành công tới ${toEmail} - MessageID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[HGC Solar Email Service] ✗ Lỗi khi gửi email qua SMTP:`, err);
    return { sent: false, error: (err as Error).message };
  }
}
