#!/usr/bin/env python3
"""
OpenAI Vision-powered Video Condition Re-labeling
Analyzes one representative frame per video to accurately determine weather and time conditions
"""

import asyncio
import sys
import os
import base64
import json
from pathlib import Path
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.core.config import settings
from app.models.video import Video, Frame
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Try to import OpenAI
try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False
    logger.error("OpenAI library not found. Install with: pip install openai")

class VideoConditionAnalyzer:
    """Analyze video weather and time conditions using OpenAI Vision API"""
    
    def __init__(self):
        self.client = None
        self.results = {}
        
    async def initialize(self):
        """Initialize OpenAI client"""
        if not HAS_OPENAI:
            raise ValueError("OpenAI library not installed")
            
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not found in settings")
            
        self.client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        logger.info("OpenAI client initialized successfully")
    
    def encode_image_to_base64(self, image_path: str) -> str:
        """Convert image file to base64 for OpenAI API"""
        try:
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            raise Exception(f"Failed to encode image {image_path}: {str(e)}")
    
    async def analyze_frame_conditions(self, frame_path: str) -> Dict:
        """Analyze a single frame to determine weather and time conditions"""
        
        if not self.client:
            await self.initialize()
        
        try:
            # Encode image to base64
            base64_image = self.encode_image_to_base64(frame_path)
            
            # Enhanced prompt for accurate condition detection
            analysis_prompt = """
            Analyze this driving scene image and determine the weather and time conditions.
            
            WEATHER - Choose exactly one:
            - sunny: Clear sky with bright sunlight visible, shadows present
            - cloudy: Overcast sky with gray clouds, no direct sunlight
            - rainy: Wet road surfaces, rain drops, water reflections visible
            - foggy: Reduced visibility, misty/hazy conditions
            - snowy: Snow visible on ground or falling
            
            TIME OF DAY - Choose exactly one:
            - day: Natural daylight, blue or light sky visible
            - dusk: Golden hour lighting, sunset colors (orange/pink/purple sky)
            - dawn: Early morning soft light, sunrise conditions
            - night: Dark sky, artificial street lights on, headlights visible
            
            Return your analysis as JSON with these exact fields:
            {
                "weather": "sunny|cloudy|rainy|foggy|snowy",
                "time_of_day": "day|dusk|dawn|night", 
                "weather_confidence": 0.0-1.0,
                "time_confidence": 0.0-1.0,
                "reasoning": "Brief explanation of visual cues observed"
            }
            
            Focus on clear visual indicators like lighting, sky color, road surface, and shadow presence.
            """
            
            # Call OpenAI Vision API
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": analysis_prompt},
                        {
                            "type": "image_url", 
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ]
                }],
                max_tokens=300,
                temperature=0.1  # Low temperature for consistent results
            )
            
            # Parse JSON response
            result_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response (handle potential markdown formatting)
            if "```json" in result_text:
                json_start = result_text.find("```json") + 7
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()
            elif "```" in result_text:
                json_start = result_text.find("```") + 3
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()
            
            # Parse JSON
            try:
                analysis_result = json.loads(result_text)
            except json.JSONDecodeError:
                # Fallback: try to extract from text
                logger.warning(f"Failed to parse JSON, attempting text extraction: {result_text}")
                analysis_result = self._extract_from_text(result_text)
            
            # Validate required fields
            required_fields = ["weather", "time_of_day", "weather_confidence", "time_confidence"]
            for field in required_fields:
                if field not in analysis_result:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate enum values
            valid_weather = ["sunny", "cloudy", "rainy", "foggy", "snowy"]
            valid_time = ["day", "dusk", "dawn", "night"]
            
            if analysis_result["weather"] not in valid_weather:
                logger.warning(f"Invalid weather value: {analysis_result['weather']}, defaulting to cloudy")
                analysis_result["weather"] = "cloudy"
                
            if analysis_result["time_of_day"] not in valid_time:
                logger.warning(f"Invalid time value: {analysis_result['time_of_day']}, defaulting to day")
                analysis_result["time_of_day"] = "day"
            
            logger.info(f"Analysis complete: {analysis_result['weather']}, {analysis_result['time_of_day']} "
                       f"(conf: {analysis_result['weather_confidence']:.2f}, {analysis_result['time_confidence']:.2f})")
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Failed to analyze frame {frame_path}: {str(e)}")
            raise
    
    def _extract_from_text(self, text: str) -> Dict:
        """Fallback method to extract conditions from text if JSON parsing fails"""
        result = {
            "weather": "cloudy",
            "time_of_day": "day", 
            "weather_confidence": 0.5,
            "time_confidence": 0.5,
            "reasoning": "Extracted from text fallback"
        }
        
        text_lower = text.lower()
        
        # Extract weather
        if "sunny" in text_lower:
            result["weather"] = "sunny"
        elif "rainy" in text_lower or "rain" in text_lower:
            result["weather"] = "rainy"
        elif "foggy" in text_lower or "fog" in text_lower:
            result["weather"] = "foggy"
        elif "snowy" in text_lower or "snow" in text_lower:
            result["weather"] = "snowy"
        elif "cloudy" in text_lower or "overcast" in text_lower:
            result["weather"] = "cloudy"
        
        # Extract time
        if "night" in text_lower:
            result["time_of_day"] = "night"
        elif "dusk" in text_lower or "sunset" in text_lower:
            result["time_of_day"] = "dusk"
        elif "dawn" in text_lower or "sunrise" in text_lower:
            result["time_of_day"] = "dawn"
        elif "day" in text_lower:
            result["time_of_day"] = "day"
            
        return result

    def get_representative_frame_path(self, video: Video, frames_dir: str) -> Optional[str]:
        """Get path to representative frame for a video"""
        
        # Get total frame count for this video  
        engine = create_engine(settings.database_url)
        with Session(bind=engine) as db:
            frame_count = db.query(Frame).filter(Frame.video_id == video.id).count()
        
        if frame_count == 0:
            logger.warning(f"No frames found for video {video.id}")
            return None
        
        # Select middle frame
        middle_frame_num = frame_count // 2
        
        # Try different frame naming patterns
        video_base = video.filename.replace('.MP4', '').replace('.mp4', '')
        
        possible_patterns = [
            f"driving_camera_{video_base.lower()}_frame_{middle_frame_num:03d}.jpg",
            f"static_camera_{video_base.lower()}_frame_{middle_frame_num:03d}.jpg", 
            f"{video_base.lower()}_frame_{middle_frame_num:03d}.jpg",
            f"frame_{video.id}_{middle_frame_num:03d}.jpg"
        ]
        
        for pattern in possible_patterns:
            frame_path = os.path.join(frames_dir, pattern)
            if os.path.exists(frame_path):
                logger.info(f"Found representative frame: {pattern}")
                return frame_path
        
        # Fallback: find any frame from this video
        for filename in os.listdir(frames_dir):
            if video_base.lower() in filename.lower() and filename.endswith('.jpg'):
                frame_path = os.path.join(frames_dir, filename)
                logger.info(f"Using fallback frame: {filename}")
                return frame_path
        
        logger.error(f"No frame found for video {video.id} ({video.filename})")
        return None

