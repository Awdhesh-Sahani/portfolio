const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async(req, res) => {
    // Only POST request allowed
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {
        const { name, email, subject, message } = req.body || {};

        // Validate fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Send email using Resend
        const { data, error } = await resend.emails.send({
            from: "Portfolio <onboarding@resend.dev>",
            to: ["awdheshsahani6392789729@gmail.com"],
            replyTo: email,
            subject: subject,

            text: `
New message from your portfolio

Name: ${name}
Email: ${email}

Subject:
${subject}

Message:
${message}
            `
        });

        if (error) {
            console.error("RESEND ERROR:", error);

            return res.status(500).json({
                success: false,
                message: error.message || "Email sending failed"
            });
        }

        console.log("Email sent successfully:", data);

        return res.status(200).json({
            success: true,
            message: "Message sent successfully"
        });

    } catch (error) {
        console.error("SERVER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
};