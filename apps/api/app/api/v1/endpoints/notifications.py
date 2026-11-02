from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.config import settings
from app.core.deps import get_current_user
from app.modules.identity.models import User, UserRole
from app.modules.notifications.service import email_service

router = APIRouter()


class TestEmailRequest(BaseModel):
    recipient_email: Optional[str] = None


class TestEmailResponse(BaseModel):
    success: bool
    message: str
    recipient: str
    mode: str
    smtp_host: Optional[str] = None


def require_staff_or_admin(user: User = Depends(get_current_user)) -> User:
    """Dependency verifying caller is either Barangay Staff or Barangay Admin."""
    if user.role not in [UserRole.BARANGAY_STAFF, UserRole.BARANGAY_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Staff or Admin role required.",
        )
    return user


@router.post(
    "/test-email",
    response_model=TestEmailResponse,
    summary="Send test diagnostic email (Staff/Admin only)",
)
def send_test_email_endpoint(
    payload: TestEmailRequest,
    current_user: User = Depends(require_staff_or_admin),
):
    """Sends a formatted diagnostic test email to verify SMTP configuration or offline preview simulator."""
    target_email = payload.recipient_email.strip().lower() if payload.recipient_email else current_user.email
    if not target_email or "@" not in target_email or "." not in target_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid recipient email address is required.",
        )

    subject = "[SABTRACK Test] Email Notification System Diagnostic"
    preheader = "Testing SABTRACK 3.0 notification dispatch system."
    body_html = f"""
      <h2 style="color: #0F5132; margin-top: 0; font-size: 18px;">Email System Diagnostic</h2>
      <p>This is a successful test email dispatched by <strong>{current_user.full_name}</strong> ({current_user.role.value}).</p>
      <div class="card-box">
        <p style="margin: 0 0 6px 0; font-weight: bold; color: #0F5132;">SYSTEM STATUS</p>
        <p style="margin: 4px 0;"><strong>Active Mode:</strong> {'Live SMTP (' + settings.SMTP_HOST + ')' if settings.SMTP_ENABLED and settings.SMTP_USER else 'Offline Local Preview Simulator'}</p>
        <p style="margin: 4px 0;"><strong>Recipient:</strong> {target_email}</p>
        <p style="margin: 4px 0;"><strong>Platform:</strong> SABTRACK 3.0 • Barangay Sabang</p>
      </div>
    """
    full_html = email_service.render_base_email("Diagnostic Test Email", preheader, body_html)
    sent = email_service.send_email(target_email, subject, full_html)

    mode = "live_smtp" if settings.SMTP_ENABLED and settings.SMTP_USER else "dev_simulator"
    msg = (
        f"Test email successfully dispatched via live SMTP to {target_email}."
        if mode == "live_smtp"
        else f"Test email generated in offline simulator and saved to {settings.STORAGE_EMAIL_DIR}."
    )

    return TestEmailResponse(
        success=sent,
        message=msg,
        recipient=target_email,
        mode=mode,
        smtp_host=settings.SMTP_HOST if mode == "live_smtp" else None,
    )
