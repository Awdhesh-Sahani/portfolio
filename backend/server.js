const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded ✅" : "Not Loaded ❌");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
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

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: subject,
            text: `
Name: ${name}
Email: ${email}

Message:
${message}
            `
        });

        console.log("Email sent successfully ✅");

        res.status(200).json({
            success: true,
            message: "Message sent successfully"
        });

    } catch (error) {

        console.error("EMAIL ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.listen(5000, () => {
    console.log("Backend running on http://localhost:5000");
});