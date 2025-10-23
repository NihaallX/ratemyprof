/**
 * Homepage - RateMyProf India Landing Page
 * Enhanced search interface with auto-suggestions and top-rated results
 */

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Star, Search, ChevronDown, MapPin, Award, Users, Calendar } from 'lucide-react';
import { RateMyProfAPI, Professor, College } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import UserDropdown from '../components/UserDropdown';
import Footer from '../components/Footer';

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
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { user, signOut, loading: authLoading } = useAuth();

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
      // Load top-rated professors - get more than we need, then filter and sort
      const profResponse = await RateMyProfAPI.searchProfessors({ limit: 50 }); // Get 50 to have enough with ratings
      const sortedProfs = profResponse.professors
        .filter(p => p.average_rating > 0 && p.total_reviews > 0) // Only professors with actual reviews
        .sort((a, b) => {
          // Sort by rating first, then by number of reviews as tiebreaker
          if (b.average_rating !== a.average_rating) {
            return b.average_rating - a.average_rating;
          }
          return b.total_reviews - a.total_reviews;
        });
      setTopRatedProfessors(sortedProfs.slice(0, 6));

      // Load top-rated colleges - get more than we need, then filter and sort  
      const collegeResponse = await RateMyProfAPI.searchColleges({ limit: 50 });
      const sortedColleges = collegeResponse.colleges
        .filter(c => c.average_rating > 0 && c.total_reviews > 0)
        .sort((a, b) => {
          if (b.average_rating !== a.average_rating) {
            return b.average_rating - a.average_rating;
          }
          return b.total_reviews - a.total_reviews;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>RateMyProf India - Find & Rate Your Professors</title>
        <meta name="description" content="Discover and rate professors at Indian colleges and universities" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl font-logo text-indigo-600" style={{ letterSpacing: '0.02em' }}>
                RateMyProf
              </h1>
              <span className="ml-3 text-sm text-gray-500 font-sans">Beta</span>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-sm text-gray-600">
                Vishwakarma University Pilot
              </div>
              
              {/* Navigation Links */}
              {user && (
                <div className="flex items-center space-x-4">
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
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Admin
                    </Link>
                  )}
                </div>
              )}
              
              {/* Authentication UI */}
              {authLoading ? (
                <div className="text-sm text-gray-400">Loading...</div>
              ) : user ? (
                <UserDropdown />
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/auth/login"
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect Professor
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Search and discover professors at Vishwakarma University
          </p>

          {/* Search Interface */}
          <div className="max-w-2xl mx-auto">
            
            {/* Search Type Tabs - Enhanced with smooth animation */}
            <div className="flex justify-center mb-6">
              <div className="relative bg-white rounded-lg p-1 shadow-md">
                {/* Background slider for smooth animation */}
                <div 
                  className="absolute top-1 bottom-1 bg-indigo-600 rounded-md transition-all duration-300 ease-in-out"
                  style={{
                    left: searchType === 'professors' ? '4px' : 'calc(50% + 2px)',
                    width: 'calc(50% - 6px)'
                  }}
                />
                <button
                  onClick={() => handleSearchTypeChange('professors')}
                  className={`relative z-10 px-6 py-2 rounded-md font-medium transition-colors duration-300 ${
                    searchType === 'professors'
                      ? 'text-white'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Professors
                </button>
                <button
                  onClick={() => handleSearchTypeChange('colleges')}
                  className={`relative z-10 px-6 py-2 rounded-md font-medium transition-colors duration-300 ${
                    searchType === 'colleges'
                      ? 'text-white'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Colleges
                </button>
              </div>
            </div>

            {/* Search Box with Auto-suggestions */}
            <div className="relative max-w-2xl mx-auto">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
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
                    placeholder={`Search for ${searchType === 'professors' ? 'professors by name, department...' : 'colleges by name, city...'}`}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg shadow-sm transition-all duration-200"
                    autoComplete="off"
                  />
                  
                  {/* Search activity indicator */}
                  {searchQuery && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                      {suggestions.length > 0 ? (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {suggestions.length} results
                        </span>
                      ) : searchQuery.length >= 1 ? (
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Auto-suggestions Dropdown - Enhanced */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div 
                      ref={suggestionsRef}
                      className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-96 overflow-y-auto animate-fadeIn"
                      style={{
                        animation: 'fadeIn 0.2s ease-out'
                      }}
                    >
                      <div className="py-2">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion.type}-${suggestion.id}`}
                            className={`px-4 py-3 cursor-pointer transition-all duration-150 ${
                              index === selectedSuggestionIndex 
                                ? 'bg-indigo-50 border-l-4 border-indigo-600' 
                                : 'hover:bg-gray-50 border-l-4 border-transparent'
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
                                  <div className="text-sm font-semibold text-gray-900 truncate">
                                    {highlightSearchTerm(suggestion.name, searchQuery)}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                                    <span className="truncate">{suggestion.department}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="font-medium text-indigo-600 truncate">
                                      {suggestion.college}
                                    </span>
                                  </div>
                                </div>
                                {suggestion.rating && suggestion.rating > 0 ? (
                                  <div className="flex items-center ml-3 bg-yellow-50 px-2 py-1 rounded-md">
                                    <Star className="w-3.5 h-3.5 mr-1 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-semibold text-yellow-700">
                                      {suggestion.rating.toFixed(1)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="ml-3 text-xs text-gray-400 italic">No rating</span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate">
                                    {highlightSearchTerm(suggestion.name, searchQuery)}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-0.5 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">
                                      {suggestion.city}, {suggestion.state}
                                    </span>
                                  </div>
                                </div>
                                {suggestion.rating && suggestion.rating > 0 ? (
                                  <div className="flex items-center ml-3 bg-yellow-50 px-2 py-1 rounded-md">
                                    <Star className="w-3.5 h-3.5 mr-1 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-semibold text-yellow-700">
                                      {suggestion.rating.toFixed(1)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="ml-3 text-xs text-gray-400 italic">No rating</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Footer hint */}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Press ↑↓ to navigate, ⏎ to select, Esc to close</span>
                          <span className="font-medium text-indigo-600">
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
                      className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-fadeIn"
                    >
                      <div className="text-center text-gray-500">
                        <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium">No {searchType} found</p>
                        <p className="text-xs mt-1">Try a different search term</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-md hover:shadow-lg"
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

        {/* Top Rated Section (when no search is active) */}
        {!searchQuery && professors.length === 0 && colleges.length === 0 && (
          <div className="mt-16">
            {/* Top Rated Professors - Only show when Professors tab is active */}
            {searchType === 'professors' && topRatedProfessors.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Award className="w-6 h-6 mr-2 text-yellow-500" />
                    Top Rated Professors
                  </h3>
                  <Link 
                    href="#"
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    onClick={() => {
                      setSearchType('professors');
                      handleSearch();
                    }}
                  >
                    View All →
                  </Link>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {topRatedProfessors.map((professor) => (
                    <Link
                      key={professor.id}
                      href={`/professors/${professor.id}`}
                      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group"
                    >
                      <div className="flex h-full">
                        {/* Left Side - Quality Rating */}
                        <div className="w-24 bg-gradient-to-br from-emerald-400 to-emerald-500 flex flex-col items-center justify-center text-white p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide mb-1">Quality</div>
                          <div className="text-3xl font-bold leading-none mb-1">
                            {professor.average_rating.toFixed(1)}
                          </div>
                          <div className="text-xs opacity-90">/5.0</div>
                        </div>

                        {/* Right Side - Professor Info */}
                        <div className="flex-1 p-4 flex flex-col min-w-0">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                              {professor.name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-1 line-clamp-1">
                              {professor.department}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              Vishwakarma University
                            </p>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                            <div className="text-xs text-gray-500 whitespace-nowrap">
                              <span className="font-semibold text-gray-700">{professor.total_reviews}</span> rating{professor.total_reviews !== 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-right">
                              <span className={`font-semibold ${
                                professor.average_rating >= 4.0 ? 'text-emerald-600' :
                                professor.average_rating >= 3.0 ? 'text-yellow-600' : 'text-gray-600'
                              }`}>
                                {professor.average_rating >= 4.0 ? '82%' : 
                                 professor.average_rating >= 3.0 ? '65%' : '50%'}
                              </span>
                              <span className="text-gray-500"> would</span>
                              <br />
                              <span className="text-gray-500">take again</span>
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
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Award className="w-6 h-6 mr-2 text-yellow-500" />
                    Top Rated Colleges
                  </h3>
                  <Link 
                    href="#"
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    onClick={() => {
                      setSearchType('colleges');
                      loadAllColleges();
                    }}
                  >
                    View All →
                  </Link>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {topRatedColleges.map((college) => (
                    <Link
                      key={college.id}
                      href={`/colleges/${college.id}`}
                      className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group"
                    >
                      <div className="flex h-full">
                        {/* Left Side - Quality Rating */}
                        <div className="w-24 bg-gradient-to-br from-blue-400 to-blue-500 flex flex-col items-center justify-center text-white p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide mb-1">Quality</div>
                          <div className="text-3xl font-bold leading-none mb-1">
                            {college.average_rating.toFixed(1)}
                          </div>
                          <div className="text-xs opacity-90">/5.0</div>
                        </div>

                        {/* Right Side - College Info */}
                        <div className="flex-1 p-4 flex flex-col min-w-0">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                              {college.name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-1 flex items-center line-clamp-1">
                              <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                              <span className="truncate">{college.city}, {college.state}</span>
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {college.college_type}
                            </p>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                            <div className="text-xs text-gray-500 whitespace-nowrap">
                              <span className="font-semibold text-gray-700">{college.total_reviews}</span> rating{college.total_reviews !== 1 ? 's' : ''}
                            </div>
                            {college.established_year && (
                              <div className="text-xs text-gray-500 flex items-center whitespace-nowrap">
                                <Calendar className="w-3 h-3 mr-1" />
                                Est. {college.established_year}
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
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Search className="w-6 h-6 mr-2 text-indigo-600" />
                {searchType === 'professors' ? 'Professors' : 'Colleges'} Found
                <span className="ml-2 text-lg text-gray-600">({professors.length + colleges.length})</span>
              </h3>
            </div>

            {/* Professor Results - Enhanced Grid */}
            {professors.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {professors.map((professor, index) => (
                  <Link
                    key={professor.id}
                    href={`/professors/${professor.id}`}
                    className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group"
                  >
                    <div className="flex h-full">
                      {/* Left Side - Quality Rating */}
                      <div className="w-24 bg-gradient-to-br from-emerald-400 to-emerald-500 flex flex-col items-center justify-center text-white p-4 relative">
                        {/* Top Rated Badge */}
                        {index < 3 && professor.average_rating >= 4.0 && (
                          <div className="absolute -top-1 -left-1 bg-yellow-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br">
                            TOP
                          </div>
                        )}
                        <div className="text-xs font-semibold uppercase tracking-wide mb-1">Quality</div>
                        <div className="text-3xl font-bold leading-none mb-1">
                          {professor.average_rating.toFixed(1)}
                        </div>
                        <div className="text-xs opacity-90">/5.0</div>
                      </div>

                      {/* Right Side - Professor Info */}
                      <div className="flex-1 p-4 flex flex-col min-w-0">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {professor.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-1 line-clamp-1">
                            {professor.department}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            Vishwakarma University
                          </p>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            <span className="font-semibold text-gray-700">{professor.total_reviews}</span> rating{professor.total_reviews !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-right">
                            <span className={`font-semibold ${
                              professor.average_rating >= 4.0 ? 'text-emerald-600' :
                              professor.average_rating >= 3.0 ? 'text-yellow-600' : 'text-gray-600'
                            }`}>
                              {professor.average_rating >= 4.0 ? '82%' : 
                               professor.average_rating >= 3.0 ? '65%' : '50%'}
                            </span>
                            <span className="text-gray-500"> would</span>
                            <br />
                            <span className="text-gray-500">take again</span>
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
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {colleges.map((college, index) => (
                  <Link
                    key={college.id}
                    href={`/colleges/${college.id}`}
                    className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group"
                  >
                    <div className="flex h-full">
                      {/* Left Side - Quality Rating */}
                      <div className="w-24 bg-gradient-to-br from-blue-400 to-blue-500 flex flex-col items-center justify-center text-white p-4 relative">
                        {/* Top Rated Badge */}
                        {index < 3 && college.average_rating >= 4.0 && (
                          <div className="absolute -top-1 -left-1 bg-yellow-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br">
                            TOP
                          </div>
                        )}
                        <div className="text-xs font-semibold uppercase tracking-wide mb-1">Quality</div>
                        <div className="text-3xl font-bold leading-none mb-1">
                          {college.average_rating > 0 ? college.average_rating.toFixed(1) : 'N/A'}
                        </div>
                        {college.average_rating > 0 && (
                          <div className="text-xs opacity-90">/5.0</div>
                        )}
                      </div>

                      {/* Right Side - College Info */}
                      <div className="flex-1 p-4 flex flex-col min-w-0">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {college.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-1 flex items-center line-clamp-1">
                            <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            <span className="truncate">{college.city}, {college.state}</span>
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {college.college_type}
                          </p>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            <span className="font-semibold text-gray-700">{college.total_reviews}</span> rating{college.total_reviews !== 1 ? 's' : ''}
                          </div>
                          {college.established_year && (
                            <div className="text-xs text-gray-500 flex items-center whitespace-nowrap">
                              <Calendar className="w-3 h-3 mr-1" />
                              Est. {college.established_year}
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
      
      {/* Footer */}
      <Footer />
    </div>
  );
}