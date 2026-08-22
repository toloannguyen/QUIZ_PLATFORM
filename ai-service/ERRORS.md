# Mã lỗi AI Service

Mọi lỗi trả về theo cấu trúc:
```json
{
    "error": true,
    "field": "tên_trường_lỗi_hoặc_null",
    "message": "Mô tả lỗi"
}
```

## POST /evaluate

| Status | Nguyên nhân |
|---|---|
| 422 | `student_answer` rỗng hoặc chỉ khoảng trắng |
| 422 | `student_answer` vượt quá 5000 ký tự |
| 422 | `mode` không phải 1 trong 3 giá trị hợp lệ (`short_answer`, `essay`, `auto`) |
| 422 | `mode="short_answer"` nhưng thiếu `reference_answer` |

## POST /upload-reference

| Status | Nguyên nhân |
|---|---|
| 400 | File không có đuôi `.pdf` |
| 400 | File vượt quá 20MB |
| 400 | File không phải PDF hợp lệ hoặc bị hỏng |
| 400 | PDF không trích xuất được nội dung văn bản (có thể là bản scan/ảnh) |