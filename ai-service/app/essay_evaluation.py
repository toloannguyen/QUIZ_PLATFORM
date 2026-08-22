from app.text_processing import is_empty_answer
from app.scoring import classify_by_threshold, THRESHOLD_VERY_GOOD, THRESHOLD_PARTIAL
from app.vector_store import retrieve_relevant_chunks


def evaluate_essay_answer(student_answer, course_id, top_k=3,
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

    chunks = retrieve_relevant_chunks(student_answer, course_id, top_k)

    if not chunks or chunks[0]['similarity'] < min_relevance_threshold:
        return {
            "label": "Not Related",
            "similarity_score": chunks[0]['similarity'] if chunks else 0.0,
            "conflict_detected": False,
            "reason": "Không tìm thấy nội dung đủ liên quan trong tài liệu tham khảo",
            "reference_chunks": chunks
        }

    best_chunk = chunks[0]
    similarity_score = best_chunk['similarity']
    label = classify_by_threshold(similarity_score, threshold_very_good, threshold_partial)

    return {
        "label": label,
        "similarity_score": round(float(similarity_score), 4),
        "conflict_detected": None,
        "reason": "Lớp kiểm tra phủ định không áp dụng cho tài liệu dài (độ tin cậy thấp)",
        "reference_chunks": chunks,
        "primary_source": {
            "page_number": best_chunk['page_number'],
            "source_file": best_chunk['source_file']
        }
    }