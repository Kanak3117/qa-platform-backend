import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.project import ProjectMember, ProjectRole
from app.models.user import SystemRole, User


def dispatch_role_notifications(
    db: Session,
    project_id: uuid.UUID,
    actor: User,
    message: str,
    target_roles: list[ProjectRole] | None = None,
    specific_user_ids: list[uuid.UUID] | None = None,
) -> list[Notification]:
    """
    Role-based notification router adhering to DevValidate Section 6.A:
    - When Developer performs an important action: notify QA Engineers in project + Admins.
    - When QA Engineer performs an action: notify Developers in project + Admins.
    - When Admin performs an action: notify QA Engineers and Developers in project.
    - Never notify the actor.
    - Deduplicate recipients.
    """
    recipient_ids: set[uuid.UUID] = set()

    # Determine actor's role in the project
    actor_member = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == actor.id,
        )
    )
    actor_project_role = actor_member.project_role if actor_member else None

    # Determine target roles if not explicitly supplied
    if target_roles is None:
        if actor_project_role == ProjectRole.DEVELOPER:
            target_roles = [ProjectRole.QA_ENGINEER]
        elif actor_project_role == ProjectRole.QA_ENGINEER:
            target_roles = [ProjectRole.DEVELOPER]
        elif actor.system_role == SystemRole.ADMIN:
            target_roles = [ProjectRole.QA_ENGINEER, ProjectRole.DEVELOPER]
        else:
            target_roles = [ProjectRole.QA_ENGINEER, ProjectRole.DEVELOPER]

    # Query members matching target roles
    if target_roles:
        members = db.scalars(
            select(ProjectMember.user_id).where(
                ProjectMember.project_id == project_id,
                ProjectMember.project_role.in_(target_roles),
            )
        ).all()
        recipient_ids.update(members)

    # Always notify system administrators (unless actor is the admin)
    admins = db.scalars(
        select(User.id).where(
            User.system_role == SystemRole.ADMIN,
            User.active.is_(True),
        )
    ).all()
    recipient_ids.update(admins)

    # Add any specifically targeted users (e.g. assigned developer, bug reporter)
    if specific_user_ids:
        for uid in specific_user_ids:
            if uid:
                recipient_ids.add(uid)

    # Remove the actor (never self-notify)
    recipient_ids.discard(actor.id)

    created_notifications: list[Notification] = []
    for uid in recipient_ids:
        notif = Notification(user_id=uid, message=message, is_read=False)
        db.add(notif)
        created_notifications.append(notif)

    return created_notifications
