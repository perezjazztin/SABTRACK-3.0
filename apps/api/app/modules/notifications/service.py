import os
import re
import smtplib
import ssl
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.core.logging import logger


class EmailService:
    """Free and resilient email dispatch service supporting live SMTP and offline dev simulation."""

    def __init__(self) -> None:
        pass

    def _get_sender(self) -> str:
        """Computes sender email header string formatted as 'Name <email>'."""
        sender_email = (settings.SMTP_FROM_EMAIL or settings.SMTP_USER or "noreply@sabtrack.local").strip()
        sender_name = settings.SMTP_FROM_NAME or "SABTRACK - Barangay Sabang"
        return f"{sender_name} <{sender_email}>"

    def render_base_email(self, title: str, preheader: str, body_html: str) -> str:
        """Wraps body HTML in a responsive, green-branded civic layout with academic attribution."""
        year = datetime.now(timezone.utc).year
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #f4f8f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #f4f8f5;
      padding: 28px 12px;
      box-sizing: border-box;
    }}
    .container {{
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #d1e7dd;
      box-shadow: 0 10px 25px -5px rgba(15, 81, 50, 0.08);
    }}
    .header {{
      background: linear-gradient(135deg, #0F5132 0%, #198754 100%);
      padding: 28px 24px;
      text-align: center;
      color: #ffffff;
    }}
    .badge {{
      display: inline-block;
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 9999px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }}
    .title {{
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }}
    .subtitle {{
      margin: 4px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
    }}
    .content {{
      padding: 32px 28px;
      line-height: 1.6;
      font-size: 15px;
    }}
    .card-box {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 20px 0;
    }}
    .footer {{
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 22px 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }}
    .footer strong {{
      color: #0F5132;
    }}
    .button {{
      display: inline-block;
      background: #0F5132;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      margin-top: 16px;
    }}
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    {preheader}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="badge">Official Citizen Notice</span>
        <h1 class="title">SABTRACK 3.0</h1>
        <p class="subtitle">Barangay Sabang Solid Waste Governance • Lipa City</p>
      </div>
      <div class="content">
        {body_html}
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px 0;"><strong>SABTRACK</strong> — A Digital Governance Platform for Barangay Sabang</p>
        <p style="margin: 0 0 8px 0;">Batangas State University – The National Engineering University • IT 313</p>
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
          In strict compliance with RA 10173 (Data Privacy Act of 2012). This email is an automated system advisory.
        </p>
      </div>
    </div>
  </div>
</body>
</html>"""

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
    ) -> bool:
        """Sends an email via live SMTP if enabled/configured, or saves offline HTML preview in dev mode."""
        clean_to = to_email.strip().lower()
        if not clean_to or "@" not in clean_to:
            logger.warning("Email dispatch skipped: invalid recipient '%s'", to_email)
            return False

        # Live SMTP sending branch
        if settings.SMTP_ENABLED and settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                msg = EmailMessage()
                msg["Subject"] = subject
                msg["From"] = self._get_sender()
                msg["To"] = clean_to

                plain_fallback = text_body or re.sub(r"<[^>]+>", " ", html_body)
                plain_fallback = " ".join(plain_fallback.split())
                msg.set_content(plain_fallback)
                msg.add_alternative(html_body, subtype="html")

                if settings.SMTP_PORT == 465:
                    context = ssl.create_default_context()
                    with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=context, timeout=15) as server:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.send_message(msg)
                else:
                    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                        if settings.SMTP_USE_TLS:
                            context = ssl.create_default_context()
                            server.starttls(context=context)
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.send_message(msg)

                logger.info("Successfully dispatched live SMTP email to %s (Subject: %s)", clean_to, subject)
                return True
            except Exception as exc:
                logger.error("Failed to send email via SMTP to %s: %s", clean_to, exc)
                return False

        # Offline / Dev Simulation Branch (Zero Cost, No Credentials Needed)
        try:
            settings.STORAGE_EMAIL_DIR.mkdir(parents=True, exist_ok=True)
            timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            safe_recipient = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", clean_to)
            file_name = f"{timestamp_str}_{safe_recipient}.html"
            preview_path = settings.STORAGE_EMAIL_DIR / file_name

            # Prepend preview metadata bar
            annotated_html = f"""<!-- 
  [DEV EMAIL PREVIEW]
  To: {clean_to}
  Subject: {subject}
  Sender: {self._get_sender()}
  Timestamp: {datetime.now(timezone.utc).isoformat()}
