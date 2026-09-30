import chromadb

from app.scoring import model


ACTIVE_STATUS = "ACTIVE"
ARCHIVED_STATUS = "ARCHIVED"
ACTIVE_COURSE_STATUS = "ACTIVE"
ENDED_COURSE_STATUS = "ENDED"


chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(
    name="giao_an_collection",
    metadata={"hnsw:space": "cosine"}
)


def _chunk_metadata(chunk, course_id, status=ACTIVE_STATUS, course_status=ACTIVE_COURSE_STATUS):
    return {
        "source_file": chunk['source_file'],
        "page_number": chunk['page_number'],
        "chunk_index": chunk['chunk_index'],
        "course_id": str(course_id),
        "status": status,
        "course_status": course_status,
    }


def add_document_to_db(chunks, course_id):
    ids = [c['chunk_id'] for c in chunks]
    documents = [c['text'] for c in chunks]
    metadatas = [_chunk_metadata(c, course_id) for c in chunks]

    embeddings = model.encode(documents).tolist()

    collection.upsert(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return {
        "status": "success",
        "chunks_added": len(chunks),
        "total_in_collection": collection.count()
    }


def archive_course_chunks(course_id, course_status=ENDED_COURSE_STATUS, status=ARCHIVED_STATUS):
    chunk_records = collection.get(
        where={"course_id": str(course_id)},
        include=["metadatas", "ids"]
    )

    ids = chunk_records.get("ids", [])
    metadatas = chunk_records.get("metadatas", [])

    if not ids:
        return {"updated": 0, "course_id": course_id}

    updated_metadatas = []
    for metadata in metadatas:
        current = dict(metadata or {})
        current["status"] = status
        current["course_status"] = course_status
        updated_metadatas.append(current)

    collection.update(ids=ids, metadatas=updated_metadatas)
    return {"updated": len(ids), "course_id": course_id, "status": status, "course_status": course_status}


def retrieve_relevant_chunks(student_answer, course_id, top_k=3):
    query_embedding = model.encode([student_answer]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k,
        where={
            "$and": [
                {"course_id": str(course_id)},
                {"status": ACTIVE_STATUS},
                {"course_status": ACTIVE_COURSE_STATUS},
            ]
        }
    )

    chunks = []
    for i in range(len(results['ids'][0])):
        distance = results['distances'][0][i]
        similarity = 1 - distance
        chunks.append({
            "chunk_id": results['ids'][0][i],
            "text": results['documents'][0][i],
            "similarity": round(similarity, 4),
            "page_number": results['metadatas'][0][i]['page_number'],
            "source_file": results['metadatas'][0][i]['source_file']
        })

    return chunks