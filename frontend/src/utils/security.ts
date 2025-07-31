/**
 * Security utilities for frontend XSS prevention
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes HTML tags and escapes special characters
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  
  // Convert to string and remove HTML tags
  const cleanInput = String(input).replace(/<[^>]*>/g, '');
  
  // Escape special characters
  return cleanInput
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize URLs to prevent javascript: and data: schemes
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  const cleanUrl = String(url).trim();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  const lowerUrl = cleanUrl.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn('Blocked potentially dangerous URL:', cleanUrl);
      return '';
    }
  }
  
  // Only allow http, https, and relative URLs
  if (cleanUrl.startsWith('//') || 
      cleanUrl.startsWith('http://') || 
      cleanUrl.startsWith('https://') ||
      cleanUrl.startsWith('/') ||
      !cleanUrl.includes(':')) {
    return cleanUrl;
  }
  
  console.warn('Blocked URL with unknown protocol:', cleanUrl);
  return '';
}

/**
 * Sanitize file names for display
 */
export function sanitizeFileName(fileName: string | null | undefined): string {
  if (!fileName) return 'Unknown';
  
  // Remove path separators and dangerous characters
  return String(fileName)
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/^[.-]/, '_') // Don't start with . or -
    .substring(0, 255); // Limit length
}

/**
 * Validate and sanitize search queries
 */
export function sanitizeSearchQuery(query: string | null | undefined): string {
  if (!query) return '';
  
  const cleanQuery = String(query)
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
    .trim();
  
  // Limit length
  return cleanQuery.substring(0, 500);
}

/**
 * Generate safe API URLs
 */
export function getSafeApiUrl(endpoint: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Validate base URL
  if (!baseUrl.match(/^https?:\/\//)) {
    console.error('Invalid API URL:', baseUrl);
    return 'http://localhost:8000';
  }
  
  // Ensure endpoint starts with /
  const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}${safeEndpoint}`;
}

/**
 * Create safe image URLs with validation
 */
export function getSafeImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '';
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const safePath = sanitizeUrl(imagePath);
  
  if (!safePath) return '';
  
  // If it's already a full URL, validate it
  if (safePath.startsWith('http')) {
    return sanitizeUrl(safePath);
  }
  
  // If it's a relative path, make it absolute
  const cleanPath = safePath.startsWith('/') ? safePath : `/${safePath}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Safe console logging that prevents XSS in development tools
 */
export function safeLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(sanitizeInput(message), data);
  }
}

/**
 * Validate numeric input to prevent injection
 */
export function sanitizeNumeric(value: any, min?: number, max?: number): number {
  const num = Number(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  
  return num;
}