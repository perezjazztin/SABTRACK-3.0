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
    """Free and resilient email dispatch service supporting live SMTP and offline dev simulation.
    Rendered in Official LGU Memorandum (Formal Government Letterhead) layout.
    """

    def __init__(self) -> None:
        pass

    def _get_sender(self) -> str:
        """Computes sender email header string formatted as 'Name <email>'."""
        sender_email = (settings.SMTP_FROM_EMAIL or settings.SMTP_USER or "noreply@sabtrack.local").strip()
        sender_name = settings.SMTP_FROM_NAME or "SABTRACK - Barangay Sabang"
        return f"{sender_name} <{sender_email}>"

    def render_base_email(
        self,
        title: str,
        preheader: str,
        body_html: str,
        memo_ref: str = "SB-2026-SWM-GEN",
        memo_to: str = "Concerned Citizen / Registered Resident",
        memo_subject: str = "Official Solid Waste Management Advisory",
    ) -> str:
        """Wraps body HTML in a formal Republic of the Philippines LGU Memorandum letterhead."""
        now = datetime.now(timezone.utc)
        date_str = now.strftime("%B %d, %Y")
        
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
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #f1f5f9;
      padding: 32px 12px;
      box-sizing: border-box;
    }}
    .container {{
      max-width: 640px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
    }}
    .lgu-header {{
      background: #ffffff;
      padding: 28px 24px 20px 24px;
      text-align: center;
      border-bottom: 3px double #0F5132;
    }}
    .rep-heading {{
      margin: 0;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
    }}
    .prov-heading {{
      margin: 2px 0 0 0;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #334155;
      font-weight: 700;
    }}
    .brgy-title {{
      margin: 6px 0 0 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #0F5132;
    }}
    .office-sub {{
      margin: 4px 0 0 0;
      font-size: 11px;
      color: #475569;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }}
    .memo-bar {{
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 16px 24px;
      font-size: 12px;
      line-height: 1.6;
    }}
    .content {{
      padding: 28px 24px;
      font-size: 14px;
      line-height: 1.7;
      color: #1e293b;
    }}
    .table-details {{
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 13px;
    }}
    .table-details th {{
      background: #f0fdf4;
      color: #0F5132;
      font-weight: 700;
      text-align: left;
      padding: 10px 14px;
      border: 1px solid #bbf7d0;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }}
    .table-details td {{
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }}
    .signoff-box {{
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }}
    .footer {{
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px 24px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }}
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    {preheader}
  </div>
  <div class="wrapper">
    <div class="container">
      
      <!-- Official LGU Memorandum Letterhead -->
      <div class="lgu-header">
        <p class="rep-heading">Republic of the Philippines</p>
        <p class="prov-heading">Province of Batangas &bull; City of Lipa</p>
        <h1 class="brgy-title">BARANGAY SABANG</h1>
        <p class="office-sub">Office of the Punong Barangay &bull; Barangay Sabang Solid Waste Governance</p>
      </div>

      <!-- Memorandum Routing Bar -->
      <div class="memo-bar">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="width: 100px; font-weight: bold; color: #0F5132; padding: 2px 0;">MEMORANDUM:</td>
            <td style="font-family: monospace; font-weight: bold; color: #0f172a; padding: 2px 0;">{memo_ref}</td>
            <td style="text-align: right; color: #64748b; padding: 2px 0;"><strong>DATE:</strong> {date_str}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #0F5132; padding: 2px 0;">FOR / TO:</td>
            <td colspan="2" style="font-weight: bold; color: #1e293b; padding: 2px 0;">{memo_to}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #0F5132; padding: 2px 0;">FROM:</td>
            <td colspan="2" style="color: #334155; padding: 2px 0;">Solid Waste Management Operations Committee &bull; SABTRACK System</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #0F5132; padding: 2px 0;">SUBJECT:</td>
            <td colspan="2" style="font-weight: bold; color: #0F5132; padding: 2px 0;">{memo_subject}</td>
          </tr>
        </table>
      </div>

      <!-- Formal Body Content -->
      <div class="content">
        {body_html}

        <!-- Official Sign-Off Block -->
        <div class="signoff-box">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Dispatched by:</p>
                <p style="margin: 20px 0 2px 0; font-weight: bold; color: #0F5132; border-top: 1px solid #94a3b8; display: inline-block; padding-top: 4px; min-width: 180px;">SABTRACK Operations</p>
                <p style="margin: 0; font-size: 11px; color: #64748b;">Barangay Sabang SWM Unit</p>
              </td>
              <td style="width: 50%; vertical-align: top; text-align: right;">
                <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Attested by:</p>
                <p style="margin: 20px 0 2px 0; font-weight: bold; color: #0F5132; border-top: 1px solid #94a3b8; display: inline-block; padding-top: 4px; min-width: 180px;">Hon. Punong Barangay</p>
                <p style="margin: 0; font-size: 11px; color: #64748b;">Barangay Sabang, Lipa City</p>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Academic & Privacy Footer -->
      <div class="footer">
        <p style="margin: 0 0 4px 0; font-weight: bold; color: #0F5132;">SABTRACK 3.0 &bull; Official Digital Governance Platform</p>
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">Batangas State University &ndash; The National Engineering University &bull; IT 313 Academic Mandate</p>
        <p style="margin: 0; font-size: 10px; color: #94a3b8;">
          In strict compliance with RA 10173 (Data Privacy Act of 2012). This memorandum is an automated official municipal advisory transmitted to registered stakeholders.
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
  [DEV EMAIL PREVIEW - OFFICIAL LGU MEMORANDUM]
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
        """Dispatches collection schedule advisory / reminder memorandum."""
        greeting_name = resident_name or "Concerned Resident"
        subject = f"[MEMORANDUM] Waste Collection Schedule Notice: {day_of_week} ({waste_type})"
        preheader = f"Official Memorandum: Scheduled {waste_type} pickup on {day_of_week} for {area_name}."
        memo_ref = f"SB-SWM-SCHED-{day_of_week[:3].upper()}"

        body_html = f"""
          <p>Please be formally advised that the Barangay Solid Waste Management Committee has scheduled regular 
          garbage collection operations for your designated sector in <strong>{area_name}</strong>.</p>
          
          <table class="table-details">
            <thead>
              <tr>
                <th colspan="2">Official Collection Details &bull; Schedule Specification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="width: 35%; font-weight: bold; background: #fafafa;">Designated Sector:</td>
                <td><strong>{area_name}</strong></td>
              </tr>
              <tr>
                <td style="font-weight: bold; background: #fafafa;">Collection Day:</td>
                <td><strong>{day_of_week}</strong></td>
              </tr>
              <tr>
                <td style="font-weight: bold; background: #fafafa;">Pickup Hours:</td>
                <td>{collection_time}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background: #fafafa;">Waste Classification:</td>
                <td><span style="background: #0F5132; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">{waste_type}</span></td>
              </tr>
            </tbody>
          </table>

          <p style="margin-top: 18px; font-weight: bold; color: #0F5132; font-size: 13px;">
            MUNICIPAL DIRECTIVES FOR COMPLIANCE:
          </p>
          <ol style="font-size: 13px; color: #334155; padding-left: 20px; line-height: 1.7;">
            <li><strong>Proper Segregation at Source:</strong> Mixed or unsegregated solid waste will strictly NOT be loaded by collection personnel pursuant to Republic Act 9003 and Barangay Ecological Solid Waste Ordinance.</li>
            <li><strong>Disposal Window:</strong> Curbside placement of garbage receptacles is permitted strictly within thirty (30) minutes prior to the scheduled pickup time.</li>
            <li><strong>Sanitary Containment:</strong> Waste receptacles and durable plastic sacks must be securely tied to prevent animal tampering, street scattering, and rainwater contamination.</li>
          </ol>

          <p style="margin-top: 20px; font-size: 13px; color: #475569;">
            For route adjustments, change advisories, or uncollected garbage reporting, kindly access the official 
            <strong>SABTRACK Resident Portal</strong>.
          </p>
        """

        full_html = self.render_base_email(
            title="Garbage Collection Schedule Advisory",
            preheader=preheader,
            body_html=body_html,
            memo_ref=memo_ref,
            memo_to=f"{greeting_name} ({to_email})",
            memo_subject=f"Garbage Collection Schedule Timetable &bull; {area_name}",
        )
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
        """Dispatches waste violation / uncollected trash report status update memorandum."""
        greeting_name = resident_name or "Reporting Resident"
        subject = f"[MEMORANDUM] Citizen Waste Incident Report #{report_id}: Status Updated to {new_status}"
        preheader = f"Official Memorandum: Status update on Report #{report_id} &mdash; {new_status}."
        memo_ref = f"SB-SWM-REP-{report_id}"

        status_colors = {
            "SUBMITTED": ("#e0f2fe", "#0369a1"),
            "UNDER_REVIEW": ("#fef3c7", "#b45309"),
            "IN_PROGRESS": ("#ede9fe", "#6d28d9"),
            "DISPATCHED": ("#ede9fe", "#6d28d9"),
            "RESOLVED": ("#dcfce7", "#15803d"),
            "REJECTED": ("#ffe4e6", "#be123c"),
        }
        bg_col, text_col = status_colors.get(new_status.upper(), ("#f1f5f9", "#334155"))

        body_html = f"""
          <p>This is an official administrative update regarding the community incident ticket 
          <strong>Report #{report_id}</strong> lodged through the SABTRACK Digital Governance platform.</p>

          <table class="table-details">
            <thead>
              <tr>
                <th colspan="2">Official Incident Investigation &amp; Resolution Tracking</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="width: 35%; font-weight: bold; background: #fafafa;">Incident Reference:</td>
                <td><strong>Report #{report_id}</strong></td>
              </tr>
              {f'<tr><td style="font-weight: bold; background: #fafafa;">Incident Category:</td><td>{category}</td></tr>' if category else ''}
              <tr>
                <td style="font-weight: bold; background: #fafafa;">Previous Status:</td>
                <td style="color: #64748b;">{previous_status or 'N/A'}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background: #fafafa;">Official Current Status:</td>
                <td>
                  <span style="background: {bg_col}; color: {text_col}; padding: 3px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block;">
                    {new_status}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="font-weight: bold; background: #fafafa;">Barangay Action / Remarks:</td>
                <td style="color: #1e293b; font-style: italic;">
                  "{remarks or 'Official field inspection completed by Barangay Sabang sanitation operations.'}"
                </td>
              </tr>
            </tbody>
          </table>

          <p style="margin-top: 18px; font-size: 13px; color: #475569;">
            You may log in to the <strong>SABTRACK Resident Portal</strong> to inspect the immutable chronological action history, 
            view evidence photographs, and monitor awarded community engagement points.
          </p>
        """

        full_html = self.render_base_email(
            title=f"Incident Report #{report_id} Status Notice",
            preheader=preheader,
            body_html=body_html,
            memo_ref=memo_ref,
            memo_to=f"{greeting_name} ({to_email})",
            memo_subject=f"Official Action Notice &bull; Incident Report #{report_id}",
        )
        return self.send_email(to_email, subject, full_html)

    def send_welcome_email(
        self,
        to_email: str,
        full_name: str,
    ) -> bool:
        """Dispatches official welcome and account accreditation memorandum to newly registered resident."""
        subject = "[MEMORANDUM] Resident Account Accreditation &bull; SABTRACK 3.0"
        preheader = f"Official Notice: Welcome to SABTRACK, {full_name}. Citizen account accredited."
        now_code = datetime.now(timezone.utc).strftime("%y%m%d")
        memo_ref = f"SB-SWM-REG-{now_code}"

        body_html = f"""
          <p>Greetings in good governance.</p>
          <p><strong>Welcome to SABTRACK 3.0!</strong> Please be officially informed that your citizen user account under the name <strong>{full_name}</strong> 
          has been successfully accredited in the <strong>SABTRACK Digital Solid Waste Governance Platform</strong> 
          of Barangay Sabang, Lipa City.</p>

          <table class="table-details">
            <thead>
              <tr>
                <th colspan="2">Accredited Citizen Profile &amp; Governance Privileges</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="width: 35%; font-weight: bold; background: #fafafa;">Accredited Resident:</td>
                <td><strong>{full_name}</strong></td>
              </tr>
              <tr>
                <td style="font-weight: bold; background: #fafafa;">Linked Email:</td>
                <td style="font-family: monospace;">{to_email}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background: #fafafa;">Jurisdiction:</td>
                <td>Barangay Sabang, Lipa City, Batangas</td>
              </tr>
              <tr>
                <td style="font-weight: bold; background: #fafafa;">Citizen Privileges:</td>
                <td>Route Schedules &bull; Violation Reporting &bull; SAB-Points Rewards &bull; EcoGabay AI</td>
              </tr>
            </tbody>
          </table>

          <p style="margin-top: 18px; font-weight: bold; color: #0F5132; font-size: 13px;">
            PLATFORM CAPABILITIES AVAILABLE TO YOU:
          </p>
          <ul style="font-size: 13px; color: #334155; padding-left: 20px; line-height: 1.8;">
            <li><strong>Garbage Collection Timetables:</strong> Access verified Purok pickup hours and register for automated email route advisories.</li>
            <li><strong>Verified Citizen Reporting:</strong> Submit photographic evidence of uncollected garbage, illegal dumping, or environmental infractions with automated EXIF GPS scrubbing.</li>
            <li><strong>SAB-Points Civic Ledger:</strong> Earn accredited points for participating in community clean-up and segregation drives, redeemable for barangay civic rewards.</li>
            <li><strong>EcoGabay AI Assistant:</strong> Consult our bilingual conversational assistant for proper segregation rules and localized waste upcycling ideas.</li>
          </ul>

          <p style="margin-top: 20px; font-size: 13px; color: #475569;">
            We look forward to your active civic cooperation in preserving the ecological cleanliness and sustainable health of Barangay Sabang.
          </p>
        """

        full_html = self.render_base_email(
            title="Resident Account Accreditation Notice",
            preheader=preheader,
            body_html=body_html,
            memo_ref=memo_ref,
            memo_to=f"{full_name} ({to_email})",
            memo_subject="Citizen Account Accreditation &amp; Solid Waste Governance Participation",
        )
        return self.send_email(to_email, subject, full_html)


email_service = EmailService()
