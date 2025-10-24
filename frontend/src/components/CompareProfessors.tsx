/**
 * CompareProfessors Component - Redesigned to match Compare Schools UI
 * Clean side-by-side comparison with horizontal bar charts
 */

import { useState, useEffect } from 'react';
import { Search, RefreshCw, Share2 } from 'lucide-react';
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
    if (selectedProfessors.length >= 2) {
      alert('You can only compare with one other professor');
      return;
    }
    if (!selectedProfessors.includes(professorId)) {
      setSelectedProfessors([...selectedProfessors, professorId]);
      setSearchQuery('');
      setSearchResults([]);
    }
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

  const handleReset = () => {
    setSelectedProfessors([currentProfessorId]);
    setSearchQuery('');
    setSearchResults([]);
    setComparisonData([]);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/compare?ids=${selectedProfessors.join(',')}`;
    navigator.clipboard.writeText(url);
    alert('Comparison link copied to clipboard!');
  };

  const getBarWidth = (rating: number) => {
    return `${(rating / 5) * 100}%`;
  };

  return (
    <div className="min-h-[400px]">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <h2 className="text-2xl font-bold">Compare Professors</h2>
        </div>
        {comparisonData.length >= 2 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors font-medium text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share Comparison
            </button>
          </div>
        )}
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
              disabled={selectedProfessors.length >= 2}
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

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading comparison...</p>
        </div>
      ) : comparisonData.length >= 2 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {comparisonData.map((prof) => (
              <div key={prof.id} className="bg-gray-50 rounded-2xl p-6 text-center">
                <div className="flex justify-center mb-4">
                  {prof.average_rating > 0 ? (
                    <div className={`inline-block px-8 py-6 rounded-2xl ${getRatingBg(prof.average_rating)} text-white`}>
                      <div className="text-4xl font-bold">{prof.average_rating.toFixed(1)}</div>
                      <div className="text-sm font-medium mt-1">OVERALL</div>
                      <div className="text-xs mt-1">{prof.total_reviews} Rating{prof.total_reviews !== 1 ? 's' : ''}</div>
                    </div>
                  ) : (
                    <div className="inline-block px-8 py-6 rounded-2xl bg-gray-300 text-gray-700">
                      <div className="text-4xl font-bold">N/A</div>
                      <div className="text-sm font-medium mt-1">OVERALL</div>
                    </div>
                  )}
                </div>
                
                <div className="text-xl font-bold text-gray-900 mt-4">{prof.name}</div>
                <div className="text-sm text-gray-600 mt-1">{prof.department}</div>
                <div className="text-xs text-gray-500 mt-1">{prof.college_name}</div>
              </div>
            ))}
          </div>

          <div className="space-y-4 bg-white p-6 rounded-lg">
            {[ 
              { key: 'clarity', label: 'Clarity', color: 'green' },
              { key: 'helpfulness', label: 'Helpfulness', color: 'green' },
              { key: 'difficulty', label: 'Difficulty', color: 'blue' },
              { key: 'overall', label: 'Overall', color: 'auto' }
            ].map((metric) => (
              <div key={metric.key} className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-10 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${metric.color === 'blue' ? 'bg-blue-500' : getRatingBg((comparisonData[0].ratings_breakdown as any)[metric.key])} flex items-center justify-end pr-3`}
                        style={{ width: getBarWidth((comparisonData[0].ratings_breakdown as any)[metric.key]) }}
                      >
                        {(comparisonData[0].ratings_breakdown as any)[metric.key] > 0 && (
                          <span className="text-white font-bold text-sm">
                            {((comparisonData[0].ratings_breakdown as any)[metric.key]).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0">
                      <div className="w-4 h-4 rounded-full bg-white"></div>
                    </div>
                  </div>
                </div>
                
                <div className="w-32 text-center flex-shrink-0">
                  <span className="font-bold text-gray-900">{metric.label}</span>
                </div>
                
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <div className="w-4 h-4 rounded-full bg-white"></div>
                    </div>
                    <div className="flex-1 h-10 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${metric.color === 'blue' ? 'bg-blue-500' : getRatingBg((comparisonData[1].ratings_breakdown as any)[metric.key])} flex items-center justify-start pl-3`}
                        style={{ width: getBarWidth((comparisonData[1].ratings_breakdown as any)[metric.key]) }}
                      >
                        {(comparisonData[1].ratings_breakdown as any)[metric.key] > 0 && (
                          <span className="text-white font-bold text-sm">
                            {((comparisonData[1].ratings_breakdown as any)[metric.key]).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">Search and select a professor to compare with</p>
          <p className="text-sm mt-2"><strong>{currentProfessorName}</strong></p>
        </div>
      )}
    </div>
  );
}
