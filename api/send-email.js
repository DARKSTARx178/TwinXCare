import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Temporary in-memory logs for display/debugging
let logs = [];

export default async function handler(req, res) {
    try {
        if (req.method === "POST") {
            const { message, username } = req.body;

            if (!message || !username) {
                return res.status(400).json({ success: false, error: "Missing message or username" });
            }

            // Add to in-memory logs
            const logEntry = `${new Date().toLocaleTimeString()} - ${username}: ${message}`;
            logs.push(logEntry);
            logs = logs.slice(-20); // keep last 20 logs

            // Send email via SendGrid
            await sgMail.send({
                to: process.env.TO_EMAIL,
                from: process.env.FROM_EMAIL,
                subject: `Assistance Request from ${username}`,
                text: message,
                html: `<p>${message}</p>`,
            });

            return res.status(200).json({
                success: true,
                message: `Email sent successfully for ${username}`,
                logs,
            });
        }

        // GET request: simple server check + logs
        if (req.method === "GET") {
            return res.status(200).json({ success: true, message: "Server running ✅", logs });
        }

        return res.status(405).json({ success: false, error: "Method not allowed" });
    } catch (err) {
        console.error("Server error:", err);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}
