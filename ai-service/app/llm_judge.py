import ollama
import json

MODEL_NAME = "qwen2.5:7b-instruct"

ESSAY_SYSTEM_PROMPT = """Bạn là giám khảo chấm tự luận.
Chỉ đánh giá dựa trên câu hỏi, tài liệu tham khảo và câu trả lời sinh viên.
Không suy luận quá mức; chọn tối đa 3 chunk thật sự liên quan.

Yêu cầu:
- `cited_chunk_ids` phải thuộc `retrieved_chunk_ids` đã gửi xuống.
- Nếu không chắc, để `cited_chunk_ids` là [] và chấm thấp hơn.
- Câu trả lời đúng nội dung nhưng lạc đề phải chấm thấp.
- Câu phủ định, đảo ngữ, đổi số liệu là sai.
- `reason` tối đa 1 câu, ngắn gọn.

Trả lời CHỈ bằng JSON:
{"label": "Very Good" | "Partially Relevant" | "Not Related", "similarity_estimate": 0.0-1.0, "reason": "1 câu ngắn", "cited_chunk_ids": ["chunk_id_1"]}"""


def _normalize_cited_chunk_ids(raw_value):
    if raw_value is None:
        return []
    if isinstance(raw_value, str):
        return [raw_value]
    if isinstance(raw_value, list):
        return [str(item) for item in raw_value if item is not None]
    return []


def _call_ollama(system_prompt: str, user_content: str) -> dict:
    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        format="json",
        options={
            "temperature": 0,
            "num_predict": 120,
            "top_p": 0.9
        },
        keep_alive="30m",
        stream=False
    )
    try:
        result = json.loads(response["message"]["content"])
        if "label" not in result or "similarity_estimate" not in result:
            raise ValueError("Thiếu field bắt buộc trong JSON trả về")
        result["cited_chunk_ids"] = _normalize_cited_chunk_ids(result.get("cited_chunk_ids"))
        return result
    except (json.JSONDecodeError, ValueError) as e:
        return {
            "label": "Partially Relevant",
            "similarity_estimate": 0.5,
            "reason": f"Lỗi parse JSON từ LLM: {str(e)}",
            "cited_chunk_ids": []
        }


def evaluate_essay_llm(question_text: str, student_answer: str, reference_chunks: list) -> dict:
    joined_chunks = "\n---\n".join([f"chunk_id={c['chunk_id']}\n{c['text']}" for c in reference_chunks])
    chunk_ids = [c["chunk_id"] for c in reference_chunks]
    user_content = (
        f"retrieved_chunk_ids: {json.dumps(chunk_ids, ensure_ascii=False)}\n\n"
        f"Câu hỏi: {question_text}\n\n"
        f"Tài liệu tham khảo:\n{joined_chunks}\n\n"
        f"Câu trả lời sinh viên: {student_answer}"
    )
    return _call_ollama(ESSAY_SYSTEM_PROMPT, user_content)

# Thêm vào cuối file llm_judge.py hiện có

SHORT_ANSWER_SYSTEM_PROMPT = """Bạn là giám khảo chấm câu ngắn.
Chỉ so sánh về ý nghĩa với đáp án tham khảo, không cần giải thích dài.
Nếu phủ định, đảo ngữ hoặc đổi số liệu thì chấm thấp.
`reason` tối đa 1 câu ngắn.

Trả lời CHỈ bằng JSON:
{"label": "Very Good" | "Partially Relevant" | "Not Related", "similarity_estimate": 0.0-1.0, "reason": "1 câu ngắn"}"""


def evaluate_short_answer_llm(student_answer: str, reference_answer: str) -> dict:
    user_content = f"Đáp án tham khảo: {reference_answer}\n\nCâu trả lời sinh viên: {student_answer}"
    return _call_ollama(SHORT_ANSWER_SYSTEM_PROMPT, user_content)

