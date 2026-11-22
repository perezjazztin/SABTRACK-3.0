# Integrated Identity Verification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the IT-312 Integrated Identity Verification System into SABTRACK resident registration, enforcing a 6-step gated onboarding sequence combining open-source government ID OCR scanning, camera-based active liveness detection (head turn and blink), biometric facial matching, and dual-audit personal information review.

**Architecture:** The Next.js frontend implements an interactive camera HUD with real-time pose and blink guidance cues, gating user progression across the 6 required stages. The FastAPI backend implements an open-source computer vision pipeline using OpenCV and OCR heuristics to extract personal details, compare facial features against the ID portrait, enforce Sybil/duplicate prevention, and sign single-use verification tokens for final registration.

**Tech Stack:** Python 3.13, FastAPI, OpenCV (`opencv-python-headless`), Pillow, SQLAlchemy, Alembic, PostgreSQL, Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Vitest, Pytest.

**Spec:** `docs/superpowers/specs/2026-11-22-integrated-identity-verification-design.md`

---

## Global Constraints

- Mandatory 6-step sequence: `ID Upload → ID Scanning → Face Registration → Face Matching → Personal Information → Final Verification`.
- Supported government IDs: Philippine National ID (PhilSys), Driver's License, Passport, UMID.
- Personal Information Review (Step 5) must remain completely inaccessible until both ID scanning and face matching succeed.
- Zero paid APIs or third-party identity verification SaaS; rely strictly on open-source Python and native browser standards.
- Data Privacy Act of 2012 (RA 10173): Strip EXIF GPS telemetry, purge live biometric capture frames immediately after matching, and never log PII or unhashed tokens.
- Single physical ID prevention: `id_number_hash = SHA256(normalized_id_number)` enforced with a database unique index.
- Controlled review tolerance: Extracted fields auto-populate; manual corrections must maintain >= 80% string similarity against OCR text or trigger re-scan.

---

## Review Focus

1. **Unreadable or Blurry ID Image:** System must return a clear 422 Unprocessable response with actionable guidance (check lighting, avoid glare) and a retry button without resetting user progress.
2. **Face Mismatch (Impersonation):** Live facial snapshot differing from ID card portrait (similarity < 0.60) must be rejected with 400 Bad Request, increment failure count, and offer a retry without leaking raw match vectors.
3. **Sybil/Duplicate ID Reuse:** Attempting to register an ID number whose `id_number_hash` already exists in `IdentityVerification` with an active user must fail with 409 Conflict.
4. **Identity Tampering in Step 5:** User modifying the pre-populated name to an entirely different identity (< 80% Levenshtein similarity) must be blocked by backend validation.
5. **Token Replay / Expired Token:** Attempting to submit registration with an expired (> 15 minutes) or already consumed `verification_token` must fail with 400/403.

---

### Task 1: Identity Verification Database Model & Alembic Migration

**Files:**
- Create: `apps/api/app/modules/identity_verification/models.py`
- Create: `apps/api/app/modules/identity_verification/__init__.py`
- Create: `apps/api/alembic/versions/0003_identity_verification.py`
- Test: `apps/api/tests/test_identity_verification_model.py`

**Interfaces:**
- Consumes: `app.core.database.Base`, `app.modules.identity.models.User`
- Produces: `IdentityVerification` SQLAlchemy model with `VerificationStatus` and `SupportedIdType` enums.

- [ ] **Step 1: Write the failing test**

```python
# apps/api/tests/test_identity_verification_model.py
import pytest
from datetime import datetime, timezone, timedelta
from app.modules.identity_verification.models import IdentityVerification, VerificationStatus, SupportedIdType

def test_create_identity_verification_record(db_session):
    record = IdentityVerification(
        id_type=SupportedIdType.PHILIPPINE_NATIONAL_ID,
        id_number_hash="sample_sha256_hash_123",
        id_number_masked="****-****-9876",
        ocr_full_name="JUAN DELA CRUZ",
        submitted_full_name="JUAN DELA CRUZ",
        status=VerificationStatus.PENDING,
        verification_token_hash="sample_token_hash",
        token_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        is_demo_data=True,
    )
    db_session.add(record)
    db_session.commit()
    db_session.refresh(record)

    assert record.id is not None
    assert record.status == VerificationStatus.PENDING
    assert record.id_type == SupportedIdType.PHILIPPINE_NATIONAL_ID
    assert record.is_user_corrected is False
```

