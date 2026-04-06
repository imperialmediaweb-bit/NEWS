import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const CONTACT_EMAIL = "ainewss2023@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message, siteName, siteDomain } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // If the domain is verified in Resend, send from contact@domain
    // Otherwise fall back to the Resend default
    const fromAddress = process.env.RESEND_VERIFIED_DOMAINS?.includes(siteDomain)
      ? `${siteName} <contact@${siteDomain}>`
      : `${siteName} <onboarding@resend.dev>`;

    await resend.emails.send({
      from: fromAddress,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `[${siteName}] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #111; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">
              <span style="color: #fff;">${siteName.split(" ")[0]}</span>
              <span style="color: #c1121f;"> ${siteName.split(" ").slice(1).join(" ")}</span>
            </h1>
          </div>
          <div style="background: #c1121f; color: #fff; padding: 10px 20px; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; text-align: center;">
            New Contact Form Submission
          </div>
          <div style="padding: 30px 20px; background: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 13px; width: 100px;"><strong>Site:</strong></td>
                <td style="padding: 8px 0; font-size: 13px;">${siteName} (${siteDomain})</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 13px;"><strong>Name:</strong></td>
                <td style="padding: 8px 0; font-size: 13px;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 13px;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; font-size: 13px;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 13px;"><strong>Subject:</strong></td>
                <td style="padding: 8px 0; font-size: 13px;">${subject}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; padding: 15px; background: #fff; border-left: 3px solid #c1121f; border-radius: 4px;">
              <p style="margin: 0 0 5px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;"><strong>Message:</strong></p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          <div style="background: #111; padding: 15px 20px; text-align: center; color: #666; font-size: 11px;">
            Sent from ${siteName} contact form &bull; ${siteDomain}
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
