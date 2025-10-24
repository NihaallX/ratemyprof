/**
 * CompareColleges Component
 * Side-by-side college comparison with rating bars
 */

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface College {
  id: string
  name: string
  city: string
  state: string
  college_type: string
  total_reviews: number
  ratings_breakdown: {
    internet: number
    safety: number
    facilities: number
    opportunities: number
    location: number
    clubs: number
    social: number
    food: number
    overall: number
  }
}

interface CompareCollegesProps {
  currentCollegeId: string
  currentCollegeName: string
  onClose: () => void
}

export default function CompareColleges({ currentCollegeId, currentCollegeName, onClose }: CompareCollegesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([currentCollegeId]);
  const [comparisonData, setComparisonData] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/colleges?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        const filtered = (data.colleges || []).filter((c: any) => 
          c.id !== currentCollegeId && !selectedColleges.includes(c.id)
        );
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedColleges]);

  const addCollege = (collegeId: string) => {
    if (selectedColleges.length >= 2) {
      alert('You can only compare with one other college');
      return;
    }
    if (!selectedColleges.includes(collegeId)) {
      setSelectedColleges([...selectedColleges, collegeId]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeCollege = (collegeId: string) => {
    if (collegeId === currentCollegeId) return;
    setSelectedColleges(selectedColleges.filter(id => id !== collegeId));
  };

  useEffect(() => {
    if (selectedColleges.length >= 2) {
      fetchComparisonData();
    } else {
      setComparisonData([]);
    }
  }, [selectedColleges]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/colleges/compare?ids=${selectedColleges.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        setComparisonData(data.colleges);
      } else {
        console.error('Compare API error:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch comparison data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRatingBg = (rating: number) => {
    if (rating >= 4.0) return 'bg-green-500';
    if (rating >= 3.0) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.0) return 'text-green-600';
    if (rating >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Compare Schools</h2>
      </div>

      {/* Search Section */}
      {comparisonData.length < 2 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search for a College to Compare With
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for colleges..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={selectedColleges.length >= 2}
            />
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 bg-white border-2 border-indigo-200 rounded-lg shadow-xl max-h-60 overflow-auto z-10">
              {searchResults.map((college) => (
                <button
                  key={college.id}
                  onClick={() => addCollege(college.id)}
                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{college.name}</div>
                      <div className="text-sm text-gray-600">{college.city}, {college.state}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <div className="mt-2 text-sm text-indigo-600 font-medium">🔍 Searching...</div>
          )}

          {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
            <div className="mt-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
              No colleges found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      )}

      {/* Selected Colleges Tags */}
      {comparisonData.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {comparisonData.map((college) => (
              <div
                key={college.id}
                className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
              >
                <span>{college.name}</span>
                {college.id !== currentCollegeId && (
                  <button
                    onClick={() => removeCollege(college.id)}
                    className="hover:text-indigo-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Display */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading comparison...</p>
        </div>
      ) : comparisonData.length >= 2 ? (
        <div className="space-y-6">
          {/* College Cards Side by Side */}
          <div className="grid grid-cols-2 gap-6">
            {comparisonData.map((college) => (
              <div key={college.id} className="bg-gray-50 rounded-lg p-6 text-center">
                {/* Overall Rating Badge */}
                {college.ratings_breakdown.overall > 0 ? (
                  <div className={`inline-flex items-center px-6 py-3 rounded-full font-bold text-2xl mb-4 text-white ${getRatingBg(college.ratings_breakdown.overall)}`}>
                    {college.ratings_breakdown.overall.toFixed(1)}
                  </div>
                ) : (
                  <div className="inline-flex items-center px-6 py-3 rounded-full font-bold text-2xl mb-4 bg-gray-300 text-gray-700">
                    N/A
                  </div>
                )}
                <div className="text-xs text-gray-500 mb-3">OVERALL</div>
                <h3 className="text-xl font-bold text-gray-900">{college.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{college.city}, {college.state}</p>
                <p className="text-xs text-gray-500 mt-2">{college.total_reviews} Rating{college.total_reviews !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>

          {/* Comparison Metrics - College specific */}
          <div className="bg-white rounded-lg p-6 space-y-4">
            {/* Internet */}
            {comparisonData.map((college, index) => (
              <div key={`internet-${college.id}`}>
                {index === 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-700">Internet:</div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getRatingBg(college.ratings_breakdown.internet)}`}
                        style={{ width: `${(college.ratings_breakdown.internet / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 ${getRatingColor(college.ratings_breakdown.internet)}`}>
                      {college.ratings_breakdown.internet > 0 ? college.ratings_breakdown.internet.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-32 text-right truncate">{college.name}</span>
                </div>
              </div>
            ))}

            {/* Safety */}
            {comparisonData.map((college, index) => (
              <div key={`safety-${college.id}`}>
                {index === 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-700 mt-4">Safety:</div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getRatingBg(college.ratings_breakdown.safety)}`}
                        style={{ width: `${(college.ratings_breakdown.safety / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 ${getRatingColor(college.ratings_breakdown.safety)}`}>
                      {college.ratings_breakdown.safety > 0 ? college.ratings_breakdown.safety.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-32 text-right truncate">{college.name}</span>
                </div>
              </div>
            ))}

            {/* Facilities */}
            {comparisonData.map((college, index) => (
              <div key={`facilities-${college.id}`}>
                {index === 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-700 mt-4">Facilities:</div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getRatingBg(college.ratings_breakdown.facilities)}`}
                        style={{ width: `${(college.ratings_breakdown.facilities / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 ${getRatingColor(college.ratings_breakdown.facilities)}`}>
                      {college.ratings_breakdown.facilities > 0 ? college.ratings_breakdown.facilities.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-32 text-right truncate">{college.name}</span>
                </div>
              </div>
            ))}

            {/* Opportunities */}
            {comparisonData.map((college, index) => (
              <div key={`opportunities-${college.id}`}>
                {index === 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-700 mt-4">Opportunities:</div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getRatingBg(college.ratings_breakdown.opportunities)}`}
                        style={{ width: `${(college.ratings_breakdown.opportunities / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 ${getRatingColor(college.ratings_breakdown.opportunities)}`}>
                      {college.ratings_breakdown.opportunities > 0 ? college.ratings_breakdown.opportunities.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-32 text-right truncate">{college.name}</span>
                </div>
              </div>
            ))}

            {/* Location */}
            {comparisonData.map((college, index) => (
              <div key={`location-${college.id}`}>
                {index === 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-700 mt-4">Location:</div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getRatingBg(college.ratings_breakdown.location)}`}
                        style={{ width: `${(college.ratings_breakdown.location / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 ${getRatingColor(college.ratings_breakdown.location)}`}>
                      {college.ratings_breakdown.location > 0 ? college.ratings_breakdown.location.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-32 text-right truncate">{college.name}</span>
                </div>
              </div>
            ))}

            {/* Clubs */}
            {comparisonData.map((college, index) => (
              <div key={`clubs-${college.id}`}>
                {index === 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-700 mt-4">Clubs:</div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getRatingBg(college.ratings_breakdown.clubs)}`}
                        style={{ width: `${(college.ratings_breakdown.clubs / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 ${getRatingColor(college.ratings_breakdown.clubs)}`}>
                      {college.ratings_breakdown.clubs > 0 ? college.ratings_breakdown.clubs.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-32 text-right truncate">{college.name}</span>
                </div>
              </div>
            ))}

            {/* Social */}
            {comparisonData.map((college, index) => (
              <div key={`social-${college.id}`}>
                {index === 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-700 mt-4">Social:</div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getRatingBg(college.ratings_breakdown.social)}`}
                        style={{ width: `${(college.ratings_breakdown.social / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 ${getRatingColor(college.ratings_breakdown.social)}`}>
                      {college.ratings_breakdown.social > 0 ? college.ratings_breakdown.social.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-32 text-right truncate">{college.name}</span>
                </div>
              </div>
            ))}

            {/* Food */}
            {comparisonData.map((college, index) => (
              <div key={`food-${college.id}`}>
                {index === 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-700 mt-4">Food:</div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getRatingBg(college.ratings_breakdown.food)}`}
                        style={{ width: `${(college.ratings_breakdown.food / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 ${getRatingColor(college.ratings_breakdown.food)}`}>
                      {college.ratings_breakdown.food > 0 ? college.ratings_breakdown.food.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-32 text-right truncate">{college.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Search and select a college to compare with <strong>{currentCollegeName}</strong></p>
        </div>
      )}
    </div>
  );
}
