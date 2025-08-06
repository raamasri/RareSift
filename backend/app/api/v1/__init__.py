from fastapi import APIRouter

from app.api.v1 import videos, search, export, stats, simple_admin

api_router = APIRouter()

api_router.include_router(videos.router, prefix="/videos", tags=["videos"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(stats.router, prefix="/stats", tags=["stats"])
api_router.include_router(simple_admin.router, prefix="/simple-admin", tags=["simple-admin"]) 