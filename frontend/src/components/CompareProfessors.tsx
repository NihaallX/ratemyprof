/**
 * CompareProfessors Component
 * Allows users to search for and compare professors side by side
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

  // Search for professors
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/professors/search?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        console.log('Search results:', data); // Debug log
        // Filter out already selected professors
        const filtered = (data.professors || []).filter((p: any) => !selectedProfessors.includes(p.id));
        setSearchResults(filtered);
      } else {
        console.error('Search failed with status:', response.status);
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedProfessors]);

  // Add professor to comparison
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

  // Remove professor from comparison
  const removeProfessor = (professorId: string) => {
    if (professorId === currentProfessorId) return; // Can't remove current professor
    setSelectedProfessors(selectedProfessors.filter(id => id !== professorId));
  };

  // Fetch comparison data
  useEffect(() => {
    if (selectedProfessors.length >= 2) {
      fetchComparisonData();
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

  const getRatingColor = (rating: number) => {
    if (rating >= 4.0) return 'text-green-600';
    if (rating >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingBg = (rating: number) => {
    if (rating >= 4.0) return 'bg-green-500';
    if (rating >= 3.0) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      {/* Search Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Professor to Compare (Up to 4 total)
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
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={selectedProfessors.length >= 4}
          />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-white border-2 border-indigo-200 rounded-lg shadow-xl max-h-60 overflow-auto z-10">
            {searchResults.map((prof) => (
              <button
                key={prof.id}
                onClick={() => addProfessor(prof.id)}
                className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-semibold text-gray-900">{prof.name}</div>
                <div className="text-sm text-gray-600">{prof.department}</div>
                <div className="text-xs text-gray-500 mt-1">
                  ⭐ {(prof.average_rating || 0).toFixed(1)} • {prof.total_reviews || 0} reviews
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
            No professors found matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Selected Professors Tags */}
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

      {/* Comparison Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading comparison...</p>
        </div>
      ) : comparisonData.length >= 2 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">
                  Metric
                </th>
                {comparisonData.map((prof) => (
                  <th
                    key={prof.id}
                    className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b-2 border-gray-200 min-w-[150px]"
                  >
                    <div className="font-bold">{prof.name}</div>
                    <div className="text-xs font-normal text-gray-600 mt-1">{prof.department}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Overall Rating */}
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 font-medium text-gray-900">Overall Rating</td>
                {comparisonData.map((prof) => (
                  <td key={prof.id} className="px-4 py-3 text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold ${getRatingBg(prof.average_rating)} text-white`}>
                      ★ {prof.average_rating.toFixed(1)}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Total Reviews */}
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">Total Reviews</td>
                {comparisonData.map((prof) => (
                  <td key={prof.id} className="px-4 py-3 text-center text-gray-700">
                    {prof.total_reviews}
                  </td>
                ))}
              </tr>

              {/* Clarity Rating */}
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 font-medium text-gray-900">Clarity</td>
                {comparisonData.map((prof) => (
                  <td key={prof.id} className="px-4 py-3 text-center">
                    <span className={`font-semibold ${getRatingColor(prof.ratings_breakdown.clarity)}`}>
                      {prof.ratings_breakdown.clarity.toFixed(1)} / 5.0
                    </span>
                  </td>
                ))}
              </tr>

              {/* Helpfulness Rating */}
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">Helpfulness</td>
                {comparisonData.map((prof) => (
                  <td key={prof.id} className="px-4 py-3 text-center">
                    <span className={`font-semibold ${getRatingColor(prof.ratings_breakdown.helpfulness)}`}>
                      {prof.ratings_breakdown.helpfulness.toFixed(1)} / 5.0
                    </span>
                  </td>
                ))}
              </tr>

              {/* Difficulty Rating */}
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 font-medium text-gray-900">Difficulty</td>
                {comparisonData.map((prof) => (
                  <td key={prof.id} className="px-4 py-3 text-center">
                    <span className={`font-semibold ${getRatingColor(5 - prof.ratings_breakdown.difficulty)}`}>
                      {prof.ratings_breakdown.difficulty.toFixed(1)} / 5.0
                    </span>
                  </td>
                ))}
              </tr>

              {/* Subjects */}
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">Subjects</td>
                {comparisonData.map((prof) => (
                  <td key={prof.id} className="px-4 py-3 text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {prof.subjects.slice(0, 3).map((subject, idx) => (
                        <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                          {subject}
                        </span>
                      ))}
                      {prof.subjects.length > 3 && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                          +{prof.subjects.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Add at least one more professor to start comparing</p>
        </div>
      )}
    </div>
  );
}
