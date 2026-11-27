import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { sites as siteConfigs, getSiteByDomain } from "@/config/sites";
import { looksCommercial } from "@/lib/commercial-pitch";
import { PRODUCTS } from "@/lib/paid";

const CONTACT_EMAIL = "ainewss2023@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { name, email, department, subject, message, siteName, siteDomain } = await req.json();

    // Email clients do not support CSS variables, so resolve the site's
    // state colour to a literal here.
    const accent =
      Object.values(siteConfigs).find((s) => s.domain === siteDomain)?.accent || "#C1121F";

    if (!name || !email || !department || !subject || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const fromAddress = `${siteName} <contact@alabama-express.com>`;

    await resend.emails.send({
      from: fromAddress,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `[${siteName}] [${department}] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #111; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">
              <span style="color: #fff;">${siteName.split(" ")[0]}</span>
              <span style="color: ${accent};"> ${siteName.split(" ").slice(1).join(" ")}</span>
            </h1>
          </div>
          <div style="background: ${accent}; color: #fff; padding: 10px 20px; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; text-align: center;">
            New Contact Form Submission
          </div>
          <div style="padding: 30px 20px; background: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 13px; width: 100px;"><strong>Site:</strong></td>
                <td style="padding: 8px 0; font-size: 13px;">${siteName} (${siteDomain})</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 13px;"><strong>Department:</strong></td>
                <td style="padding: 8px 0; font-size: 13px;"><span style="background: ${accent}; color: #fff; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: bold;">${department}</span></td>
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
            <div style="margin-top: 20px; padding: 15px; background: #fff; border-left: 3px solid ${accent}; border-radius: 4px;">
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

    // A business pitching its own website as a "tip" gets the sponsored offer by email
    // (the newsroom still gets the message above).
    const host = (req.headers.get("host") || "").split(":")[0].replace(/^www\./, "");
    const site = getSiteByDomain(host);
    const e = (x: unknown) => String(x ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);
    if (site && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(String(email)) && !/correction|legal|privacy/i.test(String(department))
        && looksCommercial(`${subject} ${message}`, [site.domain], String(email))) {
      const price = `$${(PRODUCTS.sponsored.cents / 100).toFixed(0)}`;
      await resend.emails.send({
        from: fromAddress, to: String(email), replyTo: CONTACT_EMAIL,
        subject: `Re: ${String(subject).slice(0, 150)}`,
        html: `<p>Hi ${e(name)},</p>
<p>Thanks for writing to ${e(site.name)}.</p>
<p>Since your note links to a company's own website, we can't run it as a news story. We'd be glad to publish it as a <b>Sponsored story</b> on ${e(site.name)} for <b>${price}</b>: live within one business day, clearly labelled, with your link (marked rel="sponsored", as Google requires).</p>
<p><a href="https://${site.domain}/promote" style="display:inline-block;padding:10px 18px;background:#b91c1c;color:#fff;text-decoration:none;border-radius:4px">Order your sponsored story</a></p>
<p>More reach: a <b>Featured</b> story stays on our homepage for 7 days, and our network campaign publishes it across our state newspapers nationwide: <a href="https://${site.domain}/all-50-states">see the network offer</a>.</p>
<p>Best regards,<br>${e(site.name)}</p>`,
      }).catch(() => null);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
