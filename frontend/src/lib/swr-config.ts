/**
 * SWR Configuration
 * Global settings for stale-while-revalidate caching
 * Provides instant page loads with background data refresh
 */

import { SWRConfiguration } from 'swr';
import { API_BASE_URL } from '../config/api';

/**
 * Default fetcher function for SWR
 * Handles API requests with proper error handling
 */
export const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object
    (error as any).info = await response.json().catch(() => ({}));
    (error as any).status = response.status;
    throw error;
  }
  
  return response.json();
};

/**
 * Global SWR configuration
 * Used across all SWR hooks for consistent behavior
 */
export const swrConfig: SWRConfiguration = {
  fetcher,
  // Disable revalidate on focus to prevent unnecessary refetches when switching tabs
  revalidateOnFocus: false,
  // Revalidate when network reconnects
  revalidateOnReconnect: true,
  // Dedupe requests within 2 seconds
  dedupingInterval: 2000,
  // Keep data fresh - revalidate every 5 minutes in background
  focusThrottleInterval: 300000,
  // Retry on error with exponential backoff
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  // Load initial data from cache if available
  revalidateIfStale: true,
  // Always show cached data first for instant loads
  suspense: false,
};

/**
 * Build API URL helper
 */
export const buildApiUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`;
};

/**
 * SWR key generators for consistent cache keys
 */
export const swrKeys = {
  professor: (id: string) => buildApiUrl(`/professors/${id}`),
  professorReviews: (id: string) => buildApiUrl(`/professors/${id}/reviews`),
  college: (id: string) => buildApiUrl(`/colleges/${id}`),
  collegeProfessors: (id: string, limit: number = 200) => 
    buildApiUrl(`/professors?college_id=${id}&limit=${limit}`),
  collegeReviews: (id: string) => buildApiUrl(`/colleges/${id}/reviews`),
  searchProfessors: (query: string, limit: number = 10) => 
    buildApiUrl(`/professors/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  searchColleges: (query: string, limit: number = 10) => 
    buildApiUrl(`/colleges/search?q=${encodeURIComponent(query)}&limit=${limit}`),
};
