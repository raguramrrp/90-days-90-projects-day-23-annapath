"""In-app notification dispatch service."""

from sqlalchemy.orm import Session
from backend.app.models.entities import Notification


def create_notification(
    db: Session,
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
) -> Notification:
    """Create and persist an in-app notification."""
    notif = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
