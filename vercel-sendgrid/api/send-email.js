import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { to, subject, message } = req.body;

        if (!to || !subject || !message) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const msg = {
            to,
            from: process.env.FROM_EMAIL,
            subject,
            text: message,
            html: `<p>${message}</p>`,
        };

        await sgMail.send(msg);

        res.status(200).json({ success: true, message: "Email sent!" });
    } catch (error) {
        console.error("SendGrid error:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
}
