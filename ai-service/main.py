from fastapi import FastAPI

app = FastAPI(title="AI Scoring Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "AI service is running"}