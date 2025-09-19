/**
 * Professor Profile Page - [id].tsx
 * Displays detailed information about a specific professor
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { RateMyProfAPI, Professor } from '../../services/api';

export default function ProfessorProfile() {
  const router = useRouter();
  const { id } = router.query;
  
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchProfessor(id);
    }
  }, [id]);

  const fetchProfessor = async (professorId: string) => {
    try {
      setLoading(true);
      const data = await RateMyProfAPI.getProfessor(professorId);
      setProfessor(data);
    } catch (err) {
      console.error('Failed to fetch professor:', err);
      setError('Professor not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading professor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !professor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Professor Not Found</h1>
          <p className="text-gray-600 mb-8">The professor you're looking for doesn't exist.</p>
          <Link href="/" className="btn-primary">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{professor.name} - RateMyProf India</title>
        <meta name="description" content={`Professor profile for ${professor.name} at Vishwakarma University`} />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center text-indigo-600 hover:text-indigo-700">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Search
            </Link>
            <div className="text-lg font-semibold text-gray-900">
              RateMyProf India
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Professor Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {professor.name}
              </h1>
              <p className="text-xl text-gray-600 mb-2">
                {professor.department} Department
              </p>
              <p className="text-lg text-gray-500 mb-4">
                {professor.designation || 'Faculty'} • Vishwakarma University
              </p>
              
              {/* Subjects */}
              {professor.subjects && professor.subjects.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Subjects Taught:</h3>
                  <div className="flex flex-wrap gap-2">
                    {professor.subjects.map((subject, index) => (
                      <span 
                        key={index}
                        className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rating Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg p-6 md:ml-8 mt-6 md:mt-0 min-w-[200px]">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {professor.average_rating > 0 ? professor.average_rating.toFixed(1) : 'N/A'}
                </div>
                <div className="text-indigo-100 mb-2">Overall Rating</div>
                <div className="text-sm text-indigo-200">
                  Based on {professor.total_reviews} review{professor.total_reviews !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Reviews</h2>
          
          {professor.total_reviews === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.706-.42l-3.5 3.5a.978.978 0 01-1.414 0 .978.978 0 010-1.414l3.5-3.5A8.955 8.955 0 014 12C4 7.582 7.582 4 12 4s8 3.582 8 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600 mb-6">
                Be the first to review {professor.name.split(' ').slice(-1)[0]}!
              </p>
              
              {/* Add Review Button - Disabled for now since we don't have auth */}
              <button 
                className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
                disabled
                title="Login required to add reviews"
              >
                Add Review (Login Required)
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                {professor.total_reviews} review{professor.total_reviews !== 1 ? 's' : ''} found
              </p>
              
              {/* Placeholder for actual reviews - we'd fetch these from reviews API */}
              <div className="text-center py-8 text-gray-500">
                <p>Review details would be displayed here.</p>
                <p className="text-sm mt-2">(Reviews API requires authentication)</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button 
            className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed flex-1 sm:flex-none"
            disabled
            title="Login required"
          >
            📝 Write a Review
          </button>
          <button 
            className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed flex-1 sm:flex-none"
            disabled
            title="Login required"
          >
            ⭐ Rate Professor
          </button>
          <button 
            className="btn-secondary flex-1 sm:flex-none"
            onClick={() => router.push(`/?college_id=${professor.college_id}`)}
          >
            🏫 View College Professors
          </button>
        </div>

      </main>
    </div>
  );
}