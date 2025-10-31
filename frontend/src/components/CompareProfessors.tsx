/**
 * CompareProfessors Component
 * Side-by-side professor comparison with rating bars matching detail page style
 */

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Professor {
  id: string
  name: string
  department: string
  college_name: string
  average_rating: number
  total_reviews: number
  subjects: string[]
  ratings_breakdown: {
    overall: number
    difficulty: number
    clarity: number
    helpfulness: number
  }
}

interface CompareProfessorsProps {
  currentProfessorId: string
  currentProfessorName: string
  onClose: () => void
}

export default function CompareProfessors({ currentProfessorId, currentProfessorName, onClose }: CompareProfessorsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([currentProfessorId]);
  const [comparisonData, setComparisonData] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/professors?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        const filtered = (data.professors || []).filter((p: any) => 
          p.id !== currentProfessorId && !selectedProfessors.includes(p.id)
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
  }, [searchQuery, selectedProfessors]);

  const addProfessor = (professorId: string) => {
    if (selectedProfessors.length >= 4) {
      alert('You can compare up to 4 professors at once');
      return;
    }
    if (!selectedProfessors.includes(professorId)) {
      setSelectedProfessors([...selectedProfessors, professorId]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeProfessor = (professorId: string) => {
    if (professorId === currentProfessorId) return;
    setSelectedProfessors(selectedProfessors.filter(id => id !== professorId));
  };

  useEffect(() => {
    if (selectedProfessors.length >= 2) {
      fetchComparisonData();
    } else {
      setComparisonData([]);
    }
  }, [selectedProfessors]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/professors/compare?ids=${selectedProfessors.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        setComparisonData(data.professors);
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

  // For difficulty: lower is better (easier), so invert the colors
  const getDifficultyBg = (difficulty: number) => {
    if (difficulty <= 2.0) return 'bg-green-500';  // Easy = green
    if (difficulty <= 3.5) return 'bg-yellow-500'; // Medium = yellow
    return 'bg-red-500';                           // Hard = red
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2.0) return 'text-green-600';
    if (difficulty <= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Compare Professors</h2>
      </div>

      {comparisonData.length < 2 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search for a Professor to Compare With
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for professors..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={selectedProfessors.length >= 4}
            />
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 bg-white border-2 border-indigo-200 rounded-lg shadow-xl max-h-60 overflow-auto">
              {searchResults.map((prof) => (
                <button
                  key={prof.id}
                  onClick={() => addProfessor(prof.id)}
                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{prof.name}</div>
                      <div className="text-sm text-gray-600">{prof.department}</div>
                    </div>
                    <div className={`ml-4 px-3 py-1 rounded-full font-bold text-sm text-white ${getRatingBg(prof.average_rating || 0)}`}>
                      {(prof.average_rating || 0).toFixed(1)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {prof.total_reviews || 0} reviews
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
              No professors found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      )}

      {/* Selected Professors Tags */}
      {comparisonData.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {comparisonData.map((prof) => (
              <div
                key={prof.id}
                className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
              >
                <span>{prof.name}</span>
                {prof.id !== currentProfessorId && (
                  <button
                    onClick={() => removeProfessor(prof.id)}
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
          {/* Professor Cards Side by Side */}
          <div className={`grid gap-6 ${comparisonData.length === 2 ? 'grid-cols-2' : comparisonData.length === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
            {comparisonData.map((prof) => (
              <div key={prof.id} className="bg-gray-50 rounded-lg p-6 text-center">
                {/* Overall Rating Badge matching detail page style */}
                <div className={`inline-flex items-center px-6 py-3 rounded-full font-bold text-2xl mb-4 text-white ${getRatingBg(prof.average_rating)}`}>
                  ★ {prof.average_rating.toFixed(1)}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{prof.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{prof.department}</p>
                <p className="text-xs text-gray-500">{prof.college_name}</p>
                <p className="text-xs text-gray-500 mt-2">Based on {prof.total_reviews} review{prof.total_reviews !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>

          {/* Comparison Metrics - Matching the detail page style */}
          <div className="bg-white rounded-lg p-6 space-y-4">
            {/* Clarity */}
            {comparisonData.map((prof, index) => (
              <div key={`clarity-${prof.id}`}>
                {index === 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-700">Clarity:</div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getRatingBg(prof.ratings_breakdown.clarity)}`}
                        style={{ width: `${(prof.ratings_breakdown.clarity / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 ${getRatingColor(prof.ratings_breakdown.clarity)}`}>
                      {prof.ratings_breakdown.clarity.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-32 text-right">{prof.name}</span>
                </div>
              </div>
            ))}

            {/* Helpfulness */}
            {comparisonData.map((prof, index) => (
              <div key={`helpfulness-${prof.id}`}>
                {index === 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-700 mt-4">Helpfulness:</div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getRatingBg(prof.ratings_breakdown.helpfulness)}`}
                        style={{ width: `${(prof.ratings_breakdown.helpfulness / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 ${getRatingColor(prof.ratings_breakdown.helpfulness)}`}>
                      {prof.ratings_breakdown.helpfulness.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-32 text-right">{prof.name}</span>
                </div>
              </div>
            ))}

            {/* Overall */}
            {comparisonData.map((prof, index) => (
              <div key={`overall-${prof.id}`}>
                {index === 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-700 mt-4">Overall:</div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getRatingBg(prof.ratings_breakdown.overall)}`}
                        style={{ width: `${(prof.ratings_breakdown.overall / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 ${getRatingColor(prof.ratings_breakdown.overall)}`}>
                      {prof.ratings_breakdown.overall.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-32 text-right">{prof.name}</span>
                </div>
              </div>
            ))}

            {/* Difficulty */}
            {comparisonData.map((prof, index) => (
              <div key={`difficulty-${prof.id}`}>
                {index === 0 && (
                  <div className="mb-2 text-sm font-semibold text-gray-700 mt-4">Difficulty:</div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getDifficultyBg(prof.ratings_breakdown.difficulty)}`}
                        style={{ width: `${(prof.ratings_breakdown.difficulty / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`font-semibold w-12 ${getDifficultyColor(prof.ratings_breakdown.difficulty)}`}>
                      {prof.ratings_breakdown.difficulty.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-32 text-right">{prof.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>Search and select a professor to compare with <strong>{currentProfessorName}</strong></p>
        </div>
      )}
    </div>
  );
}
