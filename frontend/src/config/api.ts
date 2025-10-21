/**
 * API Configuration
 * Centralized API URL configuration for the entire frontend
 */

// Backend API base URL
// Priority: env variable > production URL > localhost fallback
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
                            (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
                              ? 'https://ratemyprof-production.up.railway.app/v1' 
                              : 'http://localhost:8000/v1');

// API base without /v1 suffix for endpoints that don't use it
export const API_BASE = API_BASE_URL.replace('/v1', '');

// Legacy API paths (without /v1 prefix)
export const API_LEGACY_BASE = API_BASE + '/api';
