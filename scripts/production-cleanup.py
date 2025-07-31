#!/usr/bin/env python3
"""
Production cleanup script for RareSift
Removes development code, debug statements, and prepares for production deployment
"""

import os
import re
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple

class ProductionCleanup:
    def __init__(self):
        self.project_root = Path.cwd()
        self.issues_found = []
        self.files_modified = []
        
    def scan_for_debug_statements(self) -> List[Tuple[str, int, str]]:
        """Scan for debug statements in Python and JavaScript files"""
        print("🔍 Scanning for debug statements...")
        
        debug_patterns = {
            'python': [
                r'print\s*\(',
                r'pprint\s*\(',
                r'pp\s*\(',
                r'breakpoint\s*\(\)',
                r'pdb\.set_trace\s*\(\)',
                r'ipdb\.set_trace\s*\(\)',
                r'debugpy\.',
                r'import\s+pdb',
                r'import\s+ipdb',
                r'import\s+debugpy',
                r'console\.log\s*\(',  # Sometimes in Python templates
            ],
            'javascript': [
                r'console\.log\s*\(',
                r'console\.debug\s*\(',
                r'console\.warn\s*\(',
                r'console\.error\s*\(',
                r'console\.info\s*\(',
                r'console\.table\s*\(',
                r'console\.trace\s*\(',
                r'debugger\s*;',
                r'alert\s*\(',
                r'confirm\s*\(',
            ]
        }
        
        issues = []
        
        # Python files
        for py_file in self.project_root.rglob("*.py"):
            if self.should_skip_file(py_file):
                continue
                
            try:
                content = py_file.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                for i, line in enumerate(lines, 1):
                    # Skip comments
                    if line.strip().startswith('#'):
                        continue
                    
                    for pattern in debug_patterns['python']:
                        if re.search(pattern, line, re.IGNORECASE):
                            issues.append((str(py_file), i, line.strip()))
            except Exception as e:
                print(f"   ⚠️  Error reading {py_file}: {e}")
        
        # JavaScript/TypeScript files
        js_extensions = ['*.js', '*.jsx', '*.ts', '*.tsx']
        for ext in js_extensions:
            for js_file in self.project_root.rglob(ext):
                if self.should_skip_file(js_file):
                    continue
                    
                try:
                    content = js_file.read_text(encoding='utf-8')
                    lines = content.split('\n')
                    
                    for i, line in enumerate(lines, 1):
                        # Skip comments
                        if line.strip().startswith('//') or line.strip().startswith('/*'):
                            continue
                        
                        for pattern in debug_patterns['javascript']:
                            if re.search(pattern, line, re.IGNORECASE):
                                issues.append((str(js_file), i, line.strip()))
                except Exception as e:
                    print(f"   ⚠️  Error reading {js_file}: {e}")
        
        return issues
    
    def scan_for_dev_dependencies(self) -> List[str]:
        """Scan for development dependencies that shouldn't be in production"""
        print("📦 Scanning for development dependencies...")
        
        issues = []
        
        # Check Python requirements.txt
        req_file = self.project_root / "backend" / "requirements.txt"
        if req_file.exists():
            content = req_file.read_text()
            dev_packages = [
                'pytest', 'pytest-cov', 'pytest-asyncio',
                'ipdb', 'pdb', 'debugpy',
                'jupyter', 'notebook',
                'black', 'flake8', 'mypy',
                'pre-commit'
            ]
            
            for package in dev_packages:
                if package in content:
                    issues.append(f"Python dev dependency: {package}")
        
        # Check package.json
        pkg_file = self.project_root / "frontend" / "package.json"
        if pkg_file.exists():
            try:
                import json
                with open(pkg_file) as f:
                    pkg_data = json.load(f)
                
                dev_deps = pkg_data.get('dependencies', {})
                problematic_deps = []
                
                for dep_name in dev_deps:
                    if any(dev_word in dep_name for dev_word in ['test', 'debug', 'dev', 'mock']):
                        problematic_deps.append(dep_name)
                
                if problematic_deps:
                    issues.append(f"Frontend potential dev dependencies: {', '.join(problematic_deps)}")
                    
            except Exception as e:
                print(f"   ⚠️  Error reading package.json: {e}")
        
        return issues
    
    def scan_for_hardcoded_values(self) -> List[Tuple[str, int, str]]:
        """Scan for hardcoded values that should use environment variables"""
        print("🔒 Scanning for hardcoded values...")
        
        issues = []
        hardcoded_patterns = [
            r'localhost',
            r'127\.0\.0\.1',
            r'dev-secret-key',
            r'development',
            r'test.*password',
            r'password.*=.*["\'][^"\']{6,}["\']',
            r'api.*key.*=.*["\'][^"\']{10,}["\']',
            r'secret.*=.*["\'][^"\']{8,}["\']',
        ]
        
        # Scan Python files
        for py_file in self.project_root.rglob("*.py"):
            if self.should_skip_file(py_file):
                continue
                
            try:
                content = py_file.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                for i, line in enumerate(lines, 1):
                    # Skip comments
                    if line.strip().startswith('#'):
                        continue
                    
                    for pattern in hardcoded_patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            # Skip if it's clearly a default or example
                            if any(skip in line.lower() for skip in ['default', 'example', 'template', 'placeholder']):
                                continue
                            issues.append((str(py_file), i, line.strip()))
            except Exception as e:
                print(f"   ⚠️  Error reading {py_file}: {e}")
        
        return issues
    
    def scan_for_dev_environment_checks(self) -> List[Tuple[str, int, str]]:
        """Scan for development environment checks"""
        print("⚙️ Scanning for development environment settings...")
        
        issues = []
        dev_patterns = [
            r'ENVIRONMENT.*=.*["\']development["\']',
            r'DEBUG.*=.*True',
            r'ENV.*=.*["\']dev["\']',
            r'STAGE.*=.*["\']development["\']',
        ]
        
        for config_file in self.project_root.rglob("*.py"):
            if self.should_skip_file(config_file):
                continue
                
            try:
                content = config_file.read_text(encoding='utf-8')
                lines = content.split('\n')
                
                for i, line in enumerate(lines, 1):
                    for pattern in dev_patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            issues.append((str(config_file), i, line.strip()))
            except Exception as e:
                print(f"   ⚠️  Error reading {config_file}: {e}")
        
        return issues
    
    def scan_for_temporary_files(self) -> List[str]:
        """Scan for temporary and cache files"""
        print("🗑️ Scanning for temporary files...")
        
        temp_patterns = [
            "**/__pycache__",
            "**/*.pyc",
            "**/*.pyo",
            "**/.pytest_cache",
            "**/node_modules",
            "**/.next",
            "**/.cache",
            "**/coverage",
            "**/.coverage",
            "**/htmlcov",
            "**/*.log",
            "**/logs/*.log",
            "**/.DS_Store",
            "**/Thumbs.db",
            "**/*.tmp",
            "**/*.temp",
            "**/dist",
            "**/build"
        ]
        
        temp_files = []
        for pattern in temp_patterns:
            for temp_file in self.project_root.glob(pattern):
                if temp_file.is_file() or temp_file.is_dir():
                    temp_files.append(str(temp_file))
        
        return temp_files
    
    def scan_for_test_files_in_production(self) -> List[str]:
        """Find test files that shouldn't be in production builds"""
        print("🧪 Scanning for test files...")
        
        test_files = []
        test_patterns = [
            "**/*test*.py",
            "**/*_test.py",
            "**/*test*.js",
            "**/*test*.ts",
            "**/*test*.tsx",
            "**/test_*.py",
            "**/tests/**",
            "**/__tests__/**",
            "**/spec/**",
            "**/*.spec.py",
            "**/*.spec.js",
            "**/*.spec.ts"
        ]
        
        for pattern in test_patterns:
            for test_file in self.project_root.glob(pattern):
                if test_file.is_file():
                    test_files.append(str(test_file))
        
        return test_files
    
    def should_skip_file(self, file_path: Path) -> bool:
        """Check if file should be skipped during scanning"""
        skip_patterns = [
            'node_modules',
            '__pycache__',
            '.git',
            '.pytest_cache',
            'venv',
            'env',
            '.next',
            'coverage',
            'htmlcov',
            'logs',
            'migrations',
            'scripts/production-cleanup.py'  # Skip this script itself
        ]
        
        str_path = str(file_path)
        return any(pattern in str_path for pattern in skip_patterns)
    
    def create_production_config(self):
        """Create production-ready configuration files"""
        print("⚙️ Creating production configuration...")
        
        # Update backend config to ensure production defaults
        backend_config = self.project_root / "backend" / "app" / "core" / "config.py"
        if backend_config.exists():
            content = backend_config.read_text()
            
            # Replace development defaults with production ones
            replacements = [
                ('environment: str = "development"', 'environment: str = "production"'),
                ('log_level: str = "DEBUG"', 'log_level: str = "INFO"'),
                ('full_parsing_enabled: bool = True', 'full_parsing_enabled: bool = False'),
            ]
            
            modified = False
            for old, new in replacements:
                if old in content:
                    content = content.replace(old, new)
                    modified = True
            
            if modified:
                backend_config.write_text(content)
                self.files_modified.append(str(backend_config))
                print(f"   ✅ Updated {backend_config}")
        
        # Update frontend configuration
        frontend_next_config = self.project_root / "frontend" / "next.config.js"
        if frontend_next_config.exists():
            content = frontend_next_config.read_text()
            
            # Ensure production optimizations are enabled
            if 'swcMinify: true' not in content:
                # Add production optimizations
                optimizations = '''
  // Production optimizations
  swcMinify: true,
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
'''
                
                # Insert before the closing brace
                content = content.replace('};', f'{optimizations}}};')
                frontend_next_config.write_text(content)
                self.files_modified.append(str(frontend_next_config))
                print(f"   ✅ Updated {frontend_next_config}")
    
    def clean_development_files(self, files_to_remove: List[str], dry_run: bool = True):
        """Remove development files"""
        print(f"🧹 {'[DRY RUN] ' if dry_run else ''}Cleaning development files...")
        
        removed_count = 0
        for file_path in files_to_remove:
            if dry_run:
                print(f"   📄 Would remove: {file_path}")
            else:
                try:
                    path = Path(file_path)
                    if path.is_file():
                        path.unlink()
                        removed_count += 1
                        print(f"   ✅ Removed file: {file_path}")
                    elif path.is_dir():
                        import shutil
                        shutil.rmtree(path)
                        removed_count += 1
                        print(f"   ✅ Removed directory: {file_path}")
                except Exception as e:
                    print(f"   ❌ Failed to remove {file_path}: {e}")
        
        if not dry_run:
            print(f"   📊 Removed {removed_count} files/directories")
    
    def generate_production_report(self) -> str:
        """Generate a production readiness report"""
        report = []
        report.append("# RareSift Production Readiness Report")
        report.append(f"Generated on: {os.popen('date').read().strip()}")
        report.append("")
        
        # Scan for issues
        debug_issues = self.scan_for_debug_statements()
        dev_deps = self.scan_for_dev_dependencies()
        hardcoded_issues = self.scan_for_hardcoded_values()
        env_issues = self.scan_for_dev_environment_checks()
        temp_files = self.scan_for_temporary_files()
        test_files = self.scan_for_test_files_in_production()
        
        # Debug statements
        report.append("## Debug Statements Found")
        if debug_issues:
            report.append(f"Found {len(debug_issues)} debug statements:")
            for file_path, line_num, line_content in debug_issues[:10]:  # Show first 10
                report.append(f"- `{file_path}:{line_num}` - `{line_content}`")
            if len(debug_issues) > 10:
                report.append(f"... and {len(debug_issues) - 10} more")
        else:
            report.append("✅ No debug statements found")
        report.append("")
        
        # Development dependencies
        report.append("## Development Dependencies")
        if dev_deps:
            for dep in dev_deps:
                report.append(f"- {dep}")
        else:
            report.append("✅ No problematic development dependencies found")
        report.append("")
        
        # Hardcoded values
        report.append("## Hardcoded Values")
        if hardcoded_issues:
            report.append(f"Found {len(hardcoded_issues)} potential hardcoded values:")
            for file_path, line_num, line_content in hardcoded_issues[:5]:  # Show first 5
                report.append(f"- `{file_path}:{line_num}` - `{line_content}`")
            if len(hardcoded_issues) > 5:
                report.append(f"... and {len(hardcoded_issues) - 5} more")
        else:
            report.append("✅ No problematic hardcoded values found")
        report.append("")
        
        # Environment settings
        report.append("## Development Environment Settings")
        if env_issues:
            for file_path, line_num, line_content in env_issues:
                report.append(f"- `{file_path}:{line_num}` - `{line_content}`")
        else:
            report.append("✅ No development environment settings found")
        report.append("")
        
        # Temporary files
        report.append("## Temporary Files")
        if temp_files:
            report.append(f"Found {len(temp_files)} temporary files/directories:")
            for temp_file in temp_files[:10]:  # Show first 10
                report.append(f"- `{temp_file}`")
            if len(temp_files) > 10:
                report.append(f"... and {len(temp_files) - 10} more")
        else:
            report.append("✅ No temporary files found")
        report.append("")
        
        # Test files
        report.append("## Test Files")
        if test_files:
            report.append(f"Found {len(test_files)} test files:")
            for test_file in test_files[:5]:  # Show first 5
                report.append(f"- `{test_file}`")
            if len(test_files) > 5:
                report.append(f"... and {len(test_files) - 5} more")
        else:
            report.append("✅ No test files found in production paths")
        report.append("")
        
        # Summary
        total_issues = len(debug_issues) + len(dev_deps) + len(hardcoded_issues) + len(env_issues)
        report.append("## Summary")
        if total_issues == 0:
            report.append("🎉 **READY FOR PRODUCTION** - No critical issues found!")
        else:
            report.append(f"⚠️ **{total_issues} issues found** that should be addressed before production deployment")
        
        report.append("")
        report.append("## Recommendations")
        if debug_issues:
            report.append("1. Remove or comment out debug statements")
        if dev_deps:
            report.append("2. Move development dependencies to devDependencies section")
        if hardcoded_issues:
            report.append("3. Replace hardcoded values with environment variables")
        if env_issues:
            report.append("4. Update environment settings to production defaults")
        if temp_files:
            report.append("5. Clean up temporary files and cache directories")
        if test_files:
            report.append("6. Exclude test files from production builds")
        
        return "\n".join(report)
    
    def run_cleanup(self, dry_run: bool = True, clean_temp: bool = False):
        """Run the complete production cleanup process"""
        print("🚀 RareSift Production Cleanup")
        print("=" * 40)
        print(f"Mode: {'DRY RUN' if dry_run else 'LIVE CLEANUP'}")
        print("")
        
        # Generate and save report
        report = self.generate_production_report()
        report_file = self.project_root / "production-readiness-report.md"
        report_file.write_text(report)
        print(f"📋 Production readiness report saved: {report_file}")
        print("")
        
        # Create production configurations
        self.create_production_config()
        print("")
        
        # Clean temporary files if requested
        if clean_temp:
            temp_files = self.scan_for_temporary_files()
            if temp_files:
                self.clean_development_files(temp_files, dry_run)
            print("")
        
        # Summary
        print("📊 Cleanup Summary:")
        if self.files_modified:
            print(f"   ✅ Modified {len(self.files_modified)} configuration files")
        if clean_temp:
            temp_files = self.scan_for_temporary_files()
            print(f"   🗑️ {'Would clean' if dry_run else 'Cleaned'} {len(temp_files)} temporary files")
        
        print("")
        print("💡 Next steps:")
        print("   1. Review the production readiness report")
        print("   2. Address any critical issues found")
        print("   3. Run with --live to apply changes")
        print("   4. Test the application after cleanup")
        print("   5. Deploy to production environment")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="RareSift Production Cleanup Tool")
    parser.add_argument("--live", action="store_true", help="Apply changes (default is dry run)")
    parser.add_argument("--clean-temp", action="store_true", help="Clean temporary files")
    parser.add_argument("--report-only", action="store_true", help="Only generate report")
    
    args = parser.parse_args()
    
    cleanup = ProductionCleanup()
    
    if args.report_only:
        report = cleanup.generate_production_report()
        print(report)
    else:
        cleanup.run_cleanup(
            dry_run=not args.live,
            clean_temp=args.clean_temp
        )

if __name__ == "__main__":
    main()