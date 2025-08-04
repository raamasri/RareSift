#!/usr/bin/env python3
"""
Comprehensive OpenAI Embedding Audit
Analyzes all embeddings for duplicates, missing data, and integrity issues
"""

import os
import sys
from pathlib import Path
import json
from typing import List, Dict, Any
from collections import defaultdict

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func, text
from app.core.config import settings
from app.models.video import Video, Frame, Embedding
import logging
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EmbeddingAuditor:
    def __init__(self):
        self.engine = create_engine(settings.database_url)
        self.audit_results = {
            "summary": {},
            "duplicates": [],
            "missing_embeddings": [],
            "orphaned_embeddings": [],
            "data_integrity_issues": [],
            "video_breakdown": {},
            "recommendations": []
        }
    
    def run_comprehensive_audit(self):
        """Run all audit checks"""
        logger.info("🔍 Starting comprehensive embedding audit...")
        
        with Session(bind=self.engine) as db:
            self._basic_statistics(db)
            self._check_duplicates(db)
            self._find_missing_embeddings(db)
            self._check_orphaned_embeddings(db)
            self._validate_data_integrity(db)
            self._analyze_by_video(db)
            self._generate_recommendations()
        
        self._print_report()
        return self.audit_results
    
    def _basic_statistics(self, db: Session):
        """Get basic embedding statistics"""
        logger.info("📊 Gathering basic statistics...")
        
        total_videos = db.query(Video).count()
        total_frames = db.query(Frame).count()
        total_embeddings = db.query(Embedding).count()
        
        # Get frames with embeddings (using subquery to avoid JSON comparison issues)
        frames_with_embeddings = db.query(Frame.id).join(Embedding).distinct().count()
        
        coverage_percent = (frames_with_embeddings / total_frames * 100) if total_frames > 0 else 0
        
        self.audit_results["summary"] = {
            "total_videos": total_videos,
            "total_frames": total_frames,
            "total_embeddings": total_embeddings,
            "frames_with_embeddings": frames_with_embeddings,
            "coverage_percent": round(coverage_percent, 2),
            "missing_embeddings": total_frames - frames_with_embeddings,
            "duplicate_embeddings": total_embeddings - frames_with_embeddings
        }
    
    def _check_duplicates(self, db: Session):
        """Find duplicate embeddings"""
        logger.info("🔍 Checking for duplicate embeddings...")
        
        # Find frames with multiple embeddings
        duplicates = db.query(
            Embedding.frame_id,
            func.count(Embedding.id).label('count'),
            func.array_agg(Embedding.id).label('embedding_ids')
        ).group_by(Embedding.frame_id).having(func.count(Embedding.id) > 1).all()
        
        for frame_id, count, embedding_ids in duplicates:
            # Get frame details
            frame = db.query(Frame).filter(Frame.id == frame_id).first()
            if frame:
                self.audit_results["duplicates"].append({
                    "frame_id": frame_id,
                    "video_id": frame.video_id,
                    "frame_number": frame.frame_number,
                    "duplicate_count": count,
                    "embedding_ids": embedding_ids
                })
    
    def _find_missing_embeddings(self, db: Session):
        """Find frames without embeddings"""
        logger.info("🔍 Finding frames without embeddings...")
        
        # Get frames that don't have embeddings
        missing_frames = db.query(Frame).outerjoin(Embedding).filter(
            Embedding.frame_id.is_(None)
        ).all()
        
        for frame in missing_frames:
            video = db.query(Video).filter(Video.id == frame.video_id).first()
            self.audit_results["missing_embeddings"].append({
                "frame_id": frame.id,
                "video_id": frame.video_id,
                "video_filename": video.filename if video else "Unknown",
                "frame_number": frame.frame_number,
                "timestamp": frame.timestamp,
                "file_path": frame.frame_path
            })
    
    def _check_orphaned_embeddings(self, db: Session):
        """Find embeddings without corresponding frames"""
        logger.info("🔍 Checking for orphaned embeddings...")
        
        orphaned = db.query(Embedding).outerjoin(Frame).filter(Frame.id.is_(None)).all()
        
        for embedding in orphaned:
            self.audit_results["orphaned_embeddings"].append({
                "embedding_id": embedding.id,
                "frame_id": embedding.frame_id,
                "created_at": embedding.created_at.isoformat() if embedding.created_at else None
            })
    
    def _validate_data_integrity(self, db: Session):
        """Check embedding data integrity"""
        logger.info("🔍 Validating embedding data integrity...")
        
        # Check for embeddings with null or invalid vectors
        embeddings = db.query(Embedding).limit(100).all()  # Sample check
        
        for embedding in embeddings:
            issues = []
            
            # Check if embedding vector exists
            if embedding.embedding is None:
                issues.append("null_vector")
            else:
                try:
                    # pgvector returns numpy array or list
                    vector = embedding.embedding
                    if hasattr(vector, 'tolist'):
                        vector = vector.tolist()
                    elif isinstance(vector, str):
                        vector = json.loads(vector)
                    elif not isinstance(vector, (list, tuple)):
                        vector = list(vector)
                    
                    # Check vector dimensions (OpenAI CLIP should be 1536 dimensions)
                    if len(vector) != 1536:
                        issues.append(f"wrong_dimension_{len(vector)}")
                    
                    # Check for NaN or infinite values
                    vector_array = np.array(vector)
                    if np.any(np.isnan(vector_array)):
                        issues.append("contains_nan")
                    if np.any(np.isinf(vector_array)):
                        issues.append("contains_inf")
                    
                except (json.JSONDecodeError, TypeError, ValueError) as e:
                    issues.append(f"parse_error_{str(e)[:50]}")
            
            if issues:
                frame = db.query(Frame).filter(Frame.id == embedding.frame_id).first()
                self.audit_results["data_integrity_issues"].append({
                    "embedding_id": embedding.id,
                    "frame_id": embedding.frame_id,
                    "video_id": frame.video_id if frame else None,
                    "issues": issues
                })
    
    def _analyze_by_video(self, db: Session):
        """Analyze embedding coverage by video"""
        logger.info("🔍 Analyzing embedding coverage by video...")
        
        videos = db.query(Video).all()
        
        for video in videos:
            frames = db.query(Frame).filter(Frame.video_id == video.id).all()
            frames_with_embeddings = db.query(Frame.id).join(Embedding).filter(
                Frame.video_id == video.id
            ).distinct().count()
            
            total_frame_count = len(frames)
            coverage = (frames_with_embeddings / total_frame_count * 100) if total_frame_count > 0 else 0
            
            self.audit_results["video_breakdown"][video.id] = {
                "filename": video.filename,
                "total_frames": total_frame_count,
                "frames_with_embeddings": frames_with_embeddings,
                "coverage_percent": round(coverage, 2),
                "missing_count": total_frame_count - frames_with_embeddings,
                "is_processed": video.is_processed
            }
    
    def _generate_recommendations(self):
        """Generate recommendations based on audit findings"""
        recommendations = []
        
        summary = self.audit_results["summary"]
        
        if summary["duplicate_embeddings"] > 0:
            recommendations.append(f"Remove {summary['duplicate_embeddings']} duplicate embeddings")
        
        if summary["missing_embeddings"] > 0:
            recommendations.append(f"Generate embeddings for {summary['missing_embeddings']} missing frames")
        
        if len(self.audit_results["orphaned_embeddings"]) > 0:
            recommendations.append(f"Clean up {len(self.audit_results['orphaned_embeddings'])} orphaned embeddings")
        
        if len(self.audit_results["data_integrity_issues"]) > 0:
            recommendations.append(f"Fix {len(self.audit_results['data_integrity_issues'])} data integrity issues")
        
        if summary["coverage_percent"] < 100:
            recommendations.append("Run embedding generation to achieve 100% coverage")
        
        self.audit_results["recommendations"] = recommendations
    
    def _print_report(self):
        """Print comprehensive audit report"""
        print("\n" + "="*80)
        print("🔍 COMPREHENSIVE OPENAI EMBEDDING AUDIT REPORT")
        print("="*80)
        
        # Summary
        summary = self.audit_results["summary"]
        print(f"\n📊 SUMMARY:")
        print(f"   Total Videos: {summary['total_videos']}")
        print(f"   Total Frames: {summary['total_frames']}")
        print(f"   Total Embeddings: {summary['total_embeddings']}")
        print(f"   Frames with Embeddings: {summary['frames_with_embeddings']}")
        print(f"   Coverage: {summary['coverage_percent']}%")
        print(f"   Missing Embeddings: {summary['missing_embeddings']}")
        print(f"   Duplicate Embeddings: {summary['duplicate_embeddings']}")
        
        # Duplicates
        if self.audit_results["duplicates"]:
            print(f"\n🔄 DUPLICATE EMBEDDINGS: {len(self.audit_results['duplicates'])} frames affected")
            for dup in self.audit_results["duplicates"][:5]:  # Show first 5
                print(f"   Frame {dup['frame_id']} (Video {dup['video_id']}): {dup['duplicate_count']} embeddings")
            if len(self.audit_results["duplicates"]) > 5:
                print(f"   ... and {len(self.audit_results['duplicates']) - 5} more")
        
        # Missing embeddings
        if self.audit_results["missing_embeddings"]:
            print(f"\n❌ MISSING EMBEDDINGS: {len(self.audit_results['missing_embeddings'])} frames")
            video_missing = defaultdict(int)
            for missing in self.audit_results["missing_embeddings"]:
                video_missing[missing['video_filename']] += 1
            
            for video, count in sorted(video_missing.items()):
                print(f"   {video}: {count} missing")
        
        # Orphaned embeddings
        if self.audit_results["orphaned_embeddings"]:
            print(f"\n👻 ORPHANED EMBEDDINGS: {len(self.audit_results['orphaned_embeddings'])}")
        
        # Data integrity issues
        if self.audit_results["data_integrity_issues"]:
            print(f"\n⚠️  DATA INTEGRITY ISSUES: {len(self.audit_results['data_integrity_issues'])}")
            for issue in self.audit_results["data_integrity_issues"][:3]:
                print(f"   Embedding {issue['embedding_id']}: {', '.join(issue['issues'])}")
        
        # Video breakdown
        print(f"\n📹 VIDEO BREAKDOWN:")
        for video_id, data in self.audit_results["video_breakdown"].items():
            status_icon = "✅" if data["coverage_percent"] == 100 else "⚠️" if data["coverage_percent"] > 95 else "❌"
            print(f"   {status_icon} {data['filename']}: {data['coverage_percent']}% ({data['frames_with_embeddings']}/{data['total_frames']})")
        
        # Recommendations
        if self.audit_results["recommendations"]:
            print(f"\n💡 RECOMMENDATIONS:")
            for i, rec in enumerate(self.audit_results["recommendations"], 1):
                print(f"   {i}. {rec}")
        
        print("\n" + "="*80)

if __name__ == "__main__":
    auditor = EmbeddingAuditor()
    auditor.run_comprehensive_audit()