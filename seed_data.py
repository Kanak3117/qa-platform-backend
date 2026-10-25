import uuid
from sqlalchemy import select
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, SystemRole
from app.models.project import Project, ProjectMember, ProjectRole

def seed():
    db = SessionLocal()
    try:
        # Check if users already exist
        elena = db.scalar(select(User).where(User.email == "elena.admin@dailoqa.io"))
        if not elena:
            elena = User(
                id=uuid.uuid4(),
                name="Elena Rostova",
                email="elena.admin@dailoqa.io",
                password_hash=hash_password("password"),
                system_role=SystemRole.ADMIN,
                active=True
            )
            db.add(elena)

        sarah = db.scalar(select(User).where(User.email == "sarah.qa@dailoqa.io"))
        if not sarah:
            sarah = User(
                id=uuid.uuid4(),
                name="Sarah Connor",
                email="sarah.qa@dailoqa.io",
                password_hash=hash_password("password"),
                system_role=SystemRole.USER,
                active=True
            )
            db.add(sarah)

        alex = db.scalar(select(User).where(User.email == "alex.dev@dailoqa.io"))
        if not alex:
            alex = User(
                id=uuid.uuid4(),
                name="Alex Rivera",
                email="alex.dev@dailoqa.io",
                password_hash=hash_password("password"),
                system_role=SystemRole.USER,
                active=True
            )
            db.add(alex)

        db.flush()

        # Seed Project 1: Checkout and Payment Score
        p1 = db.scalar(select(Project).where(Project.name.in_(["Checkout and Payment Score", "Checkout & Payments Core"])))
        if not p1:
            p1 = Project(
                id=uuid.uuid4(),
                name="Checkout and Payment Score",
                description="Payment gateway integrations, card validation, cart processing and invoicing.",
                active=True
            )
            db.add(p1)
            db.flush()

        # Seed Project 2: Merchant Mobile App
        p2 = db.scalar(select(Project).where(Project.name == "Merchant Mobile App"))
        if not p2:
            p2 = Project(
                id=uuid.uuid4(),
                name="Merchant Mobile App",
                description="React Native iOS/Android app for on-the-go inventory and order dispatch.",
                active=True
            )
            db.add(p2)
            db.flush()

        # Seed project members idempotently
        for prj in [p1, p2]:
            for u, role in [(elena, ProjectRole.QA_ENGINEER), (sarah, ProjectRole.QA_ENGINEER), (alex, ProjectRole.DEVELOPER)]:
                existing_pm = db.scalar(
                    select(ProjectMember).where(ProjectMember.project_id == prj.id, ProjectMember.user_id == u.id)
                )
                if not existing_pm:
                    pm = ProjectMember(
                        id=uuid.uuid4(),
                        project_id=prj.id,
                        user_id=u.id,
                        project_role=role
                    )
                    db.add(pm)

        db.commit()
        print("Successfully seeded demo users, projects, and memberships idempotently!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