- [ ] **Step 2: Run test to verify it fails**

Run: `apps/api/.venv/Scripts/python.exe -m pytest apps/api/tests/test_identity_verification_model.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.modules.identity_verification'`

- [ ] **Step 3: Implement `IdentityVerification` model and Alembic migration**

Define `SupportedIdType` (`PHILIPPINE_NATIONAL_ID`, `DRIVERS_LICENSE`, `PASSPORT`, `UMID`) and `VerificationStatus` (`PENDING`, `VERIFIED`, `REJECTED`, `FLAGGED`). Define `IdentityVerification` table in `apps/api/app/modules/identity_verification/models.py`. Generate and write Alembic migration `0003_identity_verification.py`.

- [ ] **Step 4: Run test to verify it passes**

Run: `apps/api/.venv/Scripts/python.exe -m pytest apps/api/tests/test_identity_verification_model.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/modules/identity_verification apps/api/alembic/versions apps/api/tests/test_identity_verification_model.py
git commit -m "feat(identity): add IdentityVerification database model and migration"
```

---

### Task 2: Backend OCR Extraction Service (`ocr_service.py`)

**Files:**
- Create: `apps/api/app/modules/identity_verification/services/ocr_service.py`
- Test: `apps/api/tests/test_identity_ocr_service.py`

**Interfaces:**
- Consumes: Raw image bytes, `SupportedIdType`
- Produces: `ExtractedIdData` dataclass containing `full_name`, `dob`, `address`, `id_number`, `id_number_hash`, `id_number_masked`, `raw_text`, `is_readable`

- [ ] **Step 1: Write the failing test**

```python
# apps/api/tests/test_identity_ocr_service.py
import pytest
from app.modules.identity_verification.services.ocr_service import IdOcrService
from app.modules.identity_verification.models import SupportedIdType

def test_ocr_service_strips_exif_and_parses_sample_id():
    service = IdOcrService()
    synthetic_id_bytes = service.generate_synthetic_id_image(
        full_name="JUAN DELA CRUZ",
        dob="1995-08-15",
        id_number="1234-5678-9012-3456",
        address="PUROK 2, BARANGAY SABANG, LIPA CITY",
        id_type=SupportedIdType.PHILIPPINE_NATIONAL_ID,
    )
    result = service.extract_id_data(synthetic_id_bytes, SupportedIdType.PHILIPPINE_NATIONAL_ID)
    
    assert result.is_readable is True
    assert "JUAN DELA CRUZ" in result.full_name
    assert result.id_number_masked.endswith("3456")
    assert len(result.id_number_hash) == 64
```

- [ ] **Step 2: Run test to verify it fails**

Run: `apps/api/.venv/Scripts/python.exe -m pytest apps/api/tests/test_identity_ocr_service.py -v`
Expected: FAIL with `ModuleNotFoundError` or `ImportError`

- [ ] **Step 3: Implement `IdOcrService` in `apps/api/app/modules/identity_verification/services/ocr_service.py`**

Implement image loading via Pillow/OpenCV, strip EXIF metadata, perform contrast normalization and blur checking (Laplacian variance threshold). Use regex patterns tailored to PhilSys, Driver's License, Passport, and UMID formats to extract Name, DOB, Address, and ID Number. Include deterministic SHA-256 hash calculation for `id_number_hash` and masking for `id_number_masked`.

- [ ] **Step 4: Run test to verify it passes**

