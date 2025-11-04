import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

(async () => {
  try {
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: "paulgreen920@gmail.com", // 👈 replace this with your real inbox
      subject: "Resend Test Email",
      html: "<h2>✅ It works!</h2><p>This is a test email sent from your Next.js app via Resend.</p>",
    });

    console.log("Email sent:", data);
  } catch (err) {
    console.error("Error sending test:", err);
  }
})();
