"""Celery task for synchronizing prohibited clauses from external sources."""
import asyncio
import logging
from datetime import datetime
from typing import Dict, List

from celery_app import celery_app
from database.connection import get_celery_db_context
from models.clause import ProhibitedClause
from sqlalchemy import select

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.sync.sync_prohibited_clauses")
def sync_prohibited_clauses(self) -> Dict[str, int]:
    """
    Synchronize prohibited clauses from external source.
    
    This task runs periodically (configured in Celery Beat) to fetch
    the latest prohibited clauses from external registries (e.g., UOKiK).
    
    Returns:
        Dict with sync statistics (added, updated, skipped)
    """
    # Run async implementation
    return asyncio.run(async_sync_prohibited_clauses())


async def async_sync_prohibited_clauses() -> Dict[str, int]:
    """
    Actual async implementation of clause synchronization.
    
    Returns:
        Dict with keys: added, updated, skipped, errors
    """
    logger.info("Starting prohibited clauses synchronization")
    
    stats = {
        "added": 0,
        "updated": 0,
        "skipped": 0,
        "errors": 0,
    }
    
    try:
        # Fetch external data
        external_clauses = await fetch_external_clauses()
        
        async with get_celery_db_context() as db:
            for clause_data in external_clauses:
                try:
                    # Check if clause already exists (by external_id or content hash)
                    external_id = clause_data.get("external_id")
                    if external_id:
                        result = await db.execute(
                            select(ProhibitedClause).where(
                                ProhibitedClause.notes.contains(f"external_id:{external_id}")
                            )
                        )
                        existing_clause = result.scalar_one_or_none()
                    else:
                        existing_clause = None
                    
                    if existing_clause:
                        # Check if update is needed
                        if existing_clause.clause_text != clause_data["text"]:
                            existing_clause.clause_text = clause_data["text"]
                            existing_clause.normalized_text = clause_data["text"].lower().strip()
                            existing_clause.updated_at = datetime.utcnow()
                            stats["updated"] += 1
                        else:
                            stats["skipped"] += 1
                    else:
                        # Add new clause
                        # Note: This requires a valid category_id. For now, we'll skip if no category
                        # In production, you'd need to map external categories or use a default
                        logger.warning(f"Skipping clause without category mapping: {clause_data.get('text', '')[:50]}")
                        stats["skipped"] += 1
                        
                        # Example of how to add (commented out until category mapping is implemented):
                        # new_clause = ProhibitedClause(
                        #     clause_text=clause_data["text"],
                        #     normalized_text=clause_data["text"].lower().strip(),
                        #     category_id=...,  # Need to map category
                        #     risk_level=clause_data.get("severity", "medium"),
                        #     source="imported",
                        #     notes=f"external_id:{clause_data.get('external_id')}",
                        #     is_active=True,
                        # )
                        # db.add(new_clause)
                        # stats["added"] += 1
                        
                except Exception as e:
                    logger.error(f"Error processing clause: {e}")
                    stats["errors"] += 1
                    continue
            
            # Commit only if there were changes
            if stats["added"] > 0 or stats["updated"] > 0:
                await db.commit()
        
        logger.info(f"Sync completed: {stats}")
        return stats
        
    except Exception as e:
        logger.error(f"Fatal error during sync: {e}")
        stats["errors"] += 1
        return stats


async def fetch_external_clauses() -> List[Dict]:
    """
    Fetch prohibited clauses from external source.
    
    TODO: Implement actual API call or web scraping to UOKiK or other registry.
    For now, returns empty list (stub implementation).
    
    Returns:
        List of clause dictionaries with keys: text, category, severity, external_id, source
    """
    # STUB: Replace with actual implementation
    # Example:
    # - Call UOKiK API
    # - Scrape official registry website
    # - Read from government data feed
    
    logger.info("Fetching external clauses (STUB - no actual source configured)")
    
    # Return empty list for now
    return []
    
    # Future implementation example:
    # async with aiohttp.ClientSession() as session:
    #     async with session.get(EXTERNAL_API_URL) as response:
    #         data = await response.json()
    #         return parse_external_data(data)
