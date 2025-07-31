"""
Security utilities for file validation and path sanitization
"""

import os
import magic  # python-magic for proper file type detection
import tempfile
from pathlib import Path
from typing import Optional, Set, Dict, Any
from fastapi import HTTPException, UploadFile
import hashlib
import re

from app.core.config import settings

# Allowed video file extensions and MIME types
ALLOWED_VIDEO_EXTENSIONS = {
    '.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v'
}

ALLOWED_VIDEO_MIME_TYPES = {
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
    'video/webm', 'video/x-flv', 'video/x-ms-wmv', 'video/x-m4v'
}

# Maximum file sizes (in bytes)
MAX_FILE_SIZES = {
    'video': 500 * 1024 * 1024,  # 500MB
    'image': 10 * 1024 * 1024,   # 10MB
}

class FileSecurityValidator:
    """Secure file validation utilities"""
    
    def __init__(self):
        self.magic_mime = magic.Magic(mime=True)
        
    def sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename to prevent path traversal and other attacks
        """
        if not filename:
            raise ValueError("Filename cannot be empty")
            
        # Remove path separators and dangerous characters
        filename = os.path.basename(filename)
        filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', filename)
        
        # Limit filename length
        if len(filename) > 255:
            name, ext = os.path.splitext(filename)
            filename = name[:250 - len(ext)] + ext
            
        # Ensure filename doesn't start with dot or dash
        if filename.startswith(('.', '-')):
            filename = 'file_' + filename
            
        # Ensure we have some content
        if not filename or filename == '.' or filename == '..':
            filename = 'uploaded_file'
            
        return filename
    
    def generate_secure_filename(self, original_filename: str, user_id: int) -> str:
        """
        Generate a secure, unique filename
        """
        sanitized = self.sanitize_filename(original_filename)
        name, ext = os.path.splitext(sanitized)
        
        # Create hash from user_id, timestamp, and original name
        import time
        timestamp = str(int(time.time() * 1000))  # millisecond precision
        hash_input = f"{user_id}_{timestamp}_{name}".encode('utf-8')
        file_hash = hashlib.sha256(hash_input).hexdigest()[:12]
        
        return f"{user_id}_{timestamp}_{file_hash}{ext.lower()}"
    
    def validate_file_type(self, file_content: bytes, expected_type: str = 'video') -> Dict[str, Any]:
        """
        Validate file type using magic bytes (more secure than MIME type)
        """
        # Check if file has content
        if not file_content or len(file_content) < 512:
            raise HTTPException(status_code=400, detail="File is empty or too small")
            
        # Write to temporary file for magic analysis
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(file_content[:8192])  # First 8KB is enough for magic
            temp_file.flush()
            
            try:
                # Get actual MIME type from file content
                actual_mime = self.magic_mime.from_file(temp_file.name)
                
                # Validate based on expected type
                if expected_type == 'video':
                    if not actual_mime.startswith('video/'):
                        raise HTTPException(
                            status_code=400, 
                            detail=f"File is not a valid video. Detected type: {actual_mime}"
                        )
                    
                    if actual_mime not in ALLOWED_VIDEO_MIME_TYPES:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Video format not supported: {actual_mime}"
                        )
                        
                elif expected_type == 'image':
                    if not actual_mime.startswith('image/'):
                        raise HTTPException(
                            status_code=400,
                            detail=f"File is not a valid image. Detected type: {actual_mime}"
                        )
                
                return {
                    'mime_type': actual_mime,
                    'size': len(file_content),
                    'is_valid': True
                }
                
            finally:
                # Clean up temp file
                try:
                    os.unlink(temp_file.name)
                except:
                    pass
    
    def validate_file_size(self, file_size: int, file_type: str = 'video') -> None:
        """
        Validate file size against limits
        """
        max_size = MAX_FILE_SIZES.get(file_type, MAX_FILE_SIZES['video'])
        
        if file_size > max_size:
            max_mb = max_size / (1024 * 1024)
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: {max_mb:.1f}MB"
            )
    
    def validate_upload_file(self, file: UploadFile, user_id: int, expected_type: str = 'video') -> Dict[str, Any]:
        """
        Complete validation of uploaded file
        """
        # Validate filename
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename is required")
            
        # Check file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if expected_type == 'video' and file_ext not in ALLOWED_VIDEO_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File extension not allowed: {file_ext}. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}"
            )
        
        return {
            'original_filename': file.filename,
            'sanitized_filename': self.sanitize_filename(file.filename),
            'secure_filename': self.generate_secure_filename(file.filename, user_id),
            'file_extension': file_ext
        }

def sanitize_path(path: str, base_dir: str) -> str:
    """
    Sanitize file path to prevent directory traversal attacks
    """
    # Resolve the base directory to absolute path
    base_dir = os.path.abspath(base_dir)
    
    # Remove any path separators and resolve relative paths
    clean_path = os.path.normpath(path)
    
    # Join with base directory
    full_path = os.path.join(base_dir, clean_path)
    
    # Ensure the resulting path is within the base directory
    full_path = os.path.abspath(full_path)
    
    if not full_path.startswith(base_dir):
        raise HTTPException(
            status_code=400,
            detail="Invalid file path - directory traversal detected"
        )
    
    return full_path

def secure_delete_file(file_path: str, base_dir: str) -> bool:
    """
    Securely delete a file with path validation
    """
    try:
        # Validate path is within base directory
        safe_path = sanitize_path(file_path, base_dir)
        
        if os.path.exists(safe_path) and os.path.isfile(safe_path):
            os.remove(safe_path)
            return True
        return False
        
    except Exception:
        return False

def secure_delete_directory_contents(directory: str, pattern: str, base_dir: str) -> int:
    """
    Securely delete files matching pattern in a directory
    """
    deleted_count = 0
    
    try:
        # Validate directory path
        safe_dir = sanitize_path(directory, base_dir)
        
        if not os.path.exists(safe_dir) or not os.path.isdir(safe_dir):
            return 0
            
        # List files matching pattern
        for filename in os.listdir(safe_dir):
            if re.match(pattern, filename):
                file_path = os.path.join(safe_dir, filename)
                if secure_delete_file(file_path, base_dir):
                    deleted_count += 1
                    
    except Exception:
        pass
        
    return deleted_count

# Global validator instance
file_validator = FileSecurityValidator()