const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { Resend } = require("resend");

const app = express();

app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

app.get("/", (req, res) => {
    res.send("Portfolio backend is running ✅");
});

app.post("/send-message", async(req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const { data, error } = await resend.emails.send({
            from: "Portfolio <onboarding@resend.dev>",
            to: ["awdheshsahani6392789729@gmail.com"],
            subject: subject,
            text: `
            Name: ${name}
            Email: ${email}

            Message:${message}
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

        res.status(200).json({
            success: true,
            message: "Message sent successfully"
        });

    } catch (error) {
        console.error("EMAIL ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on port ${PORT}`);
});