import io
import base64
import cv2
import numpy as np
from PIL import Image, ImageOps

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:
    pass

def decode_and_orient_image(image_bytes: bytes) -> np.ndarray:
    """
    Decode image bytes and apply EXIF orientation auto-rotation.
    Supports JPG, PNG, WEBP, HEIC, BMP, TIFF, Data URLs, and Base64 encoded images.
    Returns BGR numpy array.
    """
    if not image_bytes:
        raise ValueError("Image file is empty.")

    # Check if image_bytes is a base64 or data URL string
    if image_bytes.startswith(b'data:image') or b'base64,' in image_bytes[:100]:
        try:
            str_data = image_bytes.decode('utf-8', errors='ignore')
            if ',' in str_data:
                str_data = str_data.split(',', 1)[1]
            image_bytes = base64.b64decode(str_data)
        except Exception:
            pass
    elif not image_bytes.startswith(b'\xff\xd8') and not image_bytes.startswith(b'\x89PNG') and not image_bytes.startswith(b'RIFF'):
        # Try raw base64 decode if byte header is not standard JPEG/PNG/WEBP
        try:
            str_data = image_bytes.decode('utf-8', errors='ignore').strip()
            decoded_bytes = base64.b64decode(str_data)
            if len(decoded_bytes) > 100:
                image_bytes = decoded_bytes
        except Exception:
            pass

    # Try PIL (Pillow) decode
    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        pil_img = ImageOps.exif_transpose(pil_img)
        if pil_img.mode != 'RGB':
            pil_img = pil_img.convert('RGB')
        img_np = np.array(pil_img)
        return cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
    except Exception:
        pass

    # Fallback to direct OpenCV decode
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is not None:
            return img
    except Exception:
        pass

    raise ValueError("Failed to decode image data. Please upload a valid image file.")

def deskew_image(image: np.ndarray) -> np.ndarray:
    """
    Deskew image using minimum area bounding rectangle on text contours.
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) < 10:
            return image

        # Subsample coordinates for 20x faster minAreaRect computation
        subsampled_coords = coords[::20]
        angle = cv2.minAreaRect(subsampled_coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        # Only deskew for small tilts (-15 to 15 degrees)
        if abs(angle) > 0.5 and abs(angle) < 15.0:
            (h, w) = image.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            rotated = cv2.warpAffine(
                image, M, (w, h),
                flags=cv2.INTER_LINEAR,
                borderMode=cv2.BORDER_REPLICATE
            )
            return rotated
    except Exception:
        pass
    return image

def resize_for_ocr(image: np.ndarray, target_max_dim: int = 1600) -> np.ndarray:
    """
    Resize image maintaining aspect ratio so max dimension is target_max_dim.
    """
    h, w = image.shape[:2]
    max_dim = max(h, w)
    if max_dim == 0:
        return image

    if max_dim < 800 or max_dim > target_max_dim:
        scale = target_max_dim / float(max_dim)
        new_w = int(w * scale)
        new_h = int(h * scale)
        interpolation = cv2.INTER_LINEAR if scale > 1.0 else cv2.INTER_AREA
        return cv2.resize(image, (new_w, new_h), interpolation=interpolation)
    return image

def enhance_contrast(image: np.ndarray) -> np.ndarray:
    """
    Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) in LAB color space.
    """
    try:
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        return enhanced
    except Exception:
        return image

def handle_dark_mode(image: np.ndarray) -> np.ndarray:
    """
    If image background is dark (mean brightness < 120), invert colors (bitwise_not)
    so white text on dark background becomes black text on white background.
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        mean_val = np.mean(gray)
        if mean_val < 120:
            return cv2.bitwise_not(image)
    except Exception:
        pass
    return image

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Full image preprocessing pipeline:
    1. Decode & EXIF auto-rotate
    2. Resize for optimal OCR density (reduces computation for subsequent ops)
    3. Handle dark mode inversion
    4. Deskew tilt
    5. Contrast enhancement
    """
    img = decode_and_orient_image(image_bytes)
    img = resize_for_ocr(img, target_max_dim=1600)
    img = handle_dark_mode(img)
    img = deskew_image(img)
    img = enhance_contrast(img)
    return img