Run: `apps/api/.venv/Scripts/python.exe -m pytest apps/api/tests/test_identity_ocr_service.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/modules/identity_verification/services/ocr_service.py apps/api/tests/test_identity_ocr_service.py
git commit -m "feat(identity): implement open-source ID OCR extraction service"
```

---

### Task 3: Backend Face Matching Service (`face_matching_service.py`)

**Files:**
- Create: `apps/api/app/modules/identity_verification/services/face_matching_service.py`
- Test: `apps/api/tests/test_face_matching_service.py`

**Interfaces:**
- Consumes: Raw ID image bytes, captured live face frame bytes
- Produces: `FaceMatchResult(is_match: bool, match_score: float, details: str)`

- [ ] **Step 1: Write the failing test**

```python
# apps/api/tests/test_face_matching_service.py
import pytest
from app.modules.identity_verification.services.face_matching_service import FaceMatchingService

def test_face_matching_detects_similarity_and_rejects_dissimilar():
    service = FaceMatchingService()
    face_a_bytes, face_a_variant_bytes, face_b_bytes = service.generate_test_face_fixtures()
    
    match_result = service.compare_faces(face_a_bytes, face_a_variant_bytes)
    assert match_result.is_match is True
    assert match_result.match_score >= 0.60
    
    mismatch_result = service.compare_faces(face_a_bytes, face_b_bytes)
    assert mismatch_result.is_match is False
    assert mismatch_result.match_score < 0.60
```

- [ ] **Step 2: Run test to verify it fails**

Run: `apps/api/.venv/Scripts/python.exe -m pytest apps/api/tests/test_face_matching_service.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Implement `FaceMatchingService` in `apps/api/app/modules/identity_verification/services/face_matching_service.py`**

Implement OpenCV Haar cascade or DNN facial detection to crop the portrait area from the ID document and locate the face in the live captured frame. Compute multi-channel color histogram and structural template correlation (or ORB feature matching) normalized between 0.0 and 1.0. If `match_score >= 0.60`, return `is_match=True`. Ensure live frame bytes are deleted from memory/disk immediately after comparison.

- [ ] **Step 4: Run test to verify it passes**

Run: `apps/api/.venv/Scripts/python.exe -m pytest apps/api/tests/test_face_matching_service.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/modules/identity_verification/services/face_matching_service.py apps/api/tests/test_face_matching_service.py
git commit -m "feat(identity): implement OpenCV facial recognition and matching service"
```

---

### Task 4: Identity Verification API Endpoints (`/scan-id` and `/verify-face`)

**Files:**
- Create: `apps/api/app/modules/identity_verification/schemas.py`
- Create: `apps/api/app/api/v1/endpoints/identity_verification.py`
- Modify: `apps/api/app/main.py`
- Test: `apps/api/tests/test_identity_verification_endpoints.py`

**Interfaces:**
- Consumes: FastAPI router, `get_db`, `IdOcrService`, `FaceMatchingService`
- Produces:
  - `POST /api/v1/identity-verification/scan-id`: Returns `ScanIdResponse(temp_verification_id, extracted_data, message)`
  - `POST /api/v1/identity-verification/verify-face`: Returns `VerifyFaceResponse(verification_token, match_score, message)`

- [ ] **Step 1: Write the failing test**

```python
# apps/api/tests/test_identity_verification_endpoints.py
import pytest
from app.modules.identity_verification.services.ocr_service import IdOcrService
from app.modules.identity_verification.models import SupportedIdType

