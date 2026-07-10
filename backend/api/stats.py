"""Public homepage statistics: clause and court-ruling counts."""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db

router = APIRouter(prefix="/api/v1/stats", tags=["stats"])


@router.get("")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Live homepage counts.

    clauses = liczba klauzul w bazie (COUNT(*))
    rulings = liczba orzeczen sadowych (COUNT(DISTINCT sygnatura))
    """
    result = await db.execute(
        text(
            "SELECT COUNT(*) AS clauses, "
            "COUNT(DISTINCT sygnatura) AS rulings "
            "FROM klauzule_niedozwolone"
        )
    )
    row = result.first()
    return {"clauses": int(row.clauses or 0), "rulings": int(row.rulings or 0)}
