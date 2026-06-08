import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Origin', '*'); // Update with your actual domain later
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Method check
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { fullName, email, phone, company, service, organizationType, budget, timeline, message } = req.body;

        // Input validation based on the frontend structure
        if (!fullName || !email || !service || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Simple spam protection
        if (message.trim().length < 10) {
            return res.status(400).json({ error: 'Message is too short. Please provide more details.' });
        }

        // Generate a premium HTML email template
        const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAFAFA; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #E5E5E5;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #FF6B00 0%, #1A1A1A 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Form Enquiry Gam-Omatic Website.</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${service}</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px; background-color: #ffffff;">
          <div style="margin-bottom: 25px;">
            <h2 style="color: #FF6B00; font-size: 18px; border-bottom: 2px solid #FF6B00; padding-bottom: 8px; margin-bottom: 20px;">Contact Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Full Name:</strong></td>
                <td style="padding: 8px 0; color: #333;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #FF6B00; text-decoration: none;">${email}</a></td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Phone:</strong></td>
                <td style="padding: 8px 0; color: #333;">${phone}</td>
              </tr>` : ''}
              ${company ? `
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Company:</strong></td>
                <td style="padding: 8px 0; color: #333;">${company}</td>
              </tr>` : ''}
              ${organizationType ? `
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Org Type:</strong></td>
                <td style="padding: 8px 0; color: #333;">${organizationType}</td>
              </tr>` : ''}
              ${budget ? `
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Budget:</strong></td>
                <td style="padding: 8px 0; color: #333;">${budget}</td>
              </tr>` : ''}
              ${timeline ? `
              <tr>
                <td style="padding: 8px 0; color: #666;"><strong>Timeline:</strong></td>
                <td style="padding: 8px 0; color: #333;">${timeline}</td>
              </tr>` : ''}
            </table>
          </div>

          <div style="margin-top: 30px;">
            <h2 style="color: #FF6B00; font-size: 18px; border-bottom: 2px solid #FF6B00; padding-bottom: 8px; margin-bottom: 15px;">Message</h2>
            <div style="background-color: #F5F5F5; padding: 20px; border-radius: 8px; border-left: 5px solid #FF6B00; color: #444; line-height: 1.6; font-style: italic;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #1A1A1A; padding: 20px; text-align: center; color: #ffffff; font-size: 13px;">
          <p style="margin: 0 0 10px 0;"><strong>Gam-Omatic Multicompany Ltd</strong></p>
          <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.7);">Suite 24, Tian Plaza, Utako, Abuja, Nigeria</p>
          <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.7);">Phone: 08072653187 / 07084913591</p>
          <p style="margin: 0 0 5px 0; color: rgba(255,255,255,0.7);">Website: <a href="https://www.gam-omatic.com" style="color: #FF6B00; text-decoration: none;">www.gam-omatic.com</a></p>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
            <p style="margin: 0;">This inquiry was sent via the official contact form.</p>
            <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Gam-Omatic Multicompany Ltd. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

        // Send email via Resend
        const { data, error } = await resend.emails.send({
            from: process.env.CONTACT_FORM_FROM,
            to: [process.env.CONTACT_FORM_TO],
            subject: `Contact Form Inquiry [${fullName}] - ${service}`,
            html: emailHtml,
        });

        if (error) {
            console.error('Resend Error:', error);
            const errorMessage = typeof error === 'object' ? error.message : String(error);
            return res.status(500).json({ error: errorMessage || 'Failed to send email' });
        }

        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('API Error:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}
