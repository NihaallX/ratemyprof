/**
 * CompareProfessors Component - RateMyProfessors.com Style
 * Side-by-side professor comparison matching RMP design
 */

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { API_BASE_URL, API_LEGACY_BASE } from '../config/api';

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
  rating_distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  would_take_again_percentage: number
  taken_for_credit: {
    yes: number
    no: number
    na: number
  }
  mandatory_attendance: {
    yes: number
    no: number
    na: number
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
    console.log('🔍 addProfessor called with ID:', professorId);
    console.log('   Current selected professors:', selectedProfessors);
    
    if (selectedProfessors.length >= 2) {
      alert('You can compare up to 2 professors at once');
      return;
    }
    if (!selectedProfessors.includes(professorId)) {
      const newSelection = [...selectedProfessors, professorId];
      console.log('   ✅ Adding professor, new selection:', newSelection);
      setSelectedProfessors(newSelection);
      setSearchQuery('');
      setSearchResults([]);
    } else {
      console.log('   ⚠️ Professor already selected');
    }
  };

  const removeProfessor = (professorId: string) => {
    if (professorId === currentProfessorId) return;
    setSelectedProfessors(selectedProfessors.filter(id => id !== professorId));
  };

  useEffect(() => {
    console.log('🔄 selectedProfessors changed:', selectedProfessors);
    if (selectedProfessors.length >= 2) {
      console.log('   📊 Fetching comparison data...');
      fetchComparisonData();
    } else {
      console.log('   ⏸️ Not enough professors selected for comparison');
      setComparisonData([]);
    }
  }, [selectedProfessors]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      const url = `${API_LEGACY_BASE}/professors/compare?ids=${selectedProfessors.join(',')}`;
      console.log('🌐 Fetching comparison data from:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Comparison data received:', data);
        setComparisonData(data.professors);
      } else {
        const errorText = await response.text();
        console.error('❌ Compare API error:', response.status, errorText);
      }
    } catch (err) {
      console.error('Failed to fetch comparison data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.0) return 'bg-yellow-400';
    if (rating >= 3.0) return 'bg-yellow-300';
    if (rating >= 2.0) return 'bg-orange-300';
    return 'bg-orange-400';
  };

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Compare Professors</h2>
        <p className="text-sm text-gray-600 mt-1">Select another professor to compare with {currentProfessorName}</p>
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
                    <div className={`ml-4 px-3 py-1 rounded font-bold text-sm text-white ${getRatingColor(prof.average_rating || 0)}`}>
                      {(prof.average_rating || 0).toFixed(1)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {prof.total_reviews || 0} ratings
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

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading comparison...</p>
        </div>
      ) : comparisonData.length >= 2 ? (
        <div className="space-y-4">
          {/* Side by Side Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            {comparisonData.map((prof) => (
              <div key={prof.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Header with name and overall rating */}
                <div className="bg-gray-50 p-4 border-b">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{prof.name}</h3>
                      <p className="text-sm text-gray-600">{prof.department} at</p>
                      <p className="text-sm text-gray-600 font-medium">{prof.college_name}</p>
                    </div>
                    {prof.id !== currentProfessorId && (
                      <button
                        onClick={() => removeProfessor(prof.id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Overall Quality Rating */}
                <div className="p-4 bg-white border-b">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded font-bold text-2xl text-white ${getRatingColor(prof.average_rating)}`}>
                    {prof.average_rating.toFixed(1)}
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 font-semibold">Overall Quality</p>
                    <p className="text-xs text-gray-500">{prof.total_reviews} {prof.total_reviews === 1 ? 'Rating' : 'Ratings'}</p>
                  </div>
                </div>

                {/* Rating Distribution Bars */}
                <div className="p-4 bg-white border-b">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = prof.rating_distribution[star as keyof typeof prof.rating_distribution] || 0;
                    const percentage = prof.total_reviews > 0 ? (count / prof.total_reviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-700 w-3">{star}</span>
                        <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Level of Difficulty */}
                <div className="p-4 bg-white border-b text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {prof.ratings_breakdown.difficulty.toFixed(1)}
                  </div>
                  <p className="text-xs text-gray-600 font-semibold mt-1">Level of Difficulty</p>
                </div>

                {/* Would Take Again */}
                <div className="p-4 bg-white border-b text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {prof.would_take_again_percentage}%
                  </div>
                  <p className="text-xs text-gray-600 font-semibold mt-1">Would Take Again</p>
                </div>

                {/* Taken for Credit - Donut Chart */}
                <div className="p-4 bg-white border-b">
                  <p className="text-xs text-gray-600 font-semibold mb-3 text-center">Taken for Credit</p>
                  <div className="flex items-center justify-center gap-4">
                    {/* Simple bar visualization */}
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center bg-green-50">
                        <span className="text-lg font-bold text-green-700">{prof.taken_for_credit.yes}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Yes</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center bg-red-50">
                        <span className="text-lg font-bold text-red-700">{prof.taken_for_credit.no}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">No</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-gray-400 flex items-center justify-center bg-gray-50">
                        <span className="text-lg font-bold text-gray-700">{prof.taken_for_credit.na}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">N/A</p>
                    </div>
                  </div>
                </div>

                {/* Mandatory Attendance */}
                <div className="p-4 bg-white">
                  <p className="text-xs text-gray-600 font-semibold mb-3 text-center">Mandatory Attendance</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center bg-green-50">
                        <span className="text-lg font-bold text-green-700">{prof.mandatory_attendance.yes}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Yes</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center bg-red-50">
                        <span className="text-lg font-bold text-red-700">{prof.mandatory_attendance.no}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">No</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-gray-400 flex items-center justify-center bg-gray-50">
                        <span className="text-lg font-bold text-gray-700">{prof.mandatory_attendance.na}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">N/A</p>
                    </div>
                  </div>
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
