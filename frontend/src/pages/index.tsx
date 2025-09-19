/**
 * Homepage - RateMyProf India Landing Page
 * Main search interface for discovering professors
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { RateMyProfAPI, Professor, College } from '../services/api';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'professors' | 'colleges'>('professors');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      if (searchType === 'professors') {
        const response = await RateMyProfAPI.searchProfessors({ 
          q: searchQuery,
          limit: 20 
        });
        
        // Simple deduplication by name to handle database duplicates
        const uniqueProfessors = response.professors.filter((prof, index, self) => 
          index === self.findIndex(p => p.name === prof.name && p.department === prof.department)
        );
        
        setProfessors(uniqueProfessors);
        setColleges([]);
      } else {
        const response = await RateMyProfAPI.searchColleges({ 
          q: searchQuery,
          limit: 20 
        });
        setColleges(response.colleges);
        setProfessors([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
              <h1 className="text-2xl font-bold text-indigo-600">RateMyProf India</h1>
              <span className="ml-2 text-sm text-gray-500">Beta</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Vishwakarma University Pilot
              </div>
              <div className="text-xs text-gray-400">
                Reviews require login (coming soon)
              </div>
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
            
            {/* Search Type Tabs */}
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-lg p-1 shadow-md">
                <button
                  onClick={() => setSearchType('professors')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    searchType === 'professors'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Professors
                </button>
                <button
                  onClick={() => setSearchType('colleges')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    searchType === 'colleges'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Colleges
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Search for ${searchType}...`}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 font-medium"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(professors.length > 0 || colleges.length > 0) && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {searchType === 'professors' ? 'Professors' : 'Colleges'} Found: {professors.length + colleges.length}
            </h3>

            {/* Professor Results */}
            {professors.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {professors.map((professor) => (
                  <div key={professor.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {professor.name}
                    </h4>
                    <p className="text-gray-600 mb-1">
                      <span className="font-medium">Department:</span> {professor.department}
                    </p>
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">Designation:</span> {professor.designation || 'Faculty'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-yellow-400 text-sm">
                          ⭐ {professor.average_rating.toFixed(1)}
                        </div>
                        <div className="text-gray-500 text-sm ml-2">
                          ({professor.total_reviews} reviews)
                        </div>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                        <Link href={`/professors/${professor.id}`}>
                          View Profile →
                        </Link>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* College Results */}
            {colleges.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {colleges.map((college) => (
                  <div key={college.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {college.name}
                    </h4>
                    <p className="text-gray-600 mb-1">
                      <span className="font-medium">Location:</span> {college.city}, {college.state}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-medium">Type:</span> {college.college_type}
                    </p>
                    {college.established_year && (
                      <p className="text-gray-600 mb-2">
                        <span className="font-medium">Established:</span> {college.established_year}
                      </p>
                    )}
                    <Link 
                      href={`/colleges/${college.id}`}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium inline-flex items-center"
                    >
                      View College →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}