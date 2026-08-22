import os
import pymupdf

from app.text_processing import clean_text


def extract_pages_with_metadata(pdf_path):
    doc = pymupdf.open(pdf_path)
    pages_data = []

    for page_num, page in enumerate(doc):
        raw = page.get_text()
        pages_data.append({
            "page_number": page_num + 1,
            "raw_text": raw,
            "clean_text": clean_text(raw),
            "char_count": len(raw)
        })

    doc.close()
    return pages_data


def chunk_text(text, chunk_size=500, chunk_overlap=50):
    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - chunk_overlap

    return chunks


def create_chunks_with_metadata(pages_data, source_filename, chunk_size=500, chunk_overlap=50):
    all_chunks = []
    chunk_index = 0

    for page in pages_data:
        page_chunks = chunk_text(page['clean_text'], chunk_size, chunk_overlap)

        for c in page_chunks:
            all_chunks.append({
                "chunk_id": f"{source_filename}_chunk_{chunk_index}",
                "source_file": source_filename,
                "page_number": page['page_number'],
                "chunk_index": chunk_index,
                "text": c,
                "char_count": len(c)
            })
            chunk_index += 1

    return all_chunks


def process_pdf_to_chunks(pdf_path, source_filename=None, chunk_size=500, chunk_overlap=50):
    if source_filename is None:
        source_filename = os.path.basename(pdf_path)

    pages_data = extract_pages_with_metadata(pdf_path)
    chunks = create_chunks_with_metadata(pages_data, source_filename, chunk_size, chunk_overlap)

    return chunks