from fastapi import FastAPI

from app.api.routes import auth

app = FastAPI(title="AI-Powered QA Test & Bug Intelligence Platform")

app.include_router(auth.router)


@app.get("/")
def health():
    return {"status": "ok"}