from fastapi import FastAPI

from app.api.routes import auth, members, projects, users

app = FastAPI(title="AI-Powered QA Test & Bug Intelligence Platform")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(members.router)


@app.get("/")
def health():
    return {"status": "ok"}