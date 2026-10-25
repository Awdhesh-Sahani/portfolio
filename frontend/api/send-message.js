import { Resend } from "resend";

const recipient = "awdheshsahani6392789729@gmail.com";
const maximumLength = {
    name: 100,
    email: 254,
    subject: 200,
    message: 5000
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ success: false, message: "Method not allowed." });
    }

    if (!process.env.RESEND_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Contact form configuration is incomplete.");
        return res.status(503).json({ success: false, message: "The message service is not configured. Please try again later." });
    }

    const payload = req.body;
    if (!payload || typeof payload !== "object" || Array.isArray(payload) || JSON.stringify(payload).length > 10000) {
        return res.status(400).json({ success: false, message: "Invalid message submission." });
    }

    const fields = Object.fromEntries(
        Object.keys(maximumLength).map(key => [key, typeof payload[key] === "string" ? payload[key].trim() : ""])
    );
    const { name, email, subject, message } = fields;

    if (Object.entries(fields).some(([key, value]) => !value || value.length > maximumLength[key])) {
        return res.status(400).json({ success: false, message: "Please complete every field within the allowed length." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(subject)) {
        return res.status(400).json({ success: false, message: "Please enter a valid email address and subject." });
    }

    const supabaseUrl = process.env.SUPABASE_URL.replace(/\/$/, "");
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        const stored = await fetch(`${supabaseUrl}/rest/v1/contact_messages`, {
            method: "POST",
            headers: {
                apikey: adminKey,
                Authorization: `Bearer ${adminKey}`,
                "Content-Type": "application/json",
                Prefer: "return=minimal"
            },
            body: JSON.stringify({ name, email, subject, message })
        });

        if (!stored.ok) {
            console.error("Contact message storage failed:", stored.status, await stored.text());
            return res.status(500).json({ success: false, message: "Your message could not be stored. Please try again later." });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
            from: "Portfolio <onboarding@resend.dev>",
            to: [recipient],
            replyTo: email,
            subject: `Portfolio contact: ${subject}`,
            text: `New message from your portfolio\n\nName: ${name}\nEmail: ${email}\n\nSubject:\n${subject}\n\nMessage:\n${message}`
        });

        if (error) {
            console.error("Contact email delivery failed:", error.message);
            return res.status(502).json({
                success: false,
                message: "Your message was saved, but the email notification could not be sent. Please try again later."
            });
        }

        return res.status(200).json({ success: true, message: "Message sent successfully." });
    } catch (error) {
        console.error("Contact form request failed:", error.message);
        return res.status(500).json({ success: false, message: "The message service encountered an error. Please try again later." });
    }
}