-->
{html_body}"""

            preview_path.write_text(annotated_html, encoding="utf-8")
            logger.info(
                "[DEV_EMAIL_SIMULATOR] Stored preview email for %s at %s (Subject: '%s')",
                clean_to,
                preview_path,
                subject,
            )
            return True
        except Exception as exc:
            logger.error("Failed to write offline simulated email preview: %s", exc)
            return False

    def send_schedule_reminder(
        self,
        to_email: str,
        resident_name: Optional[str],
        day_of_week: str,
        waste_type: str,
        collection_time: str,
        area_name: str,
    ) -> bool:
        """Dispatches collection schedule advisory / reminder email."""
        greeting_name = resident_name or "Resident of Barangay Sabang"
        subject = f"[SABTRACK Alert] Garbage Collection Reminder: {day_of_week} ({waste_type})"
        preheader = f"Reminder: Scheduled {waste_type} waste collection on {day_of_week} in {area_name}."

        body_html = f"""
          <h2 style="color: #0F5132; margin-top: 0; font-size: 18px;">Garbage Collection Advisory</h2>
          <p>Hello <strong>{greeting_name}</strong>,</p>
          <p>This is an official automated advisory for your registered collection route in <strong>{area_name}</strong>.</p>
          
          <div class="card-box" style="border-left: 4px solid #198754; background: #f0fdf4;">
            <p style="margin: 0 0 6px 0; font-size: 14px; color: #166534; font-weight: bold;">
              SCHEDULE DETAILS
            </p>
            <p style="margin: 4px 0;"><strong>Pickup Day:</strong> {day_of_week}</p>
            <p style="margin: 4px 0;"><strong>Collection Window:</strong> {collection_time}</p>
            <p style="margin: 4px 0;"><strong>Waste Classification:</strong> <span style="background: #0F5132; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px;">{waste_type}</span></p>
            <p style="margin: 4px 0;"><strong>Route / Sector:</strong> {area_name}</p>
          </div>

          <p style="font-size: 14px; color: #334155;">
            <strong>Reminder Reminders:</strong>
          </p>
          <ul style="font-size: 14px; color: #475569; padding-left: 20px;">
            <li>Please bring out properly segregated bags no earlier than 30 minutes before collection.</li>
            <li>Ensure waste bins are securely closed to prevent animal tampering and street litter.</li>
            <li>Unsegregated waste will not be collected pursuant to Barangay Sabang Ecological Solid Waste Ordinance.</li>
          </ul>

          <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
            Thank you for helping keep Barangay Sabang clean and sustainable!
          </p>
        """

        full_html = self.render_base_email("Collection Schedule Reminder", preheader, body_html)
        return self.send_email(to_email, subject, full_html)

    def send_report_status_update(
        self,
        to_email: str,
        resident_name: Optional[str],
        report_id: int,
        new_status: str,
        previous_status: Optional[str] = None,
        remarks: Optional[str] = None,
        category: Optional[str] = None,
    ) -> bool:
        """Dispatches waste violation / uncollected trash report status update email."""
        greeting_name = resident_name or "Concerned Resident"
        subject = f"[SABTRACK Update] Report #{report_id} status changed to {new_status}"
        preheader = f"Update on your waste report #{report_id}: Status is now {new_status}."

        status_colors = {
            "SUBMITTED": ("#e0f2fe", "#0369a1"),
            "UNDER_REVIEW": ("#fef3c7", "#b45309"),
            "DISPATCHED": ("#ede9fe", "#6d28d9"),
            "RESOLVED": ("#dcfce7", "#15803d"),
            "REJECTED": ("#ffe4e6", "#be123c"),
        }
        bg_col, text_col = status_colors.get(new_status.upper(), ("#f1f5f9", "#334155"))

        body_html = f"""
          <h2 style="color: #0F5132; margin-top: 0; font-size: 18px;">Community Waste Report Update</h2>
          <p>Hello <strong>{greeting_name}</strong>,</p>
          <p>Your reported incident <strong>Report #{report_id}</strong> has been updated by Barangay Sabang sanitation staff.</p>

          <div class="card-box">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; font-weight: bold;">
              OFFICIAL ACTION TIMELINE
            </p>
            <p style="margin: 6px 0;">
              <strong>New Status:</strong>
              <span style="background: {bg_col}; color: {text_col}; padding: 3px 10px; border-radius: 9999px; font-weight: bold; font-size: 12px;">
                {new_status}
              </span>
            </p>
            {f'<p style="margin: 6px 0; font-size: 13px; color: #64748b;"><strong>Previous Status:</strong> {previous_status}</p>' if previous_status else ''}
            {f'<p style="margin: 6px 0; font-size: 13px; color: #64748b;"><strong>Category:</strong> {category}</p>' if category else ''}
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
              <strong>Barangay Remarks:</strong>
              <p style="margin: 4px 0 0 0; font-style: italic; color: #1e293b;">
                "{remarks or 'No remarks provided.'}"
              </p>
            </div>
          </div>

          <p style="font-size: 14px; color: #334155;">
            You may log in to the <strong>SABTRACK Resident Portal</strong> to view the full resolution timeline, inspection notes, and earned civic engagement points.
          </p>
        """

        full_html = self.render_base_email(f"Report #{report_id} Update", preheader, body_html)
        return self.send_email(to_email, subject, full_html)

    def send_welcome_email(
        self,
        to_email: str,
        full_name: str,
    ) -> bool:
        """Dispatches welcome email upon successful resident account registration."""
        subject = "[SABTRACK] Welcome to Barangay Sabang Digital Waste Governance"
        preheader = f"Welcome to SABTRACK, {full_name}! Your resident account is now active."

        body_html = f"""
          <h2 style="color: #0F5132; margin-top: 0; font-size: 18px;">Welcome to SABTRACK 3.0!</h2>
          <p>Hello <strong>{full_name}</strong>,</p>
          <p>Thank you for registering on <strong>SABTRACK</strong>, the official digital solid waste governance platform of Barangay Sabang, Lipa City.</p>

          <div class="card-box" style="background: #f0fdf4; border: 1px solid #bbf7d0;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #166534;">
              WHAT YOU CAN DO WITH YOUR ACCOUNT:
            </p>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #14532d;">
              <li><strong>Pickup Timetables:</strong> View your Purok garbage collection route and subscribe to email reminders.</li>
              <li><strong>Citizen Reporting:</strong> File photo-verified reports for uncollected garbage and environmental violations.</li>
              <li><strong>SAB-Points:</strong> Earn verified civic engagement rewards for participating in barangay waste reduction drives.</li>
              <li><strong>EcoGabay AI:</strong> Chat with our bilingual waste segregation and upcycling advisor.</li>
            </ul>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            Your account is linked to your registered email: <strong>{to_email}</strong>.
          </p>
        """

        full_html = self.render_base_email("Welcome to SABTRACK", preheader, body_html)
        return self.send_email(to_email, subject, full_html)


email_service = EmailService()
