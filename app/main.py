from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, bugs, members, notifications, projects, users

app = FastAPI(title="DevValidate — Software Quality Management")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(members.router)
app.include_router(bugs.router)
app.include_router(notifications.router)


@app.get("/")
def health():
    return {"status": "ok"}