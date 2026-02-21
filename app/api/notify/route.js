// app/api/notify/route.js
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { email, patientName, date, status, notes } = await req.json();

    // 1. Create the transporter with explicit Gmail settings
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const isConfirmed = status === "confirmed";
    const clinicName =
      process.env.NEXT_PUBLIC_CLINIC_NAME || "Alipio Dental Clinic";

    const mailOptions = {
      from: `"${clinicName}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Appointment ${isConfirmed ? "Confirmed" : "Update"} - ${clinicName}`,
      html: `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #eee;">
      
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 20px; text-align: center;">
        <img src="https://your-logo-url.com/logo.png" alt="ARC TECH" style="height: 50px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
          ${isConfirmed ? "Booking Confirmed!" : "Booking Update"}
        </h1>
      </div>

      <div style="padding: 40px 30px; color: #334155; line-height: 1.8;">
        <p style="font-size: 18px;">Hi <strong>${patientName}</strong>,</p>
        <p style="font-size: 16px;">
          Great news! Your dental appointment for <span style="color: #10b981; font-weight: 700;">${date}</span> 
          has been <strong>${status.toUpperCase()}</strong> by our team.
        </p>
        
        ${
          notes
            ? `
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; border-left: 4px solid #10b981; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Note from the Doctor:</p>
            <p style="margin: 0; font-style: italic; color: #1e293b;">"${notes}"</p>
          </div>
        `
            : ""
        }

        <div style="text-align: center; margin: 35px 0;">
          <a href="https://www.facebook.com/ArcTechSolutions25" 
             style="background-color: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
             View our Facebook Page
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 40px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">
          Powered by
        </p>
        <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800;">ARC TECH Solutions</h2>
        <p style="font-size: 14px; color: #64748b; margin: 10px 0 20px 0;">
          Empowering your success through technology. We specialize in Software and Website Development that solves real-life problems.
        </p>
        
        <div style="display: inline-block; padding: 0 10px;">
          <a href="https://www.facebook.com/ArcTechSolutions25" style="text-decoration: none;">
            <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="30" height="30" alt="FB" style="margin: 0 5px;">
            <span style="color: #1e293b; font-weight: bold; font-size: 14px; vertical-align: middle;">Follow us on Facebook</span>
          </a>
        </div>
      </div>

      <div style="background-color: #0f172a; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          &copy; 2026 ARC TECH Solutions - All rights reserved.
        </p>
      </div>
    </div>
  `,
    };
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Nodemailer Error:", error);
    // This will now return the specific error message to your frontend toast
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