async def main():
    """Main execution function"""
    
    logger.info("🚀 Starting video condition re-labeling with OpenAI Vision...")
    
    # Initialize analyzer
    analyzer = VideoConditionAnalyzer()
    await analyzer.initialize()
    
    # Connect to database
    engine = create_engine(settings.database_url)
    
    with Session(bind=engine) as db:
        # Get all videos
        videos = db.query(Video).order_by(Video.id).all()
        logger.info(f"Found {len(videos)} videos to analyze")
        
        frames_dir = "/app/frames"  # Adjust path as needed
        if not os.path.exists(frames_dir):
            frames_dir = "./frames"
        
        results = {}
        comparison_data = []
        
        for i, video in enumerate(videos, 1):
            logger.info(f"\n[{i}/{len(videos)}] Processing video {video.id}: {video.filename}")
            
            # Get current labels
            current_weather = video.weather or "unknown"
            current_time = video.time_of_day or "unknown"
            
            # Find representative frame
            frame_path = analyzer.get_representative_frame_path(video, frames_dir)
            if not frame_path:
                logger.error(f"Skipping video {video.id} - no frame found")
                continue
            
            try:
                # Analyze frame with OpenAI
                analysis = await analyzer.analyze_frame_conditions(frame_path)
                
                # Store results
                results[video.id] = {
                    "filename": video.filename,
                    "current_weather": current_weather,
                    "current_time": current_time, 
                    "new_weather": analysis["weather"],
                    "new_time": analysis["time_of_day"],
                    "weather_confidence": analysis["weather_confidence"],
                    "time_confidence": analysis["time_confidence"],
                    "reasoning": analysis.get("reasoning", ""),
                    "frame_analyzed": os.path.basename(frame_path)
                }
                
                # Track changes
                weather_changed = current_weather != analysis["weather"]
                time_changed = current_time != analysis["time_of_day"]
                
                if weather_changed or time_changed:
                    comparison_data.append({
                        "video_id": video.id,
                        "filename": video.filename,
                        "weather_change": f"{current_weather} → {analysis['weather']}" if weather_changed else "no change",
                        "time_change": f"{current_time} → {analysis['time_of_day']}" if time_changed else "no change",
                        "confidence": f"W:{analysis['weather_confidence']:.2f}, T:{analysis['time_confidence']:.2f}"
                    })
                
                logger.info(f"✅ Current: {current_weather}, {current_time}")
                logger.info(f"✅ OpenAI:  {analysis['weather']}, {analysis['time_of_day']} "
                           f"(conf: {analysis['weather_confidence']:.2f}, {analysis['time_confidence']:.2f})")
                if weather_changed or time_changed:
                    logger.info("🔄 CHANGE DETECTED")
                
            except Exception as e:
                logger.error(f"❌ Failed to analyze video {video.id}: {str(e)}")
                continue
        
        # Generate summary report
        logger.info("\n" + "="*80)
        logger.info("📊 VIDEO CONDITION RE-LABELING RESULTS")
        logger.info("="*80)
        
        logger.info(f"\nProcessed: {len(results)}/{len(videos)} videos")
        logger.info(f"Changes detected: {len(comparison_data)} videos")
        
        if comparison_data:
            logger.info("\n🔄 VIDEOS WITH LABEL CHANGES:")
            for change in comparison_data:
                logger.info(f"  {change['filename']}:")
                logger.info(f"    Weather: {change['weather_change']}")
                logger.info(f"    Time: {change['time_change']}")
                logger.info(f"    Confidence: {change['confidence']}")
        
        # Ask for confirmation before updating database
        if comparison_data:
            logger.info("\n❓ Apply these changes to the database? (y/n)")
            # For script execution, auto-apply high-confidence changes
            
            high_confidence_changes = [
                change for change in comparison_data 
                if all(conf >= 0.8 for conf in [
                    results[change['video_id']]['weather_confidence'],
                    results[change['video_id']]['time_confidence']
                ])
            ]
            
            logger.info(f"\n✅ Auto-applying {len(high_confidence_changes)} high-confidence changes (confidence >= 0.8)")
            
            for change in high_confidence_changes:
                video_id = change['video_id']
                video = db.query(Video).filter(Video.id == video_id).first()
                
                if video:
                    new_data = results[video_id]
                    video.weather = new_data['new_weather']
                    video.time_of_day = new_data['new_time']
                    
                    logger.info(f"Updated video {video_id}: {new_data['new_weather']}, {new_data['new_time']}")
            
            db.commit()
            logger.info(f"✅ Database updated with {len(high_confidence_changes)} changes")
        
        else:
            logger.info("\n✅ All current labels appear to be correct!")
        
        # Save detailed results to file
        results_file = "video_condition_analysis_results.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"\n📄 Detailed results saved to: {results_file}")
        logger.info("🎉 Video condition re-labeling complete!")

if __name__ == "__main__":
    asyncio.run(main())