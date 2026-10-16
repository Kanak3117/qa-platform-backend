import sys

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.user import SystemRole, User


def main(email: str) -> None:
    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == email.lower()))
        if user is None:
            print("User not found")
            return
        user.system_role = SystemRole.ADMIN
        db.commit()
        print(f"{user.email} is now ADMIN")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m app.make_admin <email>")
    else:
        main(sys.argv[1])