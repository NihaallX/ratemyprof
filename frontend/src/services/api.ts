/**
 * API client service for RateMyProf backend
 * Handles all HTTP requests to our FastAPI backend
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types based on our backend API responses
export interface Professor {
  id: string;
  name: string;
  department: string;
  college_id: string;
  average_rating: number;
  total_reviews: number;
  designation?: string;
  subjects: string[];
}

export interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  college_type: string;
  established_year?: number;
  average_rating: number;
  total_reviews: number;
}

export interface CollegeDetail {
  id: string;
  name: string;
  city: string;
  state: string;
  college_type: string;
  established_year?: number;
  website?: string;
  total_professors: number;
  email_domain?: string;
  average_rating: number;
  total_reviews: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProfessorsResponse {
  professors: Professor[];
  total: number;
  has_more: boolean;
}

export interface CollegesResponse {
  colleges: College[];
  total: number;
  has_more: boolean;
}

// Search Parameters
export interface SearchProfessorsParams {
  q?: string;
  college_id?: string;
  department?: string;
  limit?: number;
}

export interface SearchCollegesParams {
  q?: string;
  state?: string;
  city?: string;
  college_type?: string;
  limit?: number;
}

/**
 * API client class with all our working endpoints
 */
export class RateMyProfAPI {
  
  /**
   * Search professors by name, college, or department
   */
  static async searchProfessors(params: SearchProfessorsParams = {}): Promise<ProfessorsResponse> {
    try {
      const response = await apiClient.get('/professors', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching professors:', error);
      throw error;
    }
  }

  /**
   * Get a specific professor by ID
   */
  static async getProfessor(id: string): Promise<Professor> {
    try {
      const response = await apiClient.get(`/professors/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching professor:', error);
      throw error;
    }
  }

  /**
   * Search colleges by name, location, or type
   */
  static async searchColleges(params: SearchCollegesParams = {}): Promise<CollegesResponse> {
    try {
      const response = await apiClient.get('/colleges', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching colleges:', error);
      throw error;
    }
  }

  /**
   * Get a specific college by ID
   */
  static async getCollege(id: string): Promise<CollegeDetail> {
    try {
      const response = await apiClient.get(`/colleges/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching college:', error);
      throw error;
    }
  }
}

export default RateMyProfAPI;