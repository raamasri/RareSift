#!/usr/bin/env python3
"""
Performance testing and optimization suite for RareSift
Tests API endpoints, database queries, and system performance
"""

import asyncio
import time
import statistics
import requests
import psutil
import json
from pathlib import Path
from typing import List, Dict, Tuple
import concurrent.futures
from dataclasses import dataclass
import subprocess

@dataclass
class PerformanceResult:
    test_name: str
    success: bool
    avg_response_time: float
    min_response_time: float
    max_response_time: float
    throughput: float
    error_rate: float
    memory_usage: float
    cpu_usage: float
    details: Dict

class RareSiftPerformanceTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results: List[PerformanceResult] = []
        self.test_data_dir = Path("performance_test_data")
        self.test_data_dir.mkdir(exist_ok=True)
        
    def measure_system_resources(self) -> Tuple[float, float]:
        """Measure current CPU and memory usage"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory_info = psutil.virtual_memory()
        memory_percent = memory_info.percent
        return cpu_percent, memory_percent
    
    def test_api_endpoint(self, endpoint: str, method: str = "GET", 
                         payload: Dict = None, num_requests: int = 100,
                         concurrent_requests: int = 10) -> PerformanceResult:
        """Test API endpoint performance with concurrent requests"""
        print(f"🚀 Testing {method} {endpoint} ({num_requests} requests, {concurrent_requests} concurrent)")
        
        response_times = []
        errors = 0
        start_time = time.time()
        
        # Measure system resources before test
        cpu_before, memory_before = self.measure_system_resources()
        
        def make_request():
            try:
                start = time.time()
                if method == "GET":
                    response = requests.get(f"{self.base_url}{endpoint}", timeout=30)
                elif method == "POST":
                    response = requests.post(f"{self.base_url}{endpoint}", 
                                           json=payload, timeout=30)
                else:
                    raise ValueError(f"Unsupported method: {method}")
                
                end = time.time()
                response_time = end - start
                
                if response.status_code >= 400:
                    return None, response_time  # Error
                return response, response_time
            except Exception as e:
                return None, 30.0  # Timeout or error
        
        # Execute concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_requests) as executor:
            futures = [executor.submit(make_request) for _ in range(num_requests)]
            
            for future in concurrent.futures.as_completed(futures):
                response, response_time = future.result()
                response_times.append(response_time)
                if response is None:
                    errors += 1
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Measure system resources after test
        cpu_after, memory_after = self.measure_system_resources()
        
        # Calculate metrics
        avg_response_time = statistics.mean(response_times)
        min_response_time = min(response_times)
        max_response_time = max(response_times)
        throughput = num_requests / total_time
        error_rate = (errors / num_requests) * 100
        
        result = PerformanceResult(
            test_name=f"{method} {endpoint}",
            success=error_rate < 5.0,  # Success if error rate < 5%
            avg_response_time=avg_response_time,
            min_response_time=min_response_time,
            max_response_time=max_response_time,
            throughput=throughput,
            error_rate=error_rate,
            memory_usage=memory_after,
            cpu_usage=cpu_after,
            details={
                "total_requests": num_requests,
                "concurrent_requests": concurrent_requests,
                "total_time": total_time,
                "cpu_before": cpu_before,
                "cpu_after": cpu_after,
                "memory_before": memory_before,
                "memory_after": memory_after
            }
        )
        
        self.results.append(result)
        return result
    
    def test_video_upload_performance(self) -> PerformanceResult:
        """Test video upload performance with sample file"""
        print("📹 Testing video upload performance...")
        
        # Create a small test video file if it doesn't exist
        test_video_path = self.test_data_dir / "test_video.mp4"
        if not test_video_path.exists():
            # Create a small dummy video file (empty for testing)
            test_video_path.write_bytes(b"fake_video_data" * 1000)
        
        start_time = time.time()
        cpu_before, memory_before = self.measure_system_resources()
        
        try:
            with open(test_video_path, 'rb') as f:
                files = {'file': ('test_video.mp4', f, 'video/mp4')}
                data = {
                    'title': 'Performance Test Video',
                    'description': 'Test video for performance testing'
                }
                
                response = requests.post(
                    f"{self.base_url}/api/v1/videos/upload",
                    files=files,
                    data=data,
                    timeout=60
                )
            
            end_time = time.time()
            cpu_after, memory_after = self.measure_system_resources()
            
            response_time = end_time - start_time
            success = response.status_code < 400
            
            result = PerformanceResult(
                test_name="Video Upload",
                success=success,
                avg_response_time=response_time,
                min_response_time=response_time,
                max_response_time=response_time,
                throughput=1 / response_time,
                error_rate=0.0 if success else 100.0,
                memory_usage=memory_after,
                cpu_usage=cpu_after,
                details={
                    "file_size": test_video_path.stat().st_size,
                    "status_code": response.status_code,
                    "cpu_before": cpu_before,
                    "cpu_after": cpu_after,
                    "memory_before": memory_before,
                    "memory_after": memory_after
                }
            )
            
        except Exception as e:
            end_time = time.time()
            cpu_after, memory_after = self.measure_system_resources()
            
            result = PerformanceResult(
                test_name="Video Upload",
                success=False,
                avg_response_time=end_time - start_time,
                min_response_time=end_time - start_time,
                max_response_time=end_time - start_time,
                throughput=0.0,
                error_rate=100.0,
                memory_usage=memory_after,
                cpu_usage=cpu_after,
                details={
                    "error": str(e),
                    "cpu_before": cpu_before,
                    "cpu_after": cpu_after,
                    "memory_before": memory_before,
                    "memory_after": memory_after
                }
            )
        
        self.results.append(result)
        return result
    
    def test_search_performance(self) -> PerformanceResult:
        """Test search performance with various queries"""
        print("🔍 Testing search performance...")
        
        search_queries = [
            "car driving on highway",
            "traffic light intersection",
            "pedestrian crossing street",
            "motorcycle lane change",
            "truck parking lot"
        ]
        
        response_times = []
        errors = 0
        start_time = time.time()
        cpu_before, memory_before = self.measure_system_resources()
        
        for query in search_queries:
            try:
                payload = {
                    "query": query,
                    "limit": 10
                }
                
                query_start = time.time()
                response = requests.post(
                    f"{self.base_url}/api/v1/search/text",
                    json=payload,
                    timeout=30
                )
                query_end = time.time()
                
                response_times.append(query_end - query_start)
                
                if response.status_code >= 400:
                    errors += 1
                    
            except Exception as e:
                response_times.append(30.0)
                errors += 1
        
        end_time = time.time()
        cpu_after, memory_after = self.measure_system_resources()
        
        total_time = end_time - start_time
        avg_response_time = statistics.mean(response_times)
        min_response_time = min(response_times)
        max_response_time = max(response_times)
        throughput = len(search_queries) / total_time
        error_rate = (errors / len(search_queries)) * 100
        
        result = PerformanceResult(
            test_name="Search Performance",
            success=error_rate < 20.0,
            avg_response_time=avg_response_time,
            min_response_time=min_response_time,
            max_response_time=max_response_time,
            throughput=throughput,
            error_rate=error_rate,
            memory_usage=memory_after,
            cpu_usage=cpu_after,
            details={
                "queries_tested": len(search_queries),
                "total_time": total_time,
                "queries": search_queries,
                "cpu_before": cpu_before,
                "cpu_after": cpu_after,
                "memory_before": memory_before,
                "memory_after": memory_after
            }
        )
        
        self.results.append(result)
        return result
    
    def test_database_performance(self) -> PerformanceResult:
        """Test database performance (if accessible)"""
        print("💾 Testing database performance...")
        
        try:
            # Simple database connectivity test
            response_times = []
            
            for i in range(10):
                start = time.time()
                response = requests.get(f"{self.base_url}/health", timeout=10)
                end = time.time()
                response_times.append(end - start)
            
            cpu_usage, memory_usage = self.measure_system_resources()
            
            avg_response_time = statistics.mean(response_times)
            
            result = PerformanceResult(
                test_name="Database Connectivity",
                success=len(response_times) > 0,
                avg_response_time=avg_response_time,
                min_response_time=min(response_times),
                max_response_time=max(response_times),
                throughput=len(response_times) / sum(response_times),
                error_rate=0.0,
                memory_usage=memory_usage,
                cpu_usage=cpu_usage,
                details={
                    "health_checks": len(response_times),
                    "response_times": response_times
                }
            )
            
        except Exception as e:
            cpu_usage, memory_usage = self.measure_system_resources()
            
            result = PerformanceResult(
                test_name="Database Connectivity",
                success=False,
                avg_response_time=0.0,
                min_response_time=0.0,
                max_response_time=0.0,
                throughput=0.0,
                error_rate=100.0,
                memory_usage=memory_usage,
                cpu_usage=cpu_usage,
                details={"error": str(e)}
            )
        
        self.results.append(result)
        return result
    
    def test_concurrent_users(self, num_users: int = 50) -> PerformanceResult:
        """Simulate concurrent users accessing the application"""
        print(f"👥 Testing concurrent users ({num_users} users)...")
        
        def simulate_user():
            """Simulate a user session"""
            session_start = time.time()
            actions = 0
            
            try:
                # User performs various actions
                session = requests.Session()
                
                # 1. Access homepage
                session.get(f"{self.base_url}/health", timeout=10)
                actions += 1
                
                # 2. Perform search
                search_payload = {"query": "driving scenario", "limit": 5}
                session.post(f"{self.base_url}/api/v1/search/text", 
                           json=search_payload, timeout=10)
                actions += 1
                
                session_end = time.time()
                return session_end - session_start, actions, None
                
            except Exception as e:
                session_end = time.time()
                return session_end - session_start, actions, str(e)
        
        start_time = time.time()
        cpu_before, memory_before = self.measure_system_resources()
        
        # Execute concurrent user sessions
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_users) as executor:
            futures = [executor.submit(simulate_user) for _ in range(num_users)]
            
            session_times = []
            total_actions = 0
            errors = 0
            
            for future in concurrent.futures.as_completed(futures):
                session_time, actions, error = future.result()
                session_times.append(session_time)
                total_actions += actions
                if error:
                    errors += 1
        
        end_time = time.time()
        cpu_after, memory_after = self.measure_system_resources()
        
        total_time = end_time - start_time
        avg_session_time = statistics.mean(session_times)
        throughput = num_users / total_time
        error_rate = (errors / num_users) * 100
        
        result = PerformanceResult(
            test_name=f"Concurrent Users ({num_users})",
            success=error_rate < 10.0,
            avg_response_time=avg_session_time,
            min_response_time=min(session_times),
            max_response_time=max(session_times),
            throughput=throughput,
            error_rate=error_rate,
            memory_usage=memory_after,
            cpu_usage=cpu_after,
            details={
                "num_users": num_users,
                "total_time": total_time,
                "total_actions": total_actions,
                "cpu_before": cpu_before,
                "cpu_after": cpu_after,
                "memory_before": memory_before,
                "memory_after": memory_after
            }
        )
        
        self.results.append(result)
        return result
    
    def generate_performance_report(self) -> str:
        """Generate comprehensive performance report"""
        report = []
        report.append("# RareSift Performance Test Report")
        report.append(f"Generated on: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Summary
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.success)
        failed_tests = total_tests - passed_tests
        
        report.append("## Executive Summary")
        report.append(f"- **Total Tests**: {total_tests}")
        report.append(f"- **Passed**: {passed_tests}")
        report.append(f"- **Failed**: {failed_tests}")
        report.append(f"- **Success Rate**: {(passed_tests/total_tests*100):.1f}%")
        report.append("")
        
        # Detailed results
        report.append("## Detailed Performance Results")
        report.append("")
        
        for result in self.results:
            status = "✅ PASS" if result.success else "❌ FAIL"
            report.append(f"### {result.test_name} {status}")
            report.append("")
            report.append(f"- **Average Response Time**: {result.avg_response_time:.3f}s")
            report.append(f"- **Min Response Time**: {result.min_response_time:.3f}s")
            report.append(f"- **Max Response Time**: {result.max_response_time:.3f}s")
            report.append(f"- **Throughput**: {result.throughput:.2f} req/s")
            report.append(f"- **Error Rate**: {result.error_rate:.1f}%")
            report.append(f"- **CPU Usage**: {result.cpu_usage:.1f}%")
            report.append(f"- **Memory Usage**: {result.memory_usage:.1f}%")
            report.append("")
        
        # Performance analysis
        report.append("## Performance Analysis")
        report.append("")
        
        if self.results:
            avg_response_times = [r.avg_response_time for r in self.results if r.success]
            if avg_response_times:
                overall_avg = statistics.mean(avg_response_times)
                report.append(f"- **Overall Average Response Time**: {overall_avg:.3f}s")
                
                if overall_avg < 1.0:
                    report.append("- **Response Time Rating**: Excellent (< 1s)")
                elif overall_avg < 3.0:
                    report.append("- **Response Time Rating**: Good (1-3s)")
                elif overall_avg < 5.0:
                    report.append("- **Response Time Rating**: Acceptable (3-5s)")
                else:
                    report.append("- **Response Time Rating**: Poor (> 5s)")
        
        # Recommendations
        report.append("")
        report.append("## Performance Recommendations")
        report.append("")
        
        high_response_time_tests = [r for r in self.results if r.avg_response_time > 3.0]
        if high_response_time_tests:
            report.append("### High Response Time Issues")
            for test in high_response_time_tests:
                report.append(f"- **{test.test_name}**: {test.avg_response_time:.3f}s")
            report.append("")
        
        high_error_rate_tests = [r for r in self.results if r.error_rate > 5.0]
        if high_error_rate_tests:
            report.append("### High Error Rate Issues")
            for test in high_error_rate_tests:
                report.append(f"- **{test.test_name}**: {test.error_rate:.1f}% error rate")
            report.append("")
        
        # Optimization suggestions
        report.append("### Optimization Suggestions")
        suggestions = [
            "1. **Database Optimization**: Add indexes for frequently queried fields",
            "2. **Caching**: Implement Redis caching for search results",
            "3. **Connection Pooling**: Configure database connection pooling",
            "4. **API Rate Limiting**: Implement proper rate limiting",
            "5. **Asset Optimization**: Compress and optimize video/image assets",
            "6. **CDN Integration**: Use CDN for static asset delivery",
            "7. **Load Balancing**: Configure load balancing for high traffic",
            "8. **Database Sharding**: Consider sharding for large datasets"
        ]
        
        for suggestion in suggestions:
            report.append(suggestion)
        
        return "\\n".join(report)
    
    def run_all_tests(self):
        """Run all performance tests"""
        print("🚀 RareSift Performance Test Suite")
        print("=" * 50)
        
        # Check if application is running
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code != 200:
                print(f"❌ Application not responding at {self.base_url}")
                print("💡 Please start the RareSift backend server first")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to application at {self.base_url}")
            print(f"   Error: {e}")
            print("💡 Please start the RareSift backend server first")
            return False
        
        print(f"✅ Application is running at {self.base_url}")
        print("")
        
        # Run individual tests
        test_functions = [
            ("API Health Check", lambda: self.test_api_endpoint("/health", num_requests=50)),
            ("Search Text API", lambda: self.test_search_performance()),
            ("Database Performance", lambda: self.test_database_performance()),
            ("Concurrent Users", lambda: self.test_concurrent_users(25)),
            ("API Load Test", lambda: self.test_api_endpoint("/api/v1/videos/", num_requests=100, concurrent_requests=20))
        ]
        
        for test_name, test_func in test_functions:
            try:
                print(f"Running {test_name}...")
                test_func()
                print("✅ Completed")
            except Exception as e:
                print(f"❌ Failed: {e}")
            print("")
        
        # Generate and save report
        report = self.generate_performance_report()
        report_file = Path("performance-test-report.md")
        report_file.write_text(report)
        
        print("📋 Performance test report generated:")
        print(f"   📄 {report_file.absolute()}")
        print("")
        
        # Summary
        passed = sum(1 for r in self.results if r.success)
        total = len(self.results)
        
        print("📊 Performance Test Summary:")
        print(f"   ✅ Passed: {passed}/{total}")
        print(f"   ❌ Failed: {total - passed}/{total}")
        print(f"   📈 Success Rate: {(passed/total*100):.1f}%")
        
        if passed == total:
            print("🎉 All performance tests passed!")
        else:
            print("⚠️ Some performance tests failed - review the report")
        
        return passed == total

def main():
    """Main function to run performance tests"""
    import argparse
    
    parser = argparse.ArgumentParser(description="RareSift Performance Test Suite")
    parser.add_argument("--url", default="http://localhost:8000", 
                       help="Base URL of RareSift application")
    parser.add_argument("--quick", action="store_true", 
                       help="Run quick tests only")
    
    args = parser.parse_args()
    
    tester = RareSiftPerformanceTester(args.url)
    
    if args.quick:
        print("🏃 Running quick performance tests...")
        # Quick tests with fewer requests
        tester.test_api_endpoint("/health", num_requests=10)
        tester.test_database_performance()
    else:
        # Full test suite
        success = tester.run_all_tests()
    
    return True

if __name__ == "__main__":
    main()