import sgMail from "@sendgrid/mail";
import admin from "firebase-admin";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
}

const db = admin.firestore();

// Temporary in-memory logs
let logs = [];

export default async function handler(req, res) {
    try {
        if (req.method === "POST") {
            const { message, username } = req.body;

            if (!message || !username) {
                return res.status(400).json({ success: false, error: "Missing message or username" });
            }

            // Add log entry
            const logEntry = `${new Date().toLocaleTimeString()} - ${username}: ${message}`;
            logs.push(logEntry);
            logs = logs.slice(-20);

            // Save to Firebase
            await db.collection("requests").add({
                message,
                username,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

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
                message: `Email sent and request stored for ${username}`,
                logs,
            });
        }

        // GET request: heartbeat + logs
        if (req.method === "GET") {
            return res.status(200).json({
                success: true,
                message: "Server running ✅",
                logs,
            });
        }

        return res.status(405).json({ success: false, error: "Method not allowed" });
    } catch (err) {
        console.error("Server error:", err);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}
