"""
Benchmark so sánh 2 pipeline (Sentence Transformer vs LLM-as-Judge) trên bộ test CNTT.
Đặt file này vào thư mục ai-service/ (ngang hàng main.py), cùng với test_data_it.csv.
Chạy: python benchmark_compare.py > benchmark_results.txt 2>&1
"""
import pandas as pd
import time
from sklearn.metrics import classification_report, confusion_matrix

from app.scoring import classify_answer, classify_answer_llm

df = pd.read_csv("test_data_it.csv")

results_embedding, results_llm, latencies_llm = [], [], []
true_labels = list(df["expected_level"])

print(f"Tổng số câu test: {len(df)}\n")

for i, row in df.iterrows():
    ref = row["reference_text"]
    student = row["student_answer"]

    r1 = classify_answer(ref, student)
    results_embedding.append(r1["label"])

    t0 = time.time()
    r2 = classify_answer_llm(ref, student)
    latency = time.time() - t0
    latencies_llm.append(latency)
    results_llm.append(r2["label"])

    print(f"[{i+1}/{len(df)}] domain={row['domain']} | true={row['expected_level']} | "
          f"embedding={r1['label']} | llm={r2['label']} ({latency:.1f}s)")

print("\n" + "=" * 60)
print("SENTENCE TRANSFORMER — báo cáo tổng")
print("=" * 60)
print(classification_report(true_labels, results_embedding))
print("Confusion matrix:")
print(confusion_matrix(true_labels, results_embedding,
                        labels=["Very Good", "Partially Relevant", "Not Related"]))

print("\n" + "=" * 60)
print("LLM-AS-JUDGE — báo cáo tổng")
print("=" * 60)
print(classification_report(true_labels, results_llm))
print("Confusion matrix:")
print(confusion_matrix(true_labels, results_llm,
                        labels=["Very Good", "Partially Relevant", "Not Related"]))
print(f"\nLatency trung bình LLM: {sum(latencies_llm)/len(latencies_llm):.2f}s "
      f"(min={min(latencies_llm):.2f}s, max={max(latencies_llm):.2f}s)")

# ===== Phân tích riêng theo failure_mode — số liệu quan trọng nhất cho báo cáo =====
print("\n" + "=" * 60)
print("ĐỘ CHÍNH XÁC THEO TỪNG NHÓM LỖI (failure_mode)")
print("=" * 60)

df["pred_embedding"] = results_embedding
df["pred_llm"] = results_llm
df["correct_embedding"] = df["pred_embedding"] == df["expected_level"]
df["correct_llm"] = df["pred_llm"] == df["expected_level"]

summary = df.groupby("failure_mode").agg(
    n=("expected_level", "count"),
    embedding_accuracy=("correct_embedding", "mean"),
    llm_accuracy=("correct_llm", "mean"),
)
print(summary.round(3))

df.to_csv("benchmark_output_detailed.csv", index=False)
print("\nĐã lưu chi tiết từng câu vào benchmark_output_detailed.csv")