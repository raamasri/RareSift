from fastapi import APIRouter

from app.api.v1 import videos, search, export

api_router = APIRouter()

api_router.include_router(videos.router, prefix="/videos", tags=["videos"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(export.router, prefix="/export", tags=["export"]) 