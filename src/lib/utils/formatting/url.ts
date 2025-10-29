/**
 * URL Formatting Utilities
 * Functions for formatting and manipulating URLs consistently
 */

/**
 * Ensure URL has protocol (defaults to https://)
 * 
 * @param url - URL to format
 * @param defaultProtocol - Default protocol to add (default: 'https://')
 * @returns URL with protocol
 */
export function ensureProtocol(url: string, defaultProtocol: string = 'https://'): string {
  if (!url || typeof url !== 'string') return '';
  
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  return defaultProtocol + trimmedUrl;
}

/**
 * Remove protocol from URL
 * 
 * @param url - URL to format
 * @returns URL without protocol
 */
export function removeProtocol(url: string): string {
  if (!url || typeof url !== 'string') return '';
  return url.replace(/^https?:\/\//, '');
}

/**
 * Extract domain from URL
 * 
 * @param url - URL to extract domain from
 * @returns Domain name or empty string if invalid
 */
export function extractDomain(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(ensureProtocol(url));
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * Build URL with query parameters
 * 
 * @param baseUrl - Base URL
 * @param params - Query parameters object
 * @returns URL with query parameters
 */
export function buildUrlWithParams(baseUrl: string, params: Record<string, any>): string {
  if (!baseUrl || typeof baseUrl !== 'string') return '';
  
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Parse query parameters from URL
 * 
 * @param url - URL to parse
 * @returns Object with query parameters
 */
export function parseQueryParams(url: string): Record<string, string> {
  if (!url || typeof url !== 'string') return {};
  
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  } catch {
    return {};
  }
}

/**
 * Join URL paths safely
 * 
 * @param base - Base URL or path
 * @param paths - Additional path segments
 * @returns Joined URL path
 */
export function joinUrlPaths(base: string, ...paths: string[]): string {
  if (!base || typeof base !== 'string') return '';
  
  let result = base.replace(/\/+$/, ''); // Remove trailing slashes
  
  for (const path of paths) {
    if (path && typeof path === 'string') {
      const cleanPath = path.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
      if (cleanPath) {
        result += '/' + cleanPath;
      }
    }
  }
  
  return result;
}

/**
 * Check if URL is absolute (has protocol)
 * 
 * @param url - URL to check
 * @returns True if URL is absolute, false otherwise
 */
export function isAbsoluteUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\//.test(url);
}

/**
 * Check if URL is relative
 * 
 * @param url - URL to check
 * @returns True if URL is relative, false otherwise
 */
export function isRelativeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return !isAbsoluteUrl(url) && (url.startsWith('/') || url.startsWith('./') || url.startsWith('../'));
}

/**
 * Normalize URL by removing unnecessary parts
 * 
 * @param url - URL to normalize
 * @returns Normalized URL
 */
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(ensureProtocol(url));
    
    // Remove default ports
    if ((urlObj.protocol === 'http:' && urlObj.port === '80') ||
        (urlObj.protocol === 'https:' && urlObj.port === '443')) {
      urlObj.port = '';
    }
    
    // Remove trailing slash from pathname (except for root)
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Create a safe filename from URL
 * 
 * @param url - URL to convert
 * @returns Safe filename string
 */
export function urlToFilename(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  const domain = extractDomain(url);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  
  return `${domain || 'unknown'}-${timestamp}`.replace(/[^a-zA-Z0-9\-]/g, '');
}