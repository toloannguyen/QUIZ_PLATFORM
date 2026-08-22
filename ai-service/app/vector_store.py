import chromadb

from app.scoring import model


chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(
    name="giao_an_collection",
    metadata={"hnsw:space": "cosine"}
)


def add_document_to_db(chunks, course_id):
    ids = [c['chunk_id'] for c in chunks]
    documents = [c['text'] for c in chunks]
    metadatas = [
        {
            "source_file": c['source_file'],
            "page_number": c['page_number'],
            "chunk_index": c['chunk_index'],
            "course_id": str(course_id)
        }
        for c in chunks
    ]

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


def retrieve_relevant_chunks(student_answer, course_id, top_k=3):
    query_embedding = model.encode([student_answer]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k,
        where={"course_id": str(course_id)}
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