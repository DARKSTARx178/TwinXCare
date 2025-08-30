// api/send-email.js

let logs = []; // temporary in-memory logs for display

export default function handler(req, res) {
    if (req.method === "POST") {
        const { message, username } = req.body;

        if (!message || !username) {
            return res.status(400).json({ success: false, error: "Missing message or username" });
        }

        const logEntry = `${new Date().toLocaleTimeString()} - ${username}: ${message}`;
        logs.push(logEntry);

        // Keep only the last 20 entries to avoid huge memory usage
        logs = logs.slice(-20);

        // Here you could also call SendGrid or Firebase functions
        // e.g., sendEmail(message, username)

        return res.status(200).json({
            success: true,
            message: `Email request recorded for ${username}`,
            logs,
        });
    }

    if (req.method === "GET") {
        return res.status(200).json({
            success: true,
            message: "Server running ✅",
            logs,
        });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
