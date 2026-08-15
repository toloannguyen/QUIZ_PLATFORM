from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from app.text_processing import is_empty_answer


# Load model MỘT LẦN DUY NHẤT khi module này được import lần đầu
print("Đang load Sentence Transformer model...")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print("Model đã sẵn sàng.")


THRESHOLD_VERY_GOOD = 0.72
THRESHOLD_PARTIAL = 0.40

NEGATION_WORDS = ["không", "chẳng", "chả"]
NEGATION_EXCEPTION_WORDS = ["không khí", "không gian", "không dây", "chẳng hạn"]

ANTONYM_PAIRS = [
    ("tăng", "giảm"),
    ("có", "không có"),
    ("đúng", "sai"),
    ("nhanh", "chậm"),
    ("nóng", "lạnh"),
    ("cao", "thấp"),
    ("lớn", "nhỏ"),
    ("nhiều", "ít"),
    ("trước", "sau"),
    ("trong", "ngoài"),
]


def compute_semantic_similarity(text1, text2):
    vec1 = model.encode(text1).reshape(1, -1)
    vec2 = model.encode(text2).reshape(1, -1)
    score = cosine_similarity(vec1, vec2)
    return score[0][0]


def classify_by_threshold(similarity_score, threshold_very_good=THRESHOLD_VERY_GOOD, threshold_partial=THRESHOLD_PARTIAL):
    if similarity_score >= threshold_very_good:
        return "Very Good"
    elif similarity_score >= threshold_partial:
        return "Partially Relevant"
    else:
        return "Not Related"


def has_asymmetric_negation(text1, text2):
    def count_negation(text):
        text_copy = text
        for exc in NEGATION_EXCEPTION_WORDS:
            text_copy = text_copy.replace(exc, "")
        words = text_copy.split()
        return any(word in words for word in NEGATION_WORDS)

    text1_has_negation = count_negation(text1)
    text2_has_negation = count_negation(text2)

    return text1_has_negation != text2_has_negation


def has_antonym_conflict(text1, text2):
    words1 = set(text1.split())
    words2 = set(text2.split())

    for word_a, word_b in ANTONYM_PAIRS:
        case1 = (word_a in words1 and word_b in words2) and (word_b not in words1) and (word_a not in words2)
        case2 = (word_b in words1 and word_a in words2) and (word_a not in words1) and (word_b not in words2)
        if case1 or case2:
            return True

    return False


def has_conflict_signal(text1, text2):
    return has_asymmetric_negation(text1, text2) or has_antonym_conflict(text1, text2)


def classify_answer(ref_text, student_text, threshold_very_good=THRESHOLD_VERY_GOOD, threshold_partial=THRESHOLD_PARTIAL):
    if is_empty_answer(student_text):
        return {
            "label": "Not Related",
            "similarity_score": 0.0,
            "conflict_detected": False,
            "reason": "Câu trả lời trống"
        }

    similarity_score = compute_semantic_similarity(ref_text, student_text)
    base_label = classify_by_threshold(similarity_score, threshold_very_good, threshold_partial)
    conflict_detected = has_conflict_signal(ref_text, student_text)

    if conflict_detected and base_label != "Not Related":
        final_label = "Not Related"
        reason = "Phát hiện phủ định/đối nghĩa bất đối xứng, hạ nhãn để an toàn"
    else:
        final_label = base_label
        reason = None

    return {
        "label": final_label,
        "similarity_score": round(float(similarity_score), 4),
        "conflict_detected": conflict_detected,
        "reason": reason
    }