def test_scan_id_and_verify_face_workflow(client):
    ocr_service = IdOcrService()
    sample_id = ocr_service.generate_synthetic_id_image(
        full_name="JUAN DELA CRUZ",
        dob="1995-08-15",
        id_number="1234-5678-9012-3456",
        address="PUROK 2, SABANG",
        id_type=SupportedIdType.PHILIPPINE_NATIONAL_ID,
    )
    
    # 1. Scan ID
    scan_res = client.post(
        "/api/v1/identity-verification/scan-id",
        data={"id_type": "PHILIPPINE_NATIONAL_ID"},
        files={"file": ("test_id.png", sample_id, "image/png")},
    )
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    temp_id = scan_data["temp_verification_id"]
    assert scan_data["extracted_data"]["full_name"] == "JUAN DELA CRUZ"
    
    # 2. Verify Face
    verify_res = client.post(
        "/api/v1/identity-verification/verify-face",
        data={"temp_verification_id": temp_id},
        files={"live_face": ("live.png", sample_id, "image/png")},
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert "verification_token" in verify_data
    assert len(verify_data["verification_token"]) >= 32
```

- [ ] **Step 2: Run test to verify it fails**

Run: `apps/api/.venv/Scripts/python.exe -m pytest apps/api/tests/test_identity_verification_endpoints.py -v`
Expected: FAIL with 404 Not Found

- [ ] **Step 3: Implement endpoints in `apps/api/app/api/v1/endpoints/identity_verification.py`**

Define schemas (`ScanIdResponse`, `VerifyFaceResponse`). Register endpoints on APIRouter. In `/scan-id`: check duplicate `id_number_hash` against verified accounts, save `IdentityVerification(status=PENDING)`, and store temporary ID portrait cache. In `/verify-face`: load session, run `FaceMatchingService`, set `status=VERIFIED`, generate 32-byte token, save token hash with 15-minute expiration, and return token. Include APIRouter in `apps/api/app/main.py`.

- [ ] **Step 4: Run test to verify it passes**

Run: `apps/api/.venv/Scripts/python.exe -m pytest apps/api/tests/test_identity_verification_endpoints.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/modules/identity_verification/schemas.py apps/api/app/api/v1/endpoints/identity_verification.py apps/api/app/main.py apps/api/tests/test_identity_verification_endpoints.py
git commit -m "feat(identity): add /scan-id and /verify-face verification endpoints"
```

---

### Task 5: Registration Integration with Verification Gating & Similarity Validation

**Files:**
- Modify: `apps/api/app/modules/identity/schemas.py`
- Modify: `apps/api/app/api/v1/endpoints/auth.py`
- Test: `apps/api/tests/test_auth_registration_verification.py`

**Interfaces:**
- Consumes: `UserCreate(verification_token: str | None)`, `IdentityVerification` model
- Produces: Gated registration validating token authenticity, expiration, and Levenshtein name similarity (>= 80%).

- [ ] **Step 1: Write the failing test**

```python
# apps/api/tests/test_auth_registration_verification.py
import pytest
from app.modules.identity_verification.models import IdentityVerification, VerificationStatus, SupportedIdType
from app.core.security import hash_token
from datetime import datetime, timezone, timedelta

def test_registration_with_valid_verification_token_succeeds(client, db_session):
    raw_token = "valid_test_token_1234567890abcdef1234567890"
    verification = IdentityVerification(
        id_type=SupportedIdType.PHILIPPINE_NATIONAL_ID,
        id_number_hash="hash_unique_123",
        id_number_masked="****-****-1234",
        ocr_full_name="JUAN DELA CRUZ",
        submitted_full_name="JUAN DELA CRUZ",
        status=VerificationStatus.VERIFIED,
        verification_token_hash=hash_token(raw_token),
        token_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        is_demo_data=True,
    )
    db_session.add(verification)
    db_session.commit()

    payload = {
        "email": "verified.juan@sabtrack.test",
        "password": "ValidResidentPass2026!",
        "full_name": "JUAN DELA CRUZ",
        "area_id": 1,
        "verification_token": raw_token,
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    
    db_session.refresh(verification)
    assert verification.user_id is not None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `apps/api/.venv/Scripts/python.exe -m pytest apps/api/tests/test_auth_registration_verification.py -v`
Expected: FAIL because `verification_token` logic is not yet handled.

- [ ] **Step 3: Modify `UserCreate` schema and `auth.py` registration endpoint**

Add `verification_token: str | None = Field(default=None)` to `UserCreate`. In `auth.py`: if `verification_token` is provided, find matching `IdentityVerification` by `hash_token(verification_token)`. Assert `status == VERIFIED`, `token_expires_at > now`, and `user_id is None`. Compute Levenshtein distance between `payload.full_name` and `verification.ocr_full_name`; if similarity < 0.80, raise `HTTP 400 Bad Request ("Submitted name does not match verified ID name.")`. Update `verification.user_id = new_user.id`, `verification.submitted_full_name = payload.full_name`, and `verification.is_user_corrected = (payload.full_name != verification.ocr_full_name)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `apps/api/.venv/Scripts/python.exe -m pytest apps/api/tests/test_auth_registration_verification.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/modules/identity/schemas.py apps/api/app/api/v1/endpoints/auth.py apps/api/tests/test_auth_registration_verification.py
git commit -m "feat(auth): enforce identity verification token validation and name similarity on registration"
```

---

### Task 6: Frontend API Client & Verification Types

**Files:**
- Create: `apps/web/src/types/verification.ts`
- Modify: `apps/web/src/lib/api-client.ts`
- Test: `apps/web/tests/VerificationApiClient.test.ts`

**Interfaces:**
- Consumes: Next.js API client structure
- Produces: `scanGovernmentId(file: File, idType: string)`, `verifyFaceBiometrics(tempId: string, liveFaceBlob: Blob)`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/tests/VerificationApiClient.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanGovernmentId, verifyFaceBiometrics } from '@/lib/api-client';

describe('Verification API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('submits ID scan multipart request', async () => {
    const mockFile = new File(['mock_bytes'], 'id.png', { type: 'image/png' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        temp_verification_id: 'temp_123',
        extracted_data: { full_name: 'JUAN DELA CRUZ', dob: '1995-08-15', address: 'SABANG' },
        message: 'ID scanned successfully.',
      }),
    });

    const res = await scanGovernmentId(mockFile, 'PHILIPPINE_NATIONAL_ID');
    expect(res.temp_verification_id).toBe('temp_123');
    expect(res.extracted_data.full_name).toBe('JUAN DELA CRUZ');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && cmd.exe /c npm test tests/VerificationApiClient.test.ts`
Expected: FAIL with `scanGovernmentId is not defined`

- [ ] **Step 3: Define verification types and methods in `api-client.ts`**

Define `SupportedIdType`, `ExtractedIdData`, `ScanIdResponse`, `VerifyFaceResponse` in `src/types/verification.ts`. Export `scanGovernmentId` and `verifyFaceBiometrics` in `src/lib/api-client.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && cmd.exe /c npm test tests/VerificationApiClient.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/types/verification.ts apps/web/src/lib/api-client.ts apps/web/tests/VerificationApiClient.test.ts
git commit -m "feat(web): add identity verification types and API client functions"
```

---

### Task 7: Frontend Interactive Face Capture & Active Liveness HUD (`FaceCaptureModal.tsx`)

**Files:**
- Create: `apps/web/src/components/verification/FaceCaptureModal.tsx`
- Test: `apps/web/tests/FaceCaptureModal.test.tsx`

**Interfaces:**
- Consumes: Browser `navigator.mediaDevices.getUserMedia`, React video stream
- Produces: `FaceCaptureModal` component triggering `onCapture(faceBlob: Blob)` after completing active liveness sequence (look center, turn left, turn right, blink eyes).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/tests/FaceCaptureModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FaceCaptureModal from '@/components/verification/FaceCaptureModal';

describe('FaceCaptureModal Component', () => {
  it('renders interactive pose instructions and liveness checklist', () => {
    const handleCapture = vi.fn();
    const handleClose = vi.fn();
    render(<FaceCaptureModal isOpen={true} onCapture={handleCapture} onClose={handleClose} />);

    expect(screen.getByText(/Look straight at the camera/i)).toBeInTheDocument();
    expect(screen.getByText(/Look to the left/i)).toBeInTheDocument();
    expect(screen.getByText(/Look to the right/i)).toBeInTheDocument();
    expect(screen.getByText(/Blink naturally/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && cmd.exe /c npm test tests/FaceCaptureModal.test.tsx`
Expected: FAIL with `Module not found`

- [ ] **Step 3: Implement `FaceCaptureModal.tsx`**

Build camera HUD modal with circular/oval face aperture, video stream integration, fallback canvas capture, and interactive pose checklist (Look center -> Turn left -> Turn right -> Blink -> Auto-capture). Include lighting and distance indicator alerts. On successful capture, export high-resolution JPEG/PNG blob and call `onCapture(blob)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && cmd.exe /c npm test tests/FaceCaptureModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/verification/FaceCaptureModal.tsx apps/web/tests/FaceCaptureModal.test.tsx
git commit -m "feat(web): implement camera HUD modal with active liveness and blink guidance"
```

---

### Task 8: Frontend Multi-Step Gated Registration Flow (`/register/page.tsx`)

**Files:**
- Modify: `apps/web/src/app/register/page.tsx`
- Test: `apps/web/tests/RegisterVerificationFlow.test.tsx`

**Interfaces:**
- Consumes: `FaceCaptureModal`, `scanGovernmentId`, `verifyFaceBiometrics`, `registerResident`
- Produces: 6-step gated verification and registration workflow.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/tests/RegisterVerificationFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RegisterPage from '@/app/register/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe('RegisterPage Multi-Step Flow', () => {
  it('displays supported government IDs on initial load and locks personal info', () => {
    render(<RegisterPage />);
    expect(screen.getByText(/Philippine National ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Driver's License/i)).toBeInTheDocument();
    expect(screen.getByText(/Passport/i)).toBeInTheDocument();
    expect(screen.getByText(/UMID/i)).toBeInTheDocument();
    
    // Personal information form must not be visible or submittable before verification
    expect(screen.queryByLabelText(/Create Password/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && cmd.exe /c npm test tests/RegisterVerificationFlow.test.tsx`
Expected: FAIL because `/register/page.tsx` is currently a single-step manual form.

- [ ] **Step 3: Refactor `/register/page.tsx` into the 6-step gated workflow**

Implement step state:
- Step 1: ID Upload & Supported Cards Overview (PhilSys, Driver's License, Passport, UMID).
- Step 2: ID Scanning & OCR Validation (shows progress, extracts fields, handles unreadable/blur retry).
- Step 3: Interactive Face Registration & Capture HUD (opens `FaceCaptureModal`).
- Step 4: Facial Biometric Matching (submits live frame, checks match score, offers retry).
- Step 5: Personal Information Review (auto-fills Full Name, DOB, calculated Age, Address, ID Number; allows minor typo correction; collects email, password, purok, and RA 10173 consent).
- Step 6: Final Verification Result & Confirmation (displays verification badge and redirects to login).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && cmd.exe /c npm test tests/RegisterVerificationFlow.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/register/page.tsx apps/web/tests/RegisterVerificationFlow.test.tsx
git commit -m "feat(web): transform resident registration into 6-step gated identity verification flow"
```

---

### Task 9: End-to-End System Verification & Regression Suite

**Files:**
- Test: All backend and frontend test suites

- [ ] **Step 1: Execute full backend test suite**

Run: `apps/api/.venv/Scripts/python.exe -m pytest apps/api/tests -v`
Expected: All tests PASS with zero regressions.

- [ ] **Step 2: Execute full frontend test suite**

Run: `cd apps/web && cmd.exe /c npm test`
Expected: All Vitest suites PASS.

- [ ] **Step 3: Execute Next.js build check**

Run: `cd apps/web && cmd.exe /c npm run build`
Expected: Next.js builds successfully with zero TypeScript or linting errors.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore(verification): verify full test suite and clean build for integrated identity verification"
```
