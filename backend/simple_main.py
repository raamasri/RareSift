from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import time

from simple_database import get_db
from simple_models import Video, Frame, Embedding
from simple_search import search_frames_by_text

app = FastAPI(
    title="RareSift Demo API",
    description="Simplified AI-powered AV scenario search",
    version="1.0.0"
)

# CORS - allow all for demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount frame images
try:
    if os.path.exists("/app/frames"):
        app.mount("/frames", StaticFiles(directory="/app/frames"), name="frames")
    elif os.path.exists("./frames"):
        app.mount("/frames", StaticFiles(directory="./frames"), name="frames")
except Exception as e:
    print(f"Warning: Could not mount frames directory: {e}")

# Response models
class VideoResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    duration: float
    fps: float
    width: int
    height: int
    weather: Optional[str]
    time_of_day: Optional[str]
    is_processed: bool

class SearchRequest(BaseModel):
    query: str
    limit: int = 10
    similarity_threshold: float = 0.3

class SearchResult(BaseModel):
    frame_id: int
    video_id: int
    timestamp: float
    similarity: float
    frame_path: str
    video_filename: str

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total_found: int
    search_time_ms: int

@app.get("/health")
async def health_check():
    """Simple health check"""
    return {"status": "healthy", "message": "RareSift Demo API"}

@app.get("/videos", response_model=List[VideoResponse])
async def list_videos():
    """List all 22 demo videos"""
    try:
        db = next(get_db())
        videos = db.query(Video).all()
        return [VideoResponse(
            id=video.id,
            filename=video.filename,
            original_filename=video.original_filename,
            duration=video.duration,
            fps=video.fps,
            width=video.width,
            height=video.height,
            weather=video.weather,
            time_of_day=video.time_of_day,
            is_processed=video.is_processed
        ) for video in videos]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get videos: {str(e)}")

@app.post("/search", response_model=SearchResponse)
async def search_text(request: SearchRequest):
    """Search frames by text query"""
    try:
        start_time = time.time()
        
        # Search using simplified search function
        results = await search_frames_by_text(
            query=request.query,
            limit=request.limit,
            similarity_threshold=request.similarity_threshold
        )
        
        search_time = int((time.time() - start_time) * 1000)
        
        return SearchResponse(
            results=[SearchResult(
                frame_id=r['frame_id'],
                video_id=r['video_id'],
                timestamp=r['timestamp'],
                similarity=r['similarity'],
                frame_path=r['frame_path'],
                video_filename=r['video_filename']
            ) for r in results],
            total_found=len(results),
            search_time_ms=search_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/api/v1/stats/dashboard")
async def get_dashboard_stats():
    """Get hardcoded dashboard statistics for our 22 video demo"""
    return {
        "totalVideos": 22,
        "totalFrames": 4959,
        "totalSearches": 847,
        "processingJobs": 0,
        "avgProcessingTime": "1.2s",
        "storageUsed": "2.4 GB"
    }

@app.get("/api/v1/stats/activity")
async def get_activity_stats():
    """Get hardcoded recent activity for demo"""
    activities = [
        {
            "id": 1,
            "type": "search",
            "description": "Search for 'bicycle' returned 3 results",
            "time": "2 minutes ago",
            "status": "completed"
        },
        {
            "id": 2,
            "type": "search", 
            "description": "Search for 'traffic light' returned 7 results",
            "time": "8 minutes ago",
            "status": "completed"
        },
        {
            "id": 3,
            "type": "upload",
            "description": "Video GH010001.MP4 processed successfully",
            "time": "1 hour ago",
            "status": "completed"
        },
        {
            "id": 4,
            "type": "search",
            "description": "Search for 'intersection' returned 12 results", 
            "time": "2 hours ago",
            "status": "completed"
        }
    ]
    
    return {"activities": activities}

@app.get("/api/v1/videos/{video_id}/stream")
async def stream_video(video_id: int):
    """Placeholder endpoint for video streaming - returns 404 to fallback to public files"""
    raise HTTPException(status_code=404, detail="Video streaming not available in demo mode")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)