import sgMail from "@sendgrid/mail";

let logs = [];

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === "POST") {
            const { message, username, type } = req.body;

            if (!message || !username) {
                return res.status(400).json({ success: false, error: "Missing message or username" });
            }

            const sendGridApiKey = process.env.SENDGRID_API_KEY;
            const toEmail = process.env.TO_EMAIL;
            const fromEmail = process.env.FROM_EMAIL;

            if (!sendGridApiKey || !toEmail || !fromEmail) {
                return res.status(500).json({ success: false, error: "Server misconfigured: missing email environment variables" });
            }

            sgMail.setApiKey(sendGridApiKey);

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
                    html: `<p>${escapeHtml(message)}</p>`,
                });
            } catch (err) {
                const sendGridErrors = err?.response?.body?.errors || [];
                const sendGridMessage = sendGridErrors[0]?.message || err?.message || "SendGrid failed";

                console.error("SendGrid error:", {
                    code: err?.code,
                    message: sendGridMessage,
                    errors: sendGridErrors,
                });

                return res.status(502).json({
                    success: false,
                    error: sendGridMessage,
                    details: sendGridErrors.map((error) => ({
                        field: error.field,
                        help: error.help,
                    })),
                });
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
