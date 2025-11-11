/**
 * Homepage - RateMyProf India Landing Page
 * Enhanced search interface with auto-suggestions and top-rated results
 */

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Star, Search, ChevronDown, MapPin, Award, Users, Calendar, Menu, X } from 'lucide-react';
import { RateMyProfAPI, Professor, College } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CompareColleges from '../components/CompareColleges';
import UserDropdown from '../components/UserDropdown';
import NotificationInbox from '../components/NotificationInbox';
import RequestCollegeForm from '../components/RequestCollegeForm';
import Footer from '../components/Footer';
import DarkModeToggle from '../components/DarkModeToggle';
import dynamic from 'next/dynamic';

// Dynamically import landing page (with 3D components) to reduce initial bundle size
const LandingPage = dynamic(() => import('./landing'), { ssr: false });

interface SearchSuggestion {
  id: string;
  type: 'professor' | 'college';
  name: string;
  college?: string;
  department?: string;
  city?: string;
  state?: string;
  rating?: number;
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  
  // Check if user explicitly wants to browse the app (coming from landing page "Get Started")
  const [wantsToBrowse, setWantsToBrowse] = useState(false);
  
  useEffect(() => {
    // Check if user clicked "Get Started" from landing page
    const fromLanding = sessionStorage.getItem('browse_app');
    if (fromLanding === 'true') {
      setWantsToBrowse(true);
      sessionStorage.removeItem('browse_app'); // Clear flag
    }
  }, []);
  
  // Show landing page ONLY if:
  // 1. Not authenticated AND
  // 2. User hasn't explicitly clicked "Get Started" to browse
  if (!authLoading && !user && !wantsToBrowse) {
    return <LandingPage />;
  }
  
  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }
  
  // Show main app for:
  // 1. Authenticated users, OR
  // 2. Unauthenticated users who clicked "Get Started" (browse mode)
  return <AuthenticatedHomePage />;
}

function AuthenticatedHomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'professors' | 'colleges'>('professors');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [topRatedProfessors, setTopRatedProfessors] = useState<Professor[]>([]);
  const [topRatedColleges, setTopRatedColleges] = useState<College[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRequestCollegeForm, setShowRequestCollegeForm] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { user, signOut } = useAuth();

  // Helper function to get teaching style tags based on rating
  const getTeachingTags = (rating: number) => {
    if (rating >= 4.5) return ['Excellent', 'Clear', 'Helpful'];
    if (rating >= 4.0) return ['Great', 'Engaging', 'Supportive'];
    if (rating >= 3.5) return ['Good', 'Knowledgeable', 'Fair'];
    if (rating >= 3.0) return ['Decent', 'Experienced', 'Available'];
    return ['Average', 'Improving'];
  };

  // Helper function to get rating color based on value
  const getRatingColor = (rating: number) => {
    if (rating >= 4.0) return 'from-emerald-400 to-emerald-500'; // Green for 4.0+
    if (rating >= 3.0) return 'from-yellow-400 to-yellow-500';   // Yellow for 3.0-3.9
    return 'from-red-400 to-red-500';                             // Red for below 3.0
  };

  // Load top-rated content on component mount
  useEffect(() => {
    loadTopRated();
  }, []);

  // Debounced search suggestions - faster response for better UX
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 1) { // Show suggestions after just 1 character
        fetchSuggestions();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200); // Reduced from 300ms to 200ms for faster response

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchType]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTopRated = async () => {
    try {
      // Load top-rated professors - use the new endpoint with proper sorting
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';
      console.log('Fetching top-rated from:', `${apiUrl}/professors/top-rated?limit=6`);
      
      const profResponse = await fetch(`${apiUrl}/professors/top-rated?limit=6`, {
        // Add cache busting to ensure we get latest data
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (profResponse.ok) {
        const profData = await profResponse.json();
        console.log('Top-rated professors from backend:', profData);
        
        // The backend returns array directly, map to our format
        const formattedProfs = profData.map((p: any) => ({
          id: p.id,
          name: p.name,
          department: p.department,
          college_id: p.college_id,
          average_rating: p.rating,
          total_reviews: p.reviews,
        }));
        
        console.log('Formatted professors:', formattedProfs);
        setTopRatedProfessors(formattedProfs);
      } else {
        console.warn('Top-rated endpoint failed, using fallback');
        // Fallback to old method if endpoint fails
        const profResponse = await RateMyProfAPI.searchProfessors({ limit: 50 });
        const sortedProfs = profResponse.professors
          .filter(p => p.average_rating > 0 && p.total_reviews > 0)
          .sort((a, b) => {
            // Sort by review count first, then rating
            if (b.total_reviews !== a.total_reviews) {
              return b.total_reviews - a.total_reviews;
            }
            return b.average_rating - a.average_rating;
          });
        setTopRatedProfessors(sortedProfs.slice(0, 6));
      }

      // Load top-rated colleges - get more than we need, then filter and sort  
      const collegeResponse = await RateMyProfAPI.searchColleges({ limit: 50 });
      const sortedColleges = collegeResponse.colleges
        .filter(c => c.average_rating > 0 && c.total_reviews > 0)
        .sort((a, b) => {
          // Sort by review count first, then rating
          if (b.total_reviews !== a.total_reviews) {
            return b.total_reviews - a.total_reviews;
          }
          return b.average_rating - a.average_rating;
        });
      setTopRatedColleges(sortedColleges.slice(0, 6));
    } catch (error) {
      console.error('Failed to load top-rated content:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      if (searchType === 'professors') {
        const response = await RateMyProfAPI.searchProfessors({ 
          q: searchQuery,
          limit: 8 // Show top 8 suggestions for better UX
        });
        
        const suggestions: SearchSuggestion[] = response.professors.map(prof => ({
          id: prof.id,
          type: 'professor',
          name: prof.name,
          department: prof.department,
          college: 'Vishwakarma University', // You can fetch this from college_id if needed
          rating: prof.average_rating
        }));
        
        setSuggestions(suggestions);
      } else {
        const response = await RateMyProfAPI.searchColleges({ 
          q: searchQuery,
          limit: 8
        });
        
        const suggestions: SearchSuggestion[] = response.colleges.map(college => ({
          id: college.id,
          type: 'college',
          name: college.name,
          city: college.city,
          state: college.state,
          rating: college.average_rating
        }));
        
        setSuggestions(suggestions);
      }
      
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setShowSuggestions(false);
    
    // Clear both immediately to prevent race condition
    setProfessors([]);
    setColleges([]);
    
    try {
      if (searchType === 'professors') {
        const response = await RateMyProfAPI.searchProfessors({ 
          q: searchQuery,
          limit: 50 
        });
        
        // Sort by rating (top-rated first), then by number of reviews
        const sortedProfessors = response.professors
          .filter((prof, index, self) => 
            index === self.findIndex(p => p.name === prof.name && p.department === prof.department)
          )
          .sort((a, b) => {
            // First sort by rating (descending)
            if (b.average_rating !== a.average_rating) {
              return b.average_rating - a.average_rating;
            }
            // Then by number of reviews (descending)
            return b.total_reviews - a.total_reviews;
          });
        
        setProfessors(sortedProfessors);
      } else {
        const response = await RateMyProfAPI.searchColleges({ 
          q: searchQuery,
          limit: 50 
        });
        
        // Sort colleges by rating first
        const sortedColleges = response.colleges
          .sort((a, b) => {
            if (b.average_rating !== a.average_rating) {
              return b.average_rating - a.average_rating;
            }
            return b.total_reviews - a.total_reviews;
          });
        
        setColleges(sortedColleges);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllColleges = async () => {
    setLoading(true);
    // Clear professors immediately to prevent showing wrong data
    setProfessors([]);
    
    try {
      const response = await RateMyProfAPI.searchColleges({ 
        q: '', 
        limit: 50 
      });
      
      // Sort colleges by rating
      const sortedColleges = response.colleges
        .sort((a, b) => {
          if (b.average_rating !== a.average_rating) {
            return b.average_rating - a.average_rating;
          }
          return b.total_reviews - a.total_reviews;
        });
      
      setColleges(sortedColleges);
    } catch (error) {
      console.error('Failed to load colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTypeChange = (type: 'professors' | 'colleges') => {
    setSearchType(type);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Immediately clear both professors and colleges to prevent showing wrong data
    setProfessors([]);
    setColleges([]);
    
    // Only load colleges data when switching to colleges tab
    if (type === 'colleges') {
      loadAllColleges();
    }
    // When switching to professors tab, just clear everything (no auto-load)
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    } else if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Navigate to the selected item
    if (suggestion.type === 'professor') {
      window.location.href = `/professors/${suggestion.id}`;
    } else {
      window.location.href = `/colleges/${suggestion.id}`;
    }
  };

  const highlightSearchTerm = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    // Case-insensitive matching with partial keyword support
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-200 font-semibold text-gray-900 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex">
        {[0, 1, 2, 3, 4].map((index) => {
          if (index < fullStars) {
            return <Star key={index} className="w-4 h-4 text-yellow-400 fill-current" />;
          } else if (index === fullStars && hasHalfStar) {
            return <Star key={index} className="w-4 h-4 text-yellow-400 fill-current opacity-50" />;
          } else {
            return <Star key={index} className="w-4 h-4 text-gray-300" />;
          }
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Head>
        <title>RateMyProf India - Find & Rate Your Professors</title>
        <meta name="description" content="Discover and rate professors at Indian colleges and universities" />
      </Head>

      {/* Sign In Banner - Only show when not logged in */}
      {!user && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm sm:text-base font-medium text-center sm:text-left">
              Sign in to rate and review professors and colleges
            </p>
            <button
              onClick={() => window.location.href = '/landing'}
              className="px-5 py-2 bg-white text-indigo-600 rounded-md font-medium text-sm hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Go back to landing page
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl sm:text-3xl font-logo text-indigo-600 dark:text-indigo-400" style={{ letterSpacing: '0.02em' }}>
                RateMyProf
              </h1>
              <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-sans">Beta</span>
            </div>

            {/* Desktop Navigation - Always visible on desktop */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Navigation Links - Only for logged in users */}
              {user ? (
                <>
                  <Link
                    href="/professors/add"
                    className="text-sm text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#4e46e5' }}
                  >
                    Add Professor
                  </Link>
                  {user.email?.endsWith('@ratemyprof.in') && (
                    <Link
                      href="/admin"
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                    >
                      Admin
                    </Link>
                  )}
                  {/* Dark Mode Toggle */}
                  <DarkModeToggle />
                  {/* Notification Inbox */}
                  <NotificationInbox />
                  {/* User Dropdown for logged in users */}
                  <UserDropdown />
                </>
              ) : (
                <>
                  {/* Sign In / Sign Up buttons for non-logged users */}
                  <Link
                    href="/auth/login"
                    className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-sm text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#4e46e5' }}
                  >
                    Sign Up
                  </Link>
                  {/* Dark Mode Toggle for non-logged users too */}
                  <DarkModeToggle />
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <DarkModeToggle />
              {user && <NotificationInbox />}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
              <nav className="flex flex-col space-y-3 pt-4">
                {user ? (
                  <>
                    <Link
                      href="/professors/add"
                      className="text-sm text-white px-4 py-3 rounded-md font-medium hover:opacity-90 transition-opacity text-center"
                      style={{ backgroundColor: '#4e46e5' }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Add Professor
                    </Link>
                    
                    {user.email?.endsWith('@ratemyprof.in') && (
                      <Link
                        href="/admin"
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium px-4 py-2 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    
                    <Link
                      href="/my-reviews"
                      className="text-sm text-gray-700 hover:text-gray-900 px-4 py-2 hover:bg-gray-50 rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Reviews
                    </Link>
                    
                    <Link
                      href="/profile"
                      className="text-sm text-gray-700 hover:text-gray-900 px-4 py-2 hover:bg-gray-50 rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 px-4 py-2 hover:bg-red-50 rounded-md transition-colors text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium px-4 py-2 hover:bg-indigo-50 rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="text-sm text-white px-4 py-3 rounded-md font-medium hover:opacity-90 transition-opacity text-center"
                      style={{ backgroundColor: '#4e46e5' }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-4">
            Find Your Perfect Professor
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-4">
            Discover and rate professors at colleges across India
          </p>

          {/* Search Interface */}
          <div className="max-w-2xl mx-auto">
            
            {/* Search Type Tabs - Enhanced with smooth animation */}
            <div className="flex justify-center mb-4 sm:mb-6 px-4">
              <div className="relative bg-white dark:bg-gray-700 rounded-lg p-1 shadow-md w-full sm:w-auto">
                {/* Background slider for smooth animation */}
                <div 
                  className="absolute top-1 bottom-1 bg-indigo-600 dark:bg-indigo-500 rounded-md transition-all duration-300 ease-in-out"
                  style={{
                    left: searchType === 'professors' ? '4px' : 'calc(50% + 2px)',
                    width: 'calc(50% - 6px)'
                  }}
                />
                <button
                  onClick={() => handleSearchTypeChange('professors')}
                  className={`relative z-10 w-1/2 sm:w-auto sm:px-6 py-2 sm:py-2 rounded-md font-medium transition-colors duration-300 text-sm sm:text-base ${
                    searchType === 'professors'
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  Professors
                </button>
                <button
                  onClick={() => handleSearchTypeChange('colleges')}
                  className={`relative z-10 w-1/2 sm:w-auto sm:px-6 py-2 sm:py-2 rounded-md font-medium transition-colors duration-300 text-sm sm:text-base ${
                    searchType === 'colleges'
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  Colleges
                </button>
              </div>
            </div>

            {/* Search Box with Auto-suggestions */}
            <div className="relative max-w-2xl mx-auto px-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder={`Search for ${searchType === 'professors' ? 'professors...' : 'colleges...'}`}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 text-base sm:text-lg shadow-sm transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    autoComplete="off"
                  />
                  
                  {/* Search activity indicator */}
                  {searchQuery && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      {suggestions.length > 0 ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded hidden sm:inline">
                          {suggestions.length} results
                        </span>
                      ) : searchQuery.length >= 1 ? (
                        <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Auto-suggestions Dropdown - Enhanced */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div 
                      ref={suggestionsRef}
                      className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-72 sm:max-h-96 overflow-y-auto animate-fadeIn"
                      style={{
                        animation: 'fadeIn 0.2s ease-out'
                      }}
                    >
                      <div className="py-2">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion.type}-${suggestion.id}`}
                            className={`px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer transition-all duration-150 ${
                              index === selectedSuggestionIndex 
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-600 dark:border-indigo-400' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                            }`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectSuggestion(suggestion);
                            }}
                            onMouseEnter={() => setSelectedSuggestionIndex(index)}
                          >
                            {suggestion.type === 'professor' ? (
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {highlightSearchTerm(suggestion.name, searchQuery)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                    <span className="truncate">{suggestion.department}</span>
                                    <span className="text-gray-400 dark:text-gray-500">•</span>
                                    <span className="font-medium text-indigo-600 dark:text-indigo-400 truncate">
                                      {suggestion.college}
                                    </span>
                                  </div>
                                </div>
                                {suggestion.rating && suggestion.rating > 0 ? (
                                  <div className="flex items-center ml-3 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-md">
                                    <Star className="w-3.5 h-3.5 mr-1 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                                      {suggestion.rating.toFixed(1)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="ml-3 text-xs text-gray-400 dark:text-gray-500 italic">No rating</span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {highlightSearchTerm(suggestion.name, searchQuery)}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">
                                      {suggestion.city}, {suggestion.state}
                                    </span>
                                  </div>
                                </div>
                                {suggestion.rating && suggestion.rating > 0 ? (
                                  <div className="flex items-center ml-3 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-md">
                                    <Star className="w-3.5 h-3.5 mr-1 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                                      {suggestion.rating.toFixed(1)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="ml-3 text-xs text-gray-400 dark:text-gray-500 italic">No rating</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Footer hint */}
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Press ↑↓ to navigate, ⏎ to select, Esc to close</span>
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">
                            {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* No results message */}
                  {showSuggestions && suggestions.length === 0 && searchQuery.length >= 1 && (
                    <div 
                      ref={suggestionsRef}
                      className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 animate-fadeIn"
                    >
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <Search className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                        <p className="text-sm font-medium">No {searchType} found</p>
                        <p className="text-xs mt-1">Try a different search term</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-8 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Searching...
                    </div>
                  ) : 'Search'}
                </button>
              </div>
              
              {/* Loading indicator under search bar */}
              {loading && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-indigo-600">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">
                      {searchType === 'professors' ? 'Finding professors...' : 'Loading colleges...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Request Your College CTA Banner - Always visible when not searching */}
        {!searchQuery && (
          <div className="mt-16 mb-10">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                      Can't find your college?
                    </h3>
                    <p className="text-sm text-indigo-100">
                      Request it and we'll prioritize adding it to the platform
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRequestCollegeForm(true)}
                    className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-indigo-600 bg-white rounded-lg hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Request College
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Rated Section (when no search is active) */}
        {!searchQuery && (
          <div>
            {/* Top Rated Professors - Only show when Professors tab is active */}
            {searchType === 'professors' && topRatedProfessors.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Award className="w-6 h-6 mr-2 text-yellow-500" />
                    Top Rated Professors
                  </h3>
                </div>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {topRatedProfessors.map((professor, index) => (
                    <Link
                      key={professor.id}
                      href={`/professors/${professor.id}`}
                      prefetch={true}
                      className={`block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl dark:hover:shadow-indigo-500/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group animate-scaleIn stagger-${Math.min(index + 1, 6)}`}
                    >
                      <div className="flex h-full">
                        {/* Left Side - Quality Rating */}
                        <div className={`w-20 sm:w-24 bg-gradient-to-br ${getRatingColor(professor.average_rating)} flex flex-col items-center justify-center text-white p-3 sm:p-4 flex-shrink-0`}>
                          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1">Quality</div>
                          <div className="text-2xl sm:text-3xl font-bold leading-none mb-1">
                            {professor.average_rating.toFixed(1)}
                          </div>
                          <div className="text-[10px] sm:text-xs opacity-90">/5.0</div>
                        </div>

                        {/* Right Side - Professor Info */}
                        <div className="flex-1 p-3 sm:p-4 flex flex-col min-w-0">
                          <div className="flex-1">
                            <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                              {professor.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                              {professor.department}
                            </p>
                            {/* Teaching Style Tags */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {getTeachingTags(professor.average_rating).map((tag, idx) => (
                                <span 
                                  key={idx}
                                  className="text-[10px] sm:text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">{professor.total_reviews}</span> rating{professor.total_reviews !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Top Rated Colleges - Only show when Colleges tab is active */}
            {searchType === 'colleges' && topRatedColleges.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Award className="w-6 h-6 mr-2 text-yellow-500" />
                    Top Rated Colleges
                  </h3>
                </div>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {topRatedColleges.map((college, index) => (
                    <Link
                      key={college.id}
                      href={`/colleges/${college.id}`}
                      prefetch={true}
                      className={`block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl dark:hover:shadow-indigo-500/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group animate-scaleIn stagger-${Math.min(index + 1, 6)}`}
                    >
                      <div className="flex h-full">
                        {/* Left Side - Quality Rating */}
                        <div className="w-20 sm:w-24 bg-gradient-to-br from-blue-400 to-blue-500 flex flex-col items-center justify-center text-white p-3 sm:p-4 flex-shrink-0">
                          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1">Quality</div>
                          <div className="text-2xl sm:text-3xl font-bold leading-none mb-1">
                            {college.average_rating.toFixed(1)}
                          </div>
                          <div className="text-[10px] sm:text-xs opacity-90">/5.0</div>
                        </div>

                        {/* Right Side - College Info */}
                        <div className="flex-1 p-3 sm:p-4 flex flex-col min-w-0">
                          <div className="flex-1">
                            <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                              {college.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center line-clamp-1">
                              <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 flex-shrink-0" />
                              <span className="truncate">{college.city}, {college.state}</span>
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {college.college_type}
                            </p>
                          </div>
                          
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">{college.total_reviews}</span> rating{college.total_reviews !== 1 ? 's' : ''}
                            </div>
                            {college.total_reviews > 0 && (
                              <div className="text-xs text-right">
                                <span className={`font-semibold ${
                                  college.average_rating >= 4.0 ? 'text-green-600 dark:text-green-400' :
                                  college.average_rating >= 3.0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {Math.round((college.average_rating / 5) * 100)}%
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs"> would</span>
                                <br />
                                <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">recommend</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results Section */}
        {(professors.length > 0 || colleges.length > 0) && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Search className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
                {searchType === 'professors' ? 'Professors' : 'Colleges'} Found
                <span className="ml-2 text-lg text-gray-600 dark:text-gray-400">({professors.length + colleges.length})</span>
              </h3>
            </div>

            {/* Professor Results - Enhanced Grid */}
            {professors.length > 0 && (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {professors.map((professor, index) => (
                  <Link
                    key={professor.id}
                    href={`/professors/${professor.id}`}
                    prefetch={true}
                    className="block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl dark:hover:shadow-indigo-500/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group"
                  >
                    <div className="flex h-full">
                      {/* Left Side - Quality Rating */}
                      <div className={`w-20 sm:w-24 bg-gradient-to-br ${getRatingColor(professor.average_rating)} flex flex-col items-center justify-center text-white p-3 sm:p-4 relative flex-shrink-0`}>
                        {/* Top Rated Badge */}
                        {index < 3 && professor.average_rating >= 4.0 && (
                          <div className="absolute -top-1 -left-1 bg-yellow-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br">
                            TOP
                          </div>
                        )}
                        <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1">Quality</div>
                        <div className="text-2xl sm:text-3xl font-bold leading-none mb-1">
                          {professor.average_rating.toFixed(1)}
                        </div>
                        <div className="text-[10px] sm:text-xs opacity-90">/5.0</div>
                      </div>

                      {/* Right Side - Professor Info */}
                      <div className="flex-1 p-3 sm:p-4 flex flex-col min-w-0">
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                            {professor.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-1">
                            {professor.department}
                          </p>
                          {/* Teaching Style Tags */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {getTeachingTags(professor.average_rating).map((tag, idx) => (
                              <span 
                                key={idx}
                                className="text-[10px] sm:text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{professor.total_reviews}</span> rating{professor.total_reviews !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* College Results - Enhanced Grid */}
            {colleges.length > 0 && (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {colleges.map((college, index) => (
                  <Link
                    key={college.id}
                    href={`/colleges/${college.id}`}
                    prefetch={true}
                    className="block bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl dark:hover:shadow-indigo-500/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group"
                  >
                    <div className="flex h-full">
                      {/* Left Side - Quality Rating */}
                      <div className="w-20 sm:w-24 bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600 flex flex-col items-center justify-center text-white p-3 sm:p-4 relative flex-shrink-0">
                        {/* Top Rated Badge */}
                        {index < 3 && college.average_rating >= 4.0 && (
                          <div className="absolute -top-1 -left-1 bg-yellow-500 dark:bg-yellow-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br">
                            TOP
                          </div>
                        )}
                        <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1">Quality</div>
                        <div className="text-2xl sm:text-3xl font-bold leading-none mb-1">
                          {college.average_rating > 0 ? college.average_rating.toFixed(1) : 'N/A'}
                        </div>
                        {college.average_rating > 0 && (
                          <div className="text-[10px] sm:text-xs opacity-90">/5.0</div>
                        )}
                      </div>

                      {/* Right Side - College Info */}
                      <div className="flex-1 p-3 sm:p-4 flex flex-col min-w-0">
                        <div className="flex-1">
                          <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                            {college.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center line-clamp-1">
                            <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 flex-shrink-0" />
                            <span className="truncate">{college.city}, {college.state}</span>
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {college.college_type}
                          </p>
                        </div>
                        
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{college.total_reviews}</span> rating{college.total_reviews !== 1 ? 's' : ''}
                          </div>
                          {college.total_reviews > 0 && college.average_rating > 0 && (
                            <div className="text-xs text-right">
                              <span className={`font-semibold ${
                                college.average_rating >= 4.0 ? 'text-green-600 dark:text-green-400' :
                                college.average_rating >= 3.0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {Math.round((college.average_rating / 5) * 100)}%
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs"> would</span>
                              <br />
                              <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">recommend</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
      
      {/* Request College Form Modal */}
      <RequestCollegeForm 
        isOpen={showRequestCollegeForm}
        onClose={() => setShowRequestCollegeForm(false)}
      />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}