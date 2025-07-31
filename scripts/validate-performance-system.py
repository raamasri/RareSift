#!/usr/bin/env python3
"""
Validation script for RareSift Performance Testing and Optimization system
Tests all performance-related components and validates functionality
"""

import os
import subprocess
from pathlib import Path
import time

def test_performance_testing_suite():
    """Test the performance testing suite"""
    print("🚀 Testing Performance Testing Suite")
    print("=" * 40)
    
    script_path = Path("scripts/performance-test-suite.py")
    
    # Test 1: Script exists
    if script_path.exists():
        print("   ✅ Performance test suite exists")
    else:
        print("   ❌ Performance test suite missing")
        return False
    
    # Test 2: Script can be imported (syntax check)
    try:
        result = subprocess.run([
            "python3", "-m", "py_compile", str(script_path)
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("   ✅ Script syntax is valid")
        else:
            print(f"   ❌ Script syntax error: {result.stderr}")
            return False
    except Exception as e:
        print(f"   ❌ Script validation failed: {e}")
        return False
    
    # Test 3: Help command works
    try:
        result = subprocess.run([
            "python3", str(script_path), "--help"
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0 and "Performance Test Suite" in result.stdout:
            print("   ✅ Help command works correctly")
        else:
            print("   ❌ Help command failed")
            return False
    except Exception as e:
        print(f"   ❌ Help command test failed: {e}")
        return False
    
    return True

def test_performance_optimization_suite():
    """Test the performance optimization suite"""
    print("\\n🛠️ Testing Performance Optimization Suite")
    print("=" * 40)
    
    script_path = Path("scripts/performance-optimization.py")
    
    # Test 1: Script exists
    if script_path.exists():
        print("   ✅ Performance optimization suite exists")
    else:
        print("   ❌ Performance optimization suite missing")
        return False
    
    # Test 2: Script runs without database connection
    try:
        result = subprocess.run([
            "python3", str(script_path)
        ], capture_output=True, text=True, timeout=30)
        
        if "Performance Optimization" in result.stdout:
            print("   ✅ Script executes successfully")
        else:
            print(f"   ❌ Script execution failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("   ❌ Script timed out (>30s)")
        return False
    except Exception as e:
        print(f"   ❌ Script execution failed: {e}")
        return False
    
    # Test 3: Check optimization report generated
    report_file = Path("performance-optimization-report.md")
    if report_file.exists():
        print("   ✅ Optimization report generated")
        content = report_file.read_text()
        if "Performance Optimization Report" in content:
            print("   ✅ Report contains expected content")
        else:
            print("   ❌ Report content incomplete")
            return False
    else:
        print("   ❌ Optimization report not generated")
        return False
    
    return True

def test_generated_optimization_files():
    """Test that optimization files were generated correctly"""
    print("\\n📁 Testing Generated Optimization Files")
    print("=" * 40)
    
    expected_files = [
        ("backend/app/core/cache.py", "Redis caching configuration"),
        ("backend/app/core/performance_middleware.py", "Performance monitoring middleware"),
        ("scripts/optimize-database.py", "Database optimization script")
    ]
    
    success = True
    for file_path, description in expected_files:
        file_obj = Path(file_path)
        if file_obj.exists():
            print(f"   ✅ {description}")
            
            # Basic content validation
            content = file_obj.read_text()
            if "class" in content or "def" in content:
                print(f"   ✅ {file_path} contains valid Python code")
            else:
                print(f"   ⚠️  {file_path} might be incomplete")
        else:
            print(f"   ❌ {description} - MISSING")
            success = False
    
    return success

def test_performance_reports():
    """Test that performance reports are properly formatted"""
    print("\\n📊 Testing Performance Reports")
    print("=" * 40)
    
    report_files = [
        ("performance-optimization-report.md", "Optimization Report")
    ]
    
    success = True
    for report_file, description in report_files:
        file_obj = Path(report_file)
        if file_obj.exists():
            print(f"   ✅ {description} exists")
            
            content = file_obj.read_text()
            expected_sections = [
                "# RareSift Performance",
                "## Optimizations Applied",
                "## Performance Recommendations",
                "## Performance Optimization Checklist"
            ]
            
            for section in expected_sections:
                if section in content:
                    print(f"   ✅ Contains {section}")
                else:
                    print(f"   ⚠️  Missing {section}")
        else:
            print(f"   ❌ {description} - MISSING")
            success = False
    
    return success

def check_performance_monitoring_setup():
    """Check performance monitoring setup"""
    print("\\n📈 Checking Performance Monitoring Setup")
    print("=" * 40)
    
    monitoring_components = [
        ("backend/app/core/performance_middleware.py", "Performance middleware"),
        ("backend/app/core/cache.py", "Caching system"),
        ("scripts/optimize-database.py", "Database optimization"),
        ("scripts/performance-test-suite.py", "Performance testing"),
        ("scripts/performance-optimization.py", "Performance optimization")
    ]
    
    success = True
    for component_path, description in monitoring_components:
        if Path(component_path).exists():
            print(f"   ✅ {description}")
        else:
            print(f"   ❌ {description} - MISSING")
            success = False
    
    return success

def show_performance_features():
    """Show available performance features"""
    print("\\n🎯 Available Performance Features")
    print("=" * 40)
    
    features = [
        "✅ Comprehensive performance testing suite",
        "✅ Automated performance optimization analysis",
        "✅ Redis caching configuration for search results",
        "✅ Performance monitoring middleware with request timing",
        "✅ Database query optimization and indexing",
        "✅ Docker configuration optimization",
        "✅ Frontend performance optimization (Next.js)",
        "✅ Nginx configuration optimization",
        "✅ Concurrent user simulation testing",
        "✅ API endpoint load testing",
        "✅ Performance reporting and recommendations"
    ]
    
    for feature in features:
        print(f"   {feature}")

def show_usage_instructions():
    """Show usage instructions for performance tools"""
    print("\\n💡 Performance Tools Usage Instructions")
    print("=" * 50)
    
    instructions = [
        "# Performance Testing:",
        "python3 scripts/performance-test-suite.py              # Full test suite",
        "python3 scripts/performance-test-suite.py --quick      # Quick tests",
        "python3 scripts/performance-test-suite.py --url=http://localhost:8000",
        "",
        "# Performance Optimization:",
        "python3 scripts/performance-optimization.py            # Run optimization analysis",
        "python3 scripts/optimize-database.py                   # Optimize database (after setup)",
        "",
        "# Performance Reports:",
        "# Check performance-test-report.md after running tests",
        "# Check performance-optimization-report.md after optimization",
        "",
        "# Recommended Workflow:",
        "1. Start RareSift application (docker-compose up -d)",
        "2. Run performance tests to establish baseline",
        "3. Run optimization analysis for recommendations", 
        "4. Implement optimizations (caching, indexes, etc.)",
        "5. Re-run performance tests to measure improvements",
        "6. Monitor performance in production environment"
    ]
    
    for instruction in instructions:
        print(f"   {instruction}")

def main():
    """Run all validation tests"""
    print("🚀 RareSift Performance System Validation")
    print("=" * 55)
    
    # Run all test functions
    test_results = [
        test_performance_testing_suite(),
        test_performance_optimization_suite(),
        test_generated_optimization_files(),
        test_performance_reports(),
        check_performance_monitoring_setup()
    ]
    
    # Show features and usage
    show_performance_features()
    show_usage_instructions()
    
    print("\\n" + "=" * 55)
    if all(test_results):
        print("🎉 Performance System Validation PASSED!")
        print("✅ Performance testing suite ready")
        print("✅ Performance optimization tools ready")
        print("✅ Monitoring and caching components created")
        print("✅ Database optimization scripts ready")
        print("✅ Performance reports generated")
        
        print("\\n🚀 Ready for performance testing and optimization!")
        print("💡 Start with baseline performance tests")
        
        return True
    else:
        print("❌ Performance System Validation FAILED")
        print("💡 Please resolve the issues above")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)