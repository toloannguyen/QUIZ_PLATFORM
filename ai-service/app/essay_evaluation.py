from app.text_processing import is_empty_answer
from app.scoring import classify_by_threshold, THRESHOLD_VERY_GOOD, THRESHOLD_PARTIAL
from app.scoring import compute_semantic_similarity
from app.vector_store import retrieve_relevant_chunks
from app.llm_judge import evaluate_essay_llm


def evaluate_essay_answer(question_text, student_answer, course_id, top_k=3,
                           method="llm",
                           threshold_very_good=THRESHOLD_VERY_GOOD,
                           threshold_partial=THRESHOLD_PARTIAL,
                           min_relevance_threshold=0.30):

    if is_empty_answer(student_answer):
        return {
            "label": "Not Related",
            "similarity_score": 0.0,
            "conflict_detected": False,
            "reason": "Câu trả lời trống",
            "reference_chunks": []
        }

    # Retrieval dựa trên CÂU HỎI, không phải câu trả lời học sinh
    chunks = retrieve_relevant_chunks(question_text, course_id, top_k)

    if not chunks or chunks[0]['similarity'] < min_relevance_threshold:
        return {
            "label": "Not Related",
            "similarity_score": 0.0,
            "conflict_detected": False,
            "reason": "Không tìm thấy nội dung tài liệu liên quan tới câu hỏi này",
            "reference_chunks": chunks
        }

    best_chunk = chunks[0]

    if method == "llm":
        llm_result = evaluate_essay_llm(question_text, student_answer, chunks)
        label = llm_result["label"]
        similarity_score = round(float(llm_result["similarity_estimate"]), 4)
        reason = llm_result["reason"]
        conflict_detected = None
    else:  # method == "embedding" — pipeline cũ, giữ lại để benchmark Ngày 13
        answer_similarity = compute_semantic_similarity(best_chunk['text'], student_answer)
        label = classify_by_threshold(answer_similarity, threshold_very_good, threshold_partial)
        similarity_score = round(float(answer_similarity), 4)
        reason = "Lớp kiểm tra phủ định không áp dụng cho tài liệu dài (độ tin cậy thấp)"
        conflict_detected = None

    return {
        "label": label,
        "similarity_score": similarity_score,
        "conflict_detected": conflict_detected,
        "reason": reason,
        "reference_chunks": chunks,
        "primary_source": {
            "page_number": best_chunk['page_number'],
            "source_file": best_chunk['source_file']
        }
    }