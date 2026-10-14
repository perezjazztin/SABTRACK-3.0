"""Areas domain module."""
from app.modules.areas.models import Area
from app.modules.areas.schemas import AreaBase, AreaCreate, AreaRead

__all__ = ["Area", "AreaBase", "AreaCreate", "AreaRead"]
