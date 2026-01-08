/**
 * API Configuration
 * Centralized API URL configuration for the entire frontend
 */

// Backend API base URL
// Priority: env variable > production Render URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
                            'https://ratemyprof-backend.onrender.com/v1';

// API base without /v1 suffix for endpoints that don't use it
export const API_BASE = API_BASE_URL.replaceAll('/v1', '');

// Legacy API paths (without /v1 prefix)
export const API_LEGACY_BASE = API_BASE + '/api';
