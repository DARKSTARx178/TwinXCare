import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  // GET request: just a heartbeat
  if (req.method === "GET") {
    return res.status(200).json({ success: true, message: "Server running ✅" });
  }

  // POST request: send email
  if (req.method === "POST") {
    try {
      const { message, username } = req.body;

      if (!message || !username) {
        return res.status(400).json({ success: false, error: "Missing message or username" });
      }

      const emailMsg = {
        to: process.env.TO_EMAIL || "support@example.com", // recipient
        from: process.env.FROM_EMAIL,                     // verified sender in SendGrid
        subject: `Assistance Request from ${username}`,
        text: message,
        html: `<p>${message}</p>`,
      };

      await sgMail.send(emailMsg);

      return res.status(200).json({ success: true, message: `Email sent from ${username}` });
    } catch (error) {
      console.error("SendGrid error:", error);
      return res.status(500).json({ success: false, error: "Failed to send email" });
    }
  }

  // Any other HTTP method
  return res.status(405).json({ success: false, error: "Method not allowed" });
}
