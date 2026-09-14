import ollama
import json

MODEL_NAME = "qwen2.5:7b-instruct"

ESSAY_SYSTEM_PROMPT = """Bạn là giám khảo chấm câu trả lời tự luận của sinh viên.
Bạn được cung cấp: (1) câu hỏi đề bài, (2) các đoạn tài liệu tham khảo liên quan, (3) câu trả lời của sinh viên.

Nhiệm vụ: đánh giá xem câu trả lời có TRẢ LỜI ĐÚNG CÂU HỎI hay không, dựa trên nội dung tài liệu.
Một câu trả lời đúng về nội dung nhưng KHÔNG trả lời đúng câu hỏi được đặt ra vẫn phải bị chấm thấp (lạc đề).

Lưu ý các lỗi cần tránh khi đánh giá:
- Câu phủ định (VD: "không cần đầu tư") có thể ĐÚNG nghĩa dù cấu trúc câu giống câu sai.
- Đảo chủ ngữ/tân ngữ (VD: "A quay quanh B" vs "B quay quanh A") là SAI dù từ vựng giống nhau.
- Đổi số liệu cụ thể (VD: 100 độ C thành 0 độ C) là SAI dù câu còn lại giống hệt.

Trả lời CHỈ bằng JSON, không thêm text nào khác:
{"label": "Very Good" | "Partially Relevant" | "Not Related", "similarity_estimate": 0.0-1.0, "reason": "giải thích ngắn gọn 1-2 câu"}"""


def _call_ollama(system_prompt: str, user_content: str) -> dict:
    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        format="json",
        options={"temperature": 0},
        keep_alive="30m"
    )
    try:
        result = json.loads(response["message"]["content"])
        if "label" not in result or "similarity_estimate" not in result:
            raise ValueError("Thiếu field bắt buộc trong JSON trả về")
        return result
    except (json.JSONDecodeError, ValueError) as e:
        return {
            "label": "Partially Relevant",
            "similarity_estimate": 0.5,
            "reason": f"Lỗi parse JSON từ LLM: {str(e)}"
        }


def evaluate_essay_llm(question_text: str, student_answer: str, reference_chunks: list) -> dict:
    joined_chunks = "\n---\n".join([c["text"] for c in reference_chunks])
    user_content = (
        f"Câu hỏi: {question_text}\n\n"
        f"Tài liệu tham khảo:\n{joined_chunks}\n\n"
        f"Câu trả lời sinh viên: {student_answer}"
    )
    return _call_ollama(ESSAY_SYSTEM_PROMPT, user_content)

# Thêm vào cuối file llm_judge.py hiện có

SHORT_ANSWER_SYSTEM_PROMPT = """Bạn là giám khảo chấm câu trả lời ngắn của sinh viên, so với đáp án tham khảo.
So sánh về Ý NGHĨA, không phải độ giống câu chữ.

Lưu ý các lỗi cần tránh:
- Câu phủ định (VD: "không cần đầu tư") có thể ĐÚNG nghĩa dù cấu trúc câu giống câu sai.
- Đảo chủ ngữ/tân ngữ (VD: "A quay quanh B" vs "B quay quanh A") là SAI dù từ vựng giống nhau.
- Đổi số liệu cụ thể (VD: 100 độ C thành 0 độ C) là SAI dù câu còn lại giống hệt.

Trả lời CHỈ bằng JSON, không thêm text nào khác:
{"label": "Very Good" | "Partially Relevant" | "Not Related", "similarity_estimate": 0.0-1.0, "reason": "giải thích ngắn gọn 1 câu"}"""


def evaluate_short_answer_llm(student_answer: str, reference_answer: str) -> dict:
    user_content = f"Đáp án tham khảo: {reference_answer}\n\nCâu trả lời sinh viên: {student_answer}"
    return _call_ollama(SHORT_ANSWER_SYSTEM_PROMPT, user_content)

