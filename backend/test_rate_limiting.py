#!/usr/bin/env python3
"""
Simple test of OpenAI rate limiting functionality
Tests the rate limiter without needing full database setup
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

# Set minimal required environment variables
os.environ['DATABASE_URL'] = 'postgresql://test:test@localhost/test'
os.environ['REDIS_URL'] = 'redis://localhost:6379'
os.environ['SECRET_KEY'] = 'test-secret-key-for-rate-limiting-testing'
os.environ['OPENAI_API_KEY'] = 'test-key'  # Won't actually call API

from app.services.openai_embedding_service import OpenAIRateLimiter

async def test_rate_limiter():
    """Test the rate limiting logic without making actual API calls"""
    
    print("🧪 Testing OpenAI Rate Limiter")
    print("="*50)
    
    # Create rate limiter with test limits
    limiter = OpenAIRateLimiter()
    
    # Override limits for testing
    limiter.limits = {
        'requests_per_minute': 5,  # Very low for testing
        'tokens_per_minute': 1000,
        'concurrent_requests': 2,
        'daily_cost_limit': 1.0  # $1 limit
    }
    
    print("📊 Initial Status:")
    status = limiter.get_status()
    for key, value in status.items():
        if isinstance(value, dict) and 'current' in value:
            print(f"  {key}: {value['current']}/{value['limit']} ({value['percentage']:.1f}%)")
        else:
            print(f"  {key}: {value}")
    
    print("\n🚀 Testing Rate Limiting Logic:")
    
    # Test 1: Normal requests within limits
    print("\n1. Testing normal requests within limits:")
    for i in range(3):
        permitted = await limiter.acquire_permit("text-embedding-ada-002", 100)
        print(f"   Request {i+1}: {'✅ Permitted' if permitted else '❌ Denied'}")
        limiter.release_permit(100, "text-embedding-ada-002")
    
    # Test 2: Exceed RPM limit
    print("\n2. Testing RPM limit:")
    for i in range(7):  # More than limit of 5
        permitted = await limiter.acquire_permit("text-embedding-ada-002", 100)
        status_msg = "✅ Permitted" if permitted else "❌ Denied (RPM limit)"
        print(f"   Request {i+1}: {status_msg}")
        if permitted:
            limiter.release_permit(100, "text-embedding-ada-002")
    
    # Test 3: Reset and test token limit
    print("\n3. Testing TPM limit:")
    limiter.request_times.clear()  # Reset requests
    
    permitted = await limiter.acquire_permit("text-embedding-ada-002", 1200)  # Over limit
    print(f"   Large request (1200 tokens): {'✅ Permitted' if permitted else '❌ Denied (TPM limit)'}")
    
    # Test 4: Cost limit
    print("\n4. Testing daily cost limit:")
    limiter.request_times.clear()
    limiter.token_usage.clear()
    limiter.daily_cost = 0.0
    
    # This should exceed $1 limit
    permitted = await limiter.acquire_permit("text-embedding-ada-002", 15000)  # ~$1.50 worth
    print(f"   Expensive request: {'✅ Permitted' if permitted else '❌ Denied (Cost limit)'}")
    
    print("\n📊 Final Status:")
    final_status = limiter.get_status()
    for key, value in final_status.items():
        if isinstance(value, dict) and 'current' in value:
            print(f"  {key}: {value['current']}/{value['limit']} ({value['percentage']:.1f}%)")
        else:
            print(f"  {key}: {value}")
    
    print("\n✅ Rate limiting test complete!")

if __name__ == "__main__":
    asyncio.run(test_rate_limiter())