import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Globe, MapPin, Calendar, Users, GraduationCap } from 'lucide-react';
import CollegeReviews from '../../components/CollegeReviews';

interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  college_type: string;
  established_year?: number;
  website?: string;
  total_professors: number;
  email_domain?: string;
  created_at?: string;
  updated_at?: string;
}

interface Professor {
  id: string;
  name: string;
  department: string;
  specialization?: string;
  average_rating?: number;
  total_reviews?: number;
}

interface CollegeDetailProps {}

export default function CollegeDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [college, setCollege] = useState<College | null>(null);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch college details
        const collegeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1'}/colleges/${id}`);
        
        if (!collegeResponse.ok) {
          console.error('College not found');
          setIsLoading(false);
          return;
        }
        
        const collegeData = await collegeResponse.json();
        setCollege(collegeData);
        
        // Fetch professors for this college
        const professorsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1'}/professors?college_id=${id}&limit=50`);
        
        if (professorsResponse.ok) {
          const professorsData = await professorsResponse.json();
          setProfessors(professorsData.professors || []);
        }
      } catch (error) {
        console.error('Error fetching college data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading college details...</p>
        </div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">College Not Found</h1>
          <p className="text-gray-600 mb-4">The college you're looking for doesn't exist.</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{college.name} - RateMyProf India</title>
        <meta name="description" content={`Learn about ${college.name} in ${college.city}, ${college.state}. Find professors, reviews, and more.`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Link>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{college.name}</h1>
                <div className="flex items-center gap-4 text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{college.city}, {college.state}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                    <span>{college.college_type}</span>
                  </div>
                  {college.established_year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Est. {college.established_year}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {college.website && (
                <a
                  href={college.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* College Reviews Section - Moved to Top */}
          <div className="mb-8">
            <CollegeReviews
              collegeId={college.id}
              collegeName={college.name}
              canReview={isAuthenticated}
              onReviewSubmitted={() => {
                // Optionally refresh college data or show success message
                console.log('Review submitted successfully');
              }}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{college.total_professors}</h3>
                  <p className="text-gray-600">Professors</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{college.college_type}</h3>
                  <p className="text-gray-600">Institution Type</p>
                </div>
              </div>
            </div>
            
            {college.established_year && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {new Date().getFullYear() - college.established_year} Years
                    </h3>
                    <p className="text-gray-600">Experience</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* College Information */}
          <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">College Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <p className="text-gray-900">{college.city}, {college.state}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution Type</label>
                <p className="text-gray-900">{college.college_type}</p>
              </div>
              
              {college.established_year && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Established</label>
                  <p className="text-gray-900">{college.established_year}</p>
                </div>
              )}
              
              {college.email_domain && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Domain</label>
                  <p className="text-gray-900 font-mono">@{college.email_domain}</p>
                </div>
              )}
              
              {college.website && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Official Website</label>
                  <a
                    href={college.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    {college.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Professors */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Professors ({professors.length})
              </h2>
              <Link
                href={`/professors/add?college_id=${college.id}`}
                className="text-sm text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#4e46e5' }}
              >
                Add Professor
              </Link>
            </div>
            
            {professors.length === 0 ? (
              <p className="text-gray-600">No professors found for this college.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {professors.map((professor) => (
                  <Link
                    key={professor.id}
                    href={`/professors/${professor.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{professor.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{professor.department}</p>
                    {professor.specialization && (
                      <p className="text-xs text-gray-500 mb-2">{professor.specialization}</p>
                    )}
                    {professor.average_rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-yellow-600">
                          ⭐ {professor.average_rating.toFixed(1)}
                        </span>
                        {professor.total_reviews && (
                          <span className="text-xs text-gray-500">
                            ({professor.total_reviews} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}