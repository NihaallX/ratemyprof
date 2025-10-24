/**/**

 * CompareProfessors Component - Redesigned to match Compare Schools UI * CompareProfessors Component

 * Clean side-by-side comparison with horizontal bar charts * Allows users to search for and compare professors side by side

 */ */



import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';

import { Search, X, RefreshCw, Share2 } from 'lucide-react';import { Search, X } from 'lucide-react';

import { API_BASE_URL } from '../config/api';import { API_BASE_URL } from '../config/api';



interface Professor {interface Professor {

  id: string  id: string

  name: string  name: string

  department: string  department: string

  college_name: string  college_name: string

  average_rating: number  average_rating: number

  total_reviews: number  total_reviews: number

  subjects: string[]  subjects: string[]

  ratings_breakdown: {  ratings_breakdown: {

    overall: number    overall: number

    difficulty: number    difficulty: number

    clarity: number    clarity: number

    helpfulness: number    helpfulness: number

  }  }

}}



interface CompareProfessorsProps {interface CompareProfessorsProps {

  currentProfessorId: string  currentProfessorId: string

  currentProfessorName: string  currentProfessorName: string

  onClose: () => void  onClose: () => void

}}



export default function CompareProfessors({ currentProfessorId, currentProfessorName, onClose }: CompareProfessorsProps) {export default function CompareProfessors({ currentProfessorId, currentProfessorName, onClose }: CompareProfessorsProps) {

  const [searchQuery, setSearchQuery] = useState('');  const [searchQuery, setSearchQuery] = useState('');

  const [searchResults, setSearchResults] = useState<any[]>([]);  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([currentProfessorId]);  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([currentProfessorId]);

  const [comparisonData, setComparisonData] = useState<Professor[]>([]);  const [comparisonData, setComparisonData] = useState<Professor[]>([]);

  const [loading, setLoading] = useState(false);  const [loading, setLoading] = useState(false);

  const [isSearching, setIsSearching] = useState(false);  const [isSearching, setIsSearching] = useState(false);



  // Search for professors  // Search for professors

  const handleSearch = async (query: string) => {  const handleSearch = async (query: string) => {

    if (!query.trim()) {    if (!query.trim()) {

      setSearchResults([]);      setSearchResults([]);

      return;      return;

    }    }



    setIsSearching(true);    setIsSearching(true);

    try {    try {

      const response = await fetch(`${API_BASE_URL}/professors?q=${encodeURIComponent(query)}&limit=10`);      const response = await fetch(`${API_BASE_URL}/professors?q=${encodeURIComponent(query)}&limit=10`);

      if (response.ok) {      if (response.ok) {

        const data = await response.json();        const data = await response.json();

        const filtered = (data.professors || []).filter((p: any) =>         console.log('Search results:', data); // Debug log

          p.id !== currentProfessorId && !selectedProfessors.includes(p.id)        // Filter out already selected professors and current professor

        );        const filtered = (data.professors || []).filter((p: any) => 

        setSearchResults(filtered);          p.id !== currentProfessorId && !selectedProfessors.includes(p.id)

      } else {        );

        setSearchResults([]);        setSearchResults(filtered);

      }      } else {

    } catch (err) {        console.error('Search failed with status:', response.status);

      console.error('Search failed:', err);        setSearchResults([]);

      setSearchResults([]);      }

    } finally {    } catch (err) {

      setIsSearching(false);      console.error('Search failed:', err);

    }      setSearchResults([]);

  };    } finally {

      setIsSearching(false);

  // Debounce search    }

  useEffect(() => {  };

    const timer = setTimeout(() => {

      handleSearch(searchQuery);  // Debounce search

    }, 300);  useEffect(() => {

    return () => clearTimeout(timer);    const timer = setTimeout(() => {

  }, [searchQuery, selectedProfessors]);      handleSearch(searchQuery);

    }, 300);

  // Add professor to comparison

  const addProfessor = (professorId: string) => {    return () => clearTimeout(timer);

    if (selectedProfessors.length >= 2) {  }, [searchQuery, selectedProfessors]);

      alert('You can only compare with one other professor');

      return;  // Add professor to comparison (only allow 2 total: current + 1)

    }  const addProfessor = (professorId: string) => {

    if (!selectedProfessors.includes(professorId)) {    if (selectedProfessors.length >= 2) {

      setSelectedProfessors([...selectedProfessors, professorId]);      alert('You can only compare with one other professor');

      setSearchQuery('');      return;

      setSearchResults([]);    }

    }    if (!selectedProfessors.includes(professorId)) {

  };      console.log('Adding professor:', professorId);

      setSelectedProfessors([...selectedProfessors, professorId]);

  // Remove professor from comparison      setSearchQuery('');

  const removeProfessor = (professorId: string) => {      setSearchResults([]);

    if (professorId === currentProfessorId) return;    }

    setSelectedProfessors(selectedProfessors.filter(id => id !== professorId));  };

  };

  // Remove professor from comparison

  // Fetch comparison data  const removeProfessor = (professorId: string) => {

  useEffect(() => {    if (professorId === currentProfessorId) return; // Can't remove current professor

    if (selectedProfessors.length >= 2) {    setSelectedProfessors(selectedProfessors.filter(id => id !== professorId));

      fetchComparisonData();  };

    } else {

      setComparisonData([]);  // Fetch comparison data

    }  useEffect(() => {

  }, [selectedProfessors]);    if (selectedProfessors.length >= 2) {

      fetchComparisonData();

  const fetchComparisonData = async () => {    }

    setLoading(true);  }, [selectedProfessors]);

    try {

      const response = await fetch(`${API_BASE_URL}/professors/compare?ids=${selectedProfessors.join(',')}`);  const fetchComparisonData = async () => {

      if (response.ok) {    setLoading(true);

        const data = await response.json();    try {

        setComparisonData(data.professors);      const response = await fetch(`${API_BASE_URL}/professors/compare?ids=${selectedProfessors.join(',')}`);

      } else {      if (response.ok) {

        console.error('Compare API returned:', response.status);        const data = await response.json();

      }        setComparisonData(data.professors);

    } catch (err) {      }

      console.error('Failed to fetch comparison data:', err);    } catch (err) {

    } finally {      console.error('Failed to fetch comparison data:', err);

      setLoading(false);    } finally {

    }      setLoading(false);

  };    }

  };

  const getRatingBg = (rating: number) => {

    if (rating >= 4.0) return 'bg-green-500';  const getRatingColor = (rating: number) => {

    if (rating >= 3.0) return 'bg-yellow-500';    if (rating >= 4.0) return 'text-green-600';

    return 'bg-red-500';    if (rating >= 3.0) return 'text-yellow-600';

  };    return 'text-red-600';

  };

  const handleReset = () => {

    setSelectedProfessors([currentProfessorId]);  const getRatingBg = (rating: number) => {

    setSearchQuery('');    if (rating >= 4.0) return 'bg-green-500';

    setSearchResults([]);    if (rating >= 3.0) return 'bg-yellow-500';

    setComparisonData([]);    return 'bg-red-500';

  };  };



  const handleShare = () => {  return (

    const url = `${window.location.origin}/compare?ids=${selectedProfessors.join(',')}`;    <div>

    navigator.clipboard.writeText(url);      {/* Search Section */}

    alert('Comparison link copied to clipboard!');      <div className="mb-6">

  };        <label className="block text-sm font-medium text-gray-700 mb-2">

          Search for a Professor to Compare With

  return (        </label>

    <div className="max-h-[85vh] overflow-y-auto">        <div className="relative">

      {/* Header with Reset and Share buttons */}          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

      {comparisonData.length >= 2 && (            <Search className="h-5 w-5 text-gray-400" />

        <div className="flex items-center justify-between mb-6 pb-4 border-b">          </div>

          <div className="flex items-center gap-2">          <input

            <span className="text-2xl">🎓</span>            type="text"

            <h2 className="text-2xl font-bold">Compare Professors</h2>            value={searchQuery}

          </div>            onChange={(e) => setSearchQuery(e.target.value)}

          <div className="flex items-center gap-3">            placeholder="Search for professors..."

            <button            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"

              onClick={handleReset}            disabled={selectedProfessors.length >= 2}

              className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium text-sm"          />

            >        </div>

              <RefreshCw className="w-4 h-4" />

              Reset        {/* Search Results Dropdown */}

            </button>        {searchResults.length > 0 && (

            <button          <div className="mt-2 bg-white border-2 border-indigo-200 rounded-lg shadow-xl max-h-60 overflow-auto z-10">

              onClick={handleShare}            {searchResults.map((prof) => (

              className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors font-medium text-sm"              <button

            >                key={prof.id}

              <Share2 className="w-4 h-4" />                onClick={() => addProfessor(prof.id)}

              Share Comparison                className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"

            </button>              >

          </div>                <div className="flex items-center justify-between">

        </div>                  <div>

      )}                    <div className="font-semibold text-gray-900">{prof.name}</div>

                    <div className="text-sm text-gray-600">{prof.department}</div>

      {/* Search Section - Only show when no comparison */}                  </div>

      {comparisonData.length < 2 && (                  <div className={`ml-4 px-3 py-1 rounded-full font-bold text-sm text-white ${getRatingBg(prof.average_rating || 0)}`}>

        <div className="mb-6">                    {(prof.average_rating || 0).toFixed(1)}

          <label className="block text-sm font-medium text-gray-700 mb-2">                  </div>

            Search for a Professor to Compare With                </div>

          </label>                <div className="text-xs text-gray-500 mt-1">

          <div className="relative">                  {prof.total_reviews || 0} reviews

            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">                </div>

              <Search className="h-5 w-5 text-gray-400" />              </button>

            </div>            ))}

            <input          </div>

              type="text"        )}

              value={searchQuery}

              onChange={(e) => setSearchQuery(e.target.value)}        {isSearching && (

              placeholder="Search for professors..."          <div className="mt-2 text-sm text-indigo-600 font-medium">🔍 Searching...</div>

              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"        )}

              disabled={selectedProfessors.length >= 2}

            />        {searchQuery.trim() && !isSearching && searchResults.length === 0 && (

          </div>          <div className="mt-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">

            No professors found matching "{searchQuery}"

          {/* Search Results Dropdown */}          </div>

          {searchResults.length > 0 && (        )}

            <div className="mt-2 bg-white border-2 border-indigo-200 rounded-lg shadow-xl max-h-60 overflow-auto">      </div>

              {searchResults.map((prof) => (

                <button      {/* Selected Professors Tags */}

                  key={prof.id}      {comparisonData.length > 0 && (

                  onClick={() => addProfessor(prof.id)}        <div className="mb-6">

                  className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"          <div className="flex flex-wrap gap-2">

                >            {comparisonData.map((prof) => (

                  <div className="flex items-center justify-between">              <div

                    <div>                key={prof.id}

                      <div className="font-semibold text-gray-900">{prof.name}</div>                className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"

                      <div className="text-sm text-gray-600">{prof.department}</div>              >

                    </div>                <span>{prof.name}</span>

                    <div className={`ml-4 px-3 py-1 rounded-full font-bold text-sm text-white ${getRatingBg(prof.average_rating || 0)}`}>                {prof.id !== currentProfessorId && (

                      {(prof.average_rating || 0).toFixed(1)}                  <button

                    </div>                    onClick={() => removeProfessor(prof.id)}

                  </div>                    className="hover:text-indigo-900"

                  <div className="text-xs text-gray-500 mt-1">                  >

                    {prof.total_reviews || 0} reviews                    <X className="w-4 h-4" />

                  </div>                  </button>

                </button>                )}

              ))}              </div>

            </div>            ))}

          )}          </div>

        </div>        </div>

      )}      )}



      {/* Comparison Display */}      {/* Comparison Table */}

      {loading ? (      {loading ? (

        <div className="text-center py-12">        <div className="text-center py-8">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>

          <p className="mt-4 text-gray-600">Loading comparison...</p>          <p className="mt-2 text-gray-600">Loading comparison...</p>

        </div>        </div>

      ) : comparisonData.length >= 2 ? (      ) : comparisonData.length >= 2 ? (

        <div>        <div className="overflow-x-auto">

          {/* Professor Cards Side by Side */}          <table className="w-full border-collapse">

          <div className="grid grid-cols-2 gap-6 mb-8">            <thead>

            {comparisonData.map((prof, index) => (              <tr className="bg-gray-100">

              <div key={prof.id} className="bg-gray-50 rounded-2xl p-6 text-center">                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200">

                {/* Overall Rating Badge */}                  Metric

                <div className="flex justify-center mb-4">                </th>

                  {prof.average_rating > 0 ? (                {comparisonData.map((prof) => (

                    <div className={`inline-block px-8 py-6 rounded-2xl ${getRatingBg(prof.average_rating)} text-white`}>                  <th

                      <div className="text-4xl font-bold">{prof.average_rating.toFixed(1)}</div>                    key={prof.id}

                      <div className="text-sm font-medium mt-1">OVERALL</div>                    className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b-2 border-gray-200 min-w-[150px]"

                      <div className="text-xs mt-1">{prof.total_reviews} Rating{prof.total_reviews !== 1 ? 's' : ''}</div>                  >

                    </div>                    <div className="font-bold">{prof.name}</div>

                  ) : (                    <div className="text-xs font-normal text-gray-600 mt-1">{prof.department}</div>

                    <div className="inline-block px-8 py-6 rounded-2xl bg-gray-300 text-gray-700">                  </th>

                      <div className="text-4xl font-bold">N/A</div>                ))}

                      <div className="text-sm font-medium mt-1">OVERALL</div>              </tr>

                    </div>            </thead>

                  )}            <tbody>

                </div>              {/* Overall Rating */}

              <tr className="border-b border-gray-200">

                {/* Professor Name */}                <td className="px-4 py-3 font-medium text-gray-900">Overall Rating</td>

                <h3 className="text-xl font-bold text-gray-900 mt-4">{prof.name}</h3>                {comparisonData.map((prof) => (

                <p className="text-sm text-gray-600 mt-1">{prof.department}</p>                  <td key={prof.id} className="px-4 py-3 text-center">

                <p className="text-xs text-gray-500">{prof.college_name}</p>                    <div className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-lg ${getRatingBg(prof.average_rating)} text-white`}>

              </div>                      {prof.average_rating.toFixed(1)}

            ))}                    </div>

          </div>                  </td>

                ))}

          {/* Comparison Bars - Exactly like Compare Schools */}              </tr>

          <div className="space-y-4">

            {/* Clarity */}              {/* Total Reviews */}

            <div className="flex items-center gap-4">              <tr className="border-b border-gray-200 bg-gray-50">

              <div className="w-1/2 flex items-center gap-3">                <td className="px-4 py-3 font-medium text-gray-900">Total Reviews</td>

                <div className="flex-1 flex items-center gap-2">                {comparisonData.map((prof) => (

                  <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden">                  <td key={prof.id} className="px-4 py-3 text-center text-gray-700">

                    <div                    {prof.total_reviews}

                      className={`h-full ${getRatingBg(comparisonData[0].ratings_breakdown.clarity)} flex items-center justify-end pr-2`}                  </td>

                      style={{ width: `${(comparisonData[0].ratings_breakdown.clarity / 5) * 100}%` }}                ))}

                    >              </tr>

                      <span className="text-white font-bold text-sm">

                        {comparisonData[0].ratings_breakdown.clarity > 0 ? comparisonData[0].ratings_breakdown.clarity.toFixed(1) : ''}              {/* Clarity Rating */}

                      </span>              <tr className="border-b border-gray-200">

                    </div>                <td className="px-4 py-3 font-medium text-gray-900">Clarity</td>

                  </div>                {comparisonData.map((prof) => (

                  <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center">                  <td key={prof.id} className="px-4 py-3 text-center">

                    <div className="w-3 h-3 rounded-full bg-white"></div>                    <div className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-white ${getRatingBg(prof.ratings_breakdown.clarity)}`}>

                  </div>                      {prof.ratings_breakdown.clarity.toFixed(1)}

                </div>                    </div>

              </div>                  </td>

              <div className="w-32 text-center">                ))}

                <span className="font-bold text-gray-900">Clarity</span>              </tr>

              </div>

              <div className="w-1/2 flex items-center gap-3">              {/* Helpfulness Rating */}

                <div className="flex-1 flex items-center gap-2">              <tr className="border-b border-gray-200 bg-gray-50">

                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">                <td className="px-4 py-3 font-medium text-gray-900">Helpfulness</td>

                    <div className="w-3 h-3 rounded-full bg-white"></div>                {comparisonData.map((prof) => (

                  </div>                  <td key={prof.id} className="px-4 py-3 text-center">

                  <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden">                    <div className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-white ${getRatingBg(prof.ratings_breakdown.helpfulness)}`}>

                    <div                      {prof.ratings_breakdown.helpfulness.toFixed(1)}

                      className={`h-full ${comparisonData.length > 1 ? getRatingBg(comparisonData[1].ratings_breakdown.clarity) : 'bg-gray-300'} flex items-center justify-start pl-2`}                    </div>

                      style={{ width: comparisonData.length > 1 ? `${(comparisonData[1].ratings_breakdown.clarity / 5) * 100}%` : '0%' }}                  </td>

                    >                ))}

                      <span className="text-white font-bold text-sm">              </tr>

                        {comparisonData.length > 1 && comparisonData[1].ratings_breakdown.clarity > 0 ? comparisonData[1].ratings_breakdown.clarity.toFixed(1) : ''}

                      </span>              {/* Difficulty Rating */}

                    </div>              <tr className="border-b border-gray-200">

                  </div>                <td className="px-4 py-3 font-medium text-gray-900">Difficulty</td>

                </div>                {comparisonData.map((prof) => (

              </div>                  <td key={prof.id} className="px-4 py-3 text-center">

            </div>                    <div className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-white ${getRatingBg(5 - prof.ratings_breakdown.difficulty)}`}>

                      {prof.ratings_breakdown.difficulty.toFixed(1)}

            {/* Helpfulness */}                    </div>

            <div className="flex items-center gap-4">                  </td>

              <div className="w-1/2 flex items-center gap-3">                ))}

                <div className="flex-1 flex items-center gap-2">              </tr>

                  <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden">

                    <div              {/* Subjects */}

                      className={`h-full ${getRatingBg(comparisonData[0].ratings_breakdown.helpfulness)} flex items-center justify-end pr-2`}              <tr className="border-b border-gray-200 bg-gray-50">

                      style={{ width: `${(comparisonData[0].ratings_breakdown.helpfulness / 5) * 100}%` }}                <td className="px-4 py-3 font-medium text-gray-900">Subjects</td>

                    >                {comparisonData.map((prof) => (

                      <span className="text-white font-bold text-sm">                  <td key={prof.id} className="px-4 py-3 text-center">

                        {comparisonData[0].ratings_breakdown.helpfulness > 0 ? comparisonData[0].ratings_breakdown.helpfulness.toFixed(1) : ''}                    <div className="flex flex-wrap gap-1 justify-center">

                      </span>                      {prof.subjects.slice(0, 3).map((subject, idx) => (

                    </div>                        <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">

                  </div>                          {subject}

                  <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center">                        </span>

                    <div className="w-3 h-3 rounded-full bg-white"></div>                      ))}

                  </div>                      {prof.subjects.length > 3 && (

                </div>                        <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">

              </div>                          +{prof.subjects.length - 3}

              <div className="w-32 text-center">                        </span>

                <span className="font-bold text-gray-900">Helpfulness</span>                      )}

              </div>                    </div>

              <div className="w-1/2 flex items-center gap-3">                  </td>

                <div className="flex-1 flex items-center gap-2">                ))}

                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">              </tr>

                    <div className="w-3 h-3 rounded-full bg-white"></div>            </tbody>

                  </div>          </table>

                  <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden">        </div>

                    <div      ) : (

                      className={`h-full ${comparisonData.length > 1 ? getRatingBg(comparisonData[1].ratings_breakdown.helpfulness) : 'bg-gray-300'} flex items-center justify-start pl-2`}        <div className="text-center py-8 text-gray-500">

                      style={{ width: comparisonData.length > 1 ? `${(comparisonData[1].ratings_breakdown.helpfulness / 5) * 100}%` : '0%' }}          <p>Search and select a professor to compare with <strong>{currentProfessorName}</strong></p>

                    >        </div>

                      <span className="text-white font-bold text-sm">      )}

                        {comparisonData.length > 1 && comparisonData[1].ratings_breakdown.helpfulness > 0 ? comparisonData[1].ratings_breakdown.helpfulness.toFixed(1) : ''}    </div>

                      </span>  );

                    </div>}

                  </div>
                </div>
              </div>
            </div>

            {/* Overall */}
            <div className="flex items-center gap-4">
              <div className="w-1/2 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getRatingBg(comparisonData[0].ratings_breakdown.overall)} flex items-center justify-end pr-2`}
                      style={{ width: `${(comparisonData[0].ratings_breakdown.overall / 5) * 100}%` }}
                    >
                      <span className="text-white font-bold text-sm">
                        {comparisonData[0].ratings_breakdown.overall > 0 ? comparisonData[0].ratings_breakdown.overall.toFixed(1) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
              <div className="w-32 text-center">
                <span className="font-bold text-gray-900">Overall</span>
              </div>
              <div className="w-1/2 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                  <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${comparisonData.length > 1 ? getRatingBg(comparisonData[1].ratings_breakdown.overall) : 'bg-gray-300'} flex items-center justify-start pl-2`}
                      style={{ width: comparisonData.length > 1 ? `${(comparisonData[1].ratings_breakdown.overall / 5) * 100}%` : '0%' }}
                    >
                      <span className="text-white font-bold text-sm">
                        {comparisonData.length > 1 && comparisonData[1].ratings_breakdown.overall > 0 ? comparisonData[1].ratings_breakdown.overall.toFixed(1) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div className="flex items-center gap-4">
              <div className="w-1/2 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 flex items-center justify-end pr-2"
                      style={{ width: `${(comparisonData[0].ratings_breakdown.difficulty / 5) * 100}%` }}
                    >
                      <span className="text-white font-bold text-sm">
                        {comparisonData[0].ratings_breakdown.difficulty > 0 ? comparisonData[0].ratings_breakdown.difficulty.toFixed(1) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                </div>
              </div>
              <div className="w-32 text-center">
                <span className="font-bold text-gray-900">Difficulty</span>
              </div>
              <div className="w-1/2 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                  <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 flex items-center justify-start pl-2"
                      style={{ width: comparisonData.length > 1 ? `${(comparisonData[1].ratings_breakdown.difficulty / 5) * 100}%` : '0%' }}
                    >
                      <span className="text-white font-bold text-sm">
                        {comparisonData.length > 1 && comparisonData[1].ratings_breakdown.difficulty > 0 ? comparisonData[1].ratings_breakdown.difficulty.toFixed(1) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
