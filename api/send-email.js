import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

let logs = [];

export default async function handler(req, res) {
    try {
        if (req.method === "POST") {
            const { message, username, type } = req.body;

            if (!message || !username) {
                return res.status(400).json({ success: false, error: "Missing message or username" });
            }

            const toEmail = process.env.TO_EMAIL;
            const fromEmail = process.env.FROM_EMAIL;

            if (!toEmail || !fromEmail) {
                return res.status(500).json({ success: false, error: "Server misconfigured: missing TO_EMAIL or FROM_EMAIL" });
            }

            // Add to in-memory logs
            const logEntry = `${new Date().toLocaleTimeString()} - ${type || "assistance"} - ${username}: ${message}`;
            logs.push(logEntry);
            logs = logs.slice(-20); // keep last 20 logs

            try {
                await sgMail.send({
                    to: toEmail,
                    from: fromEmail,
                    subject: type === "feedback" ? `New Feedback from ${username}` : `Assistance Request from ${username}`,
                    text: message,
                    html: `<p>${message}</p>`,
                });
            } catch (err) {
                console.error("SendGrid error:", err);
                return res.status(500).json({ success: false, error: "SendGrid failed" });
            }

            return res.status(200).json({ success: true, message: "Email sent", logs });
        }

        if (req.method === "GET") {
            return res.status(200).json({ success: true, message: "Server running ✅", logs });
        }

        return res.status(405).json({ success: false, error: "Method not allowed" });
    } catch (err) {
        console.error("Server error:", err);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}
