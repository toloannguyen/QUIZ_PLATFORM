import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.schemas import EvaluateRequest, EvaluateResponse, UploadReferenceResponse
from app.scoring import classify_answer
from app.essay_evaluation import evaluate_essay_answer
from app.pdf_processing import process_pdf_to_chunks
from app.vector_store import add_document_to_db, collection


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"AI Service khởi động. Collection hiện có {collection.count()} chunks.")
    yield
    print("AI Service đang tắt.")


app = FastAPI(title="AI Scoring Service", lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    first_error = exc.errors()[0]
    field = first_error['loc'][-1] if first_error['loc'] else "unknown"
    message = first_error['msg'].replace("Value error, ", "")

    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "field": field,
            "message": message
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "field": None,
            "message": exc.detail
        }
    )


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "AI service is running"}




MAX_FILE_SIZE_MB = 20
MIN_TEXT_LENGTH = 50


@app.post("/upload-reference", response_model=UploadReferenceResponse)
async def upload_reference(file: UploadFile = File(...), course_id: int = 0):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file PDF")

    contents = await file.read()
    file_size_mb = len(contents) / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File quá lớn ({file_size_mb:.1f}MB). Giới hạn tối đa {MAX_FILE_SIZE_MB}MB"
        )

    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(contents)

    try:
        try:
            chunks = process_pdf_to_chunks(temp_path, source_filename=file.filename)
        except Exception:
            raise HTTPException(status_code=400, detail="File không phải PDF hợp lệ hoặc bị hỏng")

        total_text_length = sum(c['char_count'] for c in chunks)
        if total_text_length < MIN_TEXT_LENGTH:
            raise HTTPException(
                status_code=400,
                detail="Không trích xuất được nội dung văn bản từ file (có thể là PDF dạng ảnh/scan)"
            )

        result = add_document_to_db(chunks, course_id)
    finally:
        os.remove(temp_path)

    return UploadReferenceResponse(
        status=result["status"],
        filename=file.filename,
        chunks_added=result["chunks_added"],
        total_in_collection=result["total_in_collection"]
    )


@app.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(request: EvaluateRequest):
    if request.mode == "short_answer" or (request.mode == "auto" and request.reference_answer):
        result = classify_answer(request.reference_answer, request.student_answer)
        return EvaluateResponse(**result)

    result = evaluate_essay_answer(request.student_answer, request.course_id)
    return EvaluateResponse(**result)