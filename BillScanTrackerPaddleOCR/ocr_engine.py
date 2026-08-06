import numpy as np
from typing import Dict, Any, List
from paddleocr import PaddleOCR
from extractors import extract_amount, extract_merchant

class OCREngine:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            # Initialize PaddleOCR engine with PP-OCRv4 models and disable doc orientation/unwarping for PIR stability
            cls._instance = PaddleOCR(
                text_detection_model_name='PP-OCRv4_mobile_det',
                text_recognition_model_name='en_PP-OCRv4_mobile_rec',
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False
            )
        return cls._instance

def process_ocr_image(img_np: np.ndarray) -> Dict[str, Any]:
    """
    Run PaddleOCR on numpy BGR image array and build StructuredOCRResult format.
    """
    ocr_engine = OCREngine.get_instance()
    results = ocr_engine.ocr(img_np)

    items: List[Dict[str, Any]] = []
    lines_text: List[str] = []
    confidences: List[float] = []

    if results:
        for res in results:
            if isinstance(res, dict):
                texts = res.get('rec_texts', [])
                scores = res.get('rec_scores', [])
                polys = res.get('rec_polys', res.get('dt_polys', []))

                for i, raw_text in enumerate(texts):
                    raw_text = str(raw_text).strip() if raw_text else ""
                    if not raw_text:
                        continue
                    conf = float(scores[i]) if i < len(scores) else 0.9
                    poly = polys[i] if (polys is not None and i < len(polys)) else None

                    min_x, max_x, min_y, max_y = 0, 0, 0, 0
                    if poly is not None and len(poly) > 0:
                        try:
                            xs = [float(p[0]) for p in poly]
                            ys = [float(p[1]) for p in poly]
                            min_x, max_x = int(min(xs)), int(max(xs))
                            min_y, max_y = int(min(ys)), int(max(ys))
                        except Exception:
                            pass

                    box = {
                        "x": max(0, min_x),
                        "y": max(0, min_y),
                        "w": max(1, max_x - min_x),
                        "h": max(1, max_y - min_y)
                    }

                    conf_percent = int(round(conf * 100)) if conf <= 1.0 else int(conf)

                    items.append({
                        "text": raw_text,
                        "confidence": conf_percent,
                        "box": box
                    })
                    lines_text.append(raw_text)
                    confidences.append(conf_percent)

            elif isinstance(res, list):
                for line in res:
                    try:
                        poly = line[0]
                        text_info = line[1]
                        raw_text = text_info[0].strip() if text_info[0] else ""
                        conf = float(text_info[1]) if len(text_info) > 1 else 0.9
                        if not raw_text:
                            continue
                        xs = [p[0] for p in poly]
                        ys = [p[1] for p in poly]
                        min_x, max_x = int(min(xs)), int(max(xs))
                        min_y, max_y = int(min(ys)), int(max(ys))
                        box = {
                            "x": max(0, min_x),
                            "y": max(0, min_y),
                            "w": max(1, max_x - min_x),
                            "h": max(1, max_y - min_y)
                        }
                        conf_percent = int(round(conf * 100)) if conf <= 1.0 else int(conf)
                        items.append({
                            "text": raw_text,
                            "confidence": conf_percent,
                            "box": box
                        })
                        lines_text.append(raw_text)
                        confidences.append(conf_percent)
                    except Exception:
                        continue

    full_text = "\n".join(lines_text)
    overall_confidence = int(round(sum(confidences) / len(confidences))) if confidences else 90

    # Run hybrid amount & merchant extractors
    detected_amount = extract_amount(items)
    detected_merchant = extract_merchant(items)

    response_payload = {
        "text": full_text,
        "confidence": overall_confidence,
        "items": items
    }

    if detected_amount is not None:
        response_payload["amount"] = detected_amount

    if detected_merchant is not None:
        response_payload["merchant"] = detected_merchant

    return response_payload
