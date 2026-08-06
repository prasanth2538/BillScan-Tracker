import os
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from preprocessor import preprocess_image
from ocr_engine import process_ocr_image, OCREngine

app = FastAPI(
    title="BillScan Tracker PaddleOCR Service",
    description="Production-ready FastAPI + PaddleOCR backend service for bill & receipt OCR extraction",
    version="1.0.0"
)

import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=1)

@app.on_event("startup")
async def startup_event():
    print("Pre-loading PaddleOCR models in background thread on server startup...")
    loop = asyncio.get_event_loop()
    loop.run_in_executor(executor, OCREngine.get_instance)

# Enable CORS for React Web frontend and mobile web apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".bmp", ".tiff", ".jfif"}

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "PaddleOCR API Backend",
        "engine": "PaddleOCR 2.7+ / Python"
    }

@app.post("/ocr")
async def extract_ocr(
    image: UploadFile = File(None),
    file: UploadFile = File(None)
):
    upload_file = image or file
    if not upload_file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image file provided. Upload multipart form-data with parameter 'image' or 'file'."
        )

    filename = upload_file.filename or ""
    ext = os.path.splitext(filename.lower())[1]

    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    try:
        contents = await upload_file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        # Preprocess image (deskew, CLAHE contrast, resize)
        preprocessed_img = preprocess_image(contents)

        # Run PaddleOCR + hybrid spatial amount & merchant extraction
        ocr_result = process_ocr_image(preprocessed_img)

        return JSONResponse(status_code=200, content=ocr_result)

    except HTTPException as he:
        raise he
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        print(f"PaddleOCR Exception: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR processing failed on server: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
