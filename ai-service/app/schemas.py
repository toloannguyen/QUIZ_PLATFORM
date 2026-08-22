from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Literal


class EvaluateRequest(BaseModel):
    student_answer: str = Field(..., min_length=1, max_length=5000, description="Câu trả lời của học sinh")
    reference_answer: Optional[str] = Field(None, max_length=5000, description="Đáp án mẫu (nếu có, dùng cho câu hỏi ngắn)")
    course_id: Optional[int] = Field(None, description="ID khóa học, bắt buộc nếu mode='essay'")
    mode: Literal["short_answer", "essay", "auto"] = Field("auto", description="Chế độ đánh giá")

    @field_validator("student_answer")
    @classmethod
    def student_answer_not_blank(cls, v):
        if v.strip() == "":
            raise ValueError("student_answer không được chỉ chứa khoảng trắng")
        return v

    @field_validator("reference_answer")
    @classmethod
    def reference_answer_not_blank(cls, v):
        if v is not None and v.strip() == "":
            raise ValueError("reference_answer không được chỉ chứa khoảng trắng nếu được cung cấp")
        return v

    @model_validator(mode="after")
    def check_required_fields(self):
        if self.mode == "short_answer" and not self.reference_answer:
            raise ValueError("mode 'short_answer' yêu cầu phải có reference_answer")
        if self.mode == "essay" and not self.course_id:
            raise ValueError("mode 'essay' yêu cầu phải có course_id")
        return self

class ReferenceChunk(BaseModel):
    chunk_id: str
    text: str
    similarity: float
    page_number: int
    source_file: str


class PrimarySource(BaseModel):
    page_number: int
    source_file: str


class EvaluateResponse(BaseModel):
    label: str
    similarity_score: float
    conflict_detected: Optional[bool] = None
    reason: Optional[str] = None
    reference_chunks: Optional[List[ReferenceChunk]] = None
    primary_source: Optional[PrimarySource] = None


class UploadReferenceResponse(BaseModel):
    status: str
    filename: str
    chunks_added: int
    total_in_collection: int