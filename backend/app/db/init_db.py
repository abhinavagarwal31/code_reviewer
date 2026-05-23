from app.db.database import engine, Base
import app.models.review  # noqa: F401 — registers model with Base
import app.models.comment  # noqa: F401 — registers model with Base


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
