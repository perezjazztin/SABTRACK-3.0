import io
from dataclasses import dataclass
from typing import Optional, Tuple
import cv2
import numpy as np
from PIL import Image, ImageDraw


@dataclass
class FaceMatchResult:
    is_match: bool
    match_score: float
    details: str


class FaceMatchingService:
    """Open-source computer vision service for detecting and comparing facial biometrics."""

    MATCH_THRESHOLD: float = 0.60

    def __init__(self):
        # Gracefully handle optional Haar Cascade across OpenCV releases (4.x and 5.x)
        cascade_cls = getattr(cv2, "CascadeClassifier", None)
        if cascade_cls and hasattr(cv2, "data") and hasattr(cv2.data, "haarcascades"):
            try:
                self.face_cascade = cascade_cls(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            except Exception:
                self.face_cascade = None
        else:
            self.face_cascade = None

    def _detect_and_crop_face(self, img: np.ndarray) -> Optional[np.ndarray]:
        """Detects the primary face region and returns normalized 128x128 grayscale crop."""
        if img is None:
            return None
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Check standard deviation to eliminate completely flat/blank images
        if np.std(gray) < 12.0:
            return None

        # 1. Try Haar Cascade if available
        if self.face_cascade is not None and not self.face_cascade.empty():
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=3,
                minSize=(30, 30),
            )
            if len(faces) > 0:
                faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
                x, y, w, h = faces[0]
                face_crop = gray[y: y + h, x: x + w]
                resized = cv2.resize(face_crop, (128, 128))
                return cv2.equalizeHist(resized)

        # 2. Resilient Skin-tone & Facial Region Detection (YCbCr thresholding)
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        # Skin color boundaries in YCrCb color space
        lower_skin = np.array([0, 133, 77], dtype=np.uint8)
        upper_skin = np.array([255, 173, 127], dtype=np.uint8)
        mask = cv2.inRange(ycrcb, lower_skin, upper_skin)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        valid_contours = [c for c in contours if cv2.contourArea(c) > 400]

        if valid_contours:
            largest = max(valid_contours, key=cv2.contourArea)
            x, y, w, h = cv2.boundingRect(largest)
            # Expand bounding box slightly for context
            pad_w = int(w * 0.1)
            pad_h = int(h * 0.1)
            x1 = max(0, x - pad_w)
            y1 = max(0, y - pad_h)
            x2 = min(gray.shape[1], x + w + pad_w)
            y2 = min(gray.shape[0], y + h + pad_h)
            crop = gray[y1:y2, x1:x2]
            if crop.size > 0:
                resized = cv2.resize(crop, (128, 128))
                return cv2.equalizeHist(resized)

        # 3. If image has significant structure and looks like a cropped portrait/head
        h, w = gray.shape[:2]
        crop = gray[int(h * 0.1): int(h * 0.9), int(w * 0.1): int(w * 0.9)]
        if crop.size > 0 and np.std(crop) >= 20.0:
            resized = cv2.resize(crop, (128, 128))
            return cv2.equalizeHist(resized)

        return None

    def compare_faces(self, id_image_bytes: bytes, live_face_bytes: bytes) -> FaceMatchResult:
        """Compares ID photograph against live captured face snapshot."""
        id_arr = np.frombuffer(id_image_bytes, np.uint8)
        live_arr = np.frombuffer(live_face_bytes, np.uint8)

        id_img = cv2.imdecode(id_arr, cv2.IMREAD_COLOR)
        live_img = cv2.imdecode(live_arr, cv2.IMREAD_COLOR)

        if id_img is None:
            return FaceMatchResult(is_match=False, match_score=0.0, details="Unreadable ID image.")
        if live_img is None:
            return FaceMatchResult(is_match=False, match_score=0.0, details="Unreadable live face capture.")

        id_face = self._detect_and_crop_face(id_img)
        live_face = self._detect_and_crop_face(live_img)

        if id_face is None:
            return FaceMatchResult(
                is_match=False,
                match_score=0.0,
                details="No face detected on uploaded ID card. Please ensure the portrait is clearly visible.",
            )

        if live_face is None:
            return FaceMatchResult(
                is_match=False,
                match_score=0.0,
                details="No face detected in live camera frame. Please face the camera with good lighting.",
            )

        # Compute normalized template correlation and histogram similarity
        hist_id = cv2.calcHist([id_face], [0], None, [64], [0, 256])
        hist_live = cv2.calcHist([live_face], [0], None, [64], [0, 256])
        cv2.normalize(hist_id, hist_id, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist_live, hist_live, 0, 1, cv2.NORM_MINMAX)

        hist_sim = float(cv2.compareHist(hist_id, hist_live, cv2.HISTCMP_CORREL))

        res = cv2.matchTemplate(id_face, live_face, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, _ = cv2.minMaxLoc(res)
        template_sim = float(max_val)

        # Blended confidence score (clamped between 0.0 and 1.0)
        combined_score = max(0.0, min(1.0, (hist_sim * 0.4 + template_sim * 0.6)))

        is_match = combined_score >= self.MATCH_THRESHOLD
        detail_msg = (
            f"Face match verified (Confidence: {combined_score:.1%})"
            if is_match
            else f"Face mismatch. Similarity score ({combined_score:.1%}) below required threshold ({self.MATCH_THRESHOLD:.0%})."
        )

        return FaceMatchResult(
            is_match=is_match,
            match_score=round(combined_score, 4),
            details=detail_msg,
        )

    def generate_test_face_fixtures(self) -> Tuple[bytes, bytes, bytes]:
        """Generates synthetic test faces: Person A, Person A (slight angle), and Person B."""
        def make_face(skin_color, eye_color, hair_color, mouth_curve):
            img = Image.new("RGB", (200, 200), color=(230, 230, 230))
            draw = ImageDraw.Draw(img)
            # Head
            draw.ellipse([(40, 30), (160, 170)], fill=skin_color, outline=(50, 50, 50), width=2)
            # Hair
            draw.arc([(40, 20), (160, 90)], 180, 360, fill=hair_color, width=12)
            # Eyes
            draw.ellipse([(65, 75), (85, 95)], fill=(255, 255, 255), outline=(0, 0, 0))
            draw.ellipse([(72, 82), (78, 88)], fill=eye_color)
            draw.ellipse([(115, 75), (135, 95)], fill=(255, 255, 255), outline=(0, 0, 0))
            draw.ellipse([(122, 82), (128, 88)], fill=eye_color)
            # Nose
            draw.line([(100, 95), (95, 120), (105, 120)], fill=(120, 80, 60), width=2)
            # Mouth
            draw.arc([(75, 125), (125, 155)], mouth_curve[0], mouth_curve[1], fill=(160, 50, 50), width=3)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            return buf.getvalue()

        face_a = make_face((240, 200, 160), (40, 70, 120), (30, 30, 30), (0, 180))
        face_a_var = make_face((238, 198, 158), (40, 70, 120), (30, 30, 30), (10, 170))
        face_b = make_face((140, 90, 60), (20, 20, 20), (180, 140, 40), (180, 360))
        return face_a, face_a_var, face_b

    def generate_blank_fixture(self) -> bytes:
        """Generates an image without any face elements."""
        img = Image.new("RGB", (200, 200), color=(255, 255, 255))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
