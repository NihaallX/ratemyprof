import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Globe, MapPin, Calendar, Users, GraduationCap, Search } from 'lucide-react';
import CollegeReviews from '../../components/CollegeReviews';
import CompareColleges from '../../components/CompareColleges';

/**
 * Validates if the provided ID is a valid college ID format
 * Accepts both UUID v4 format and custom college IDs (e.g., VU-PUNE-001)
 * Prevents SSRF/injection attacks by ensuring only valid formats are used in API calls
 */
function isValidCollegeId(id: string | string[] | undefined): id is string {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  // Custom college ID format: Letters, numbers, hyphens (e.g., VU-PUNE-001, MIT-MANIPAL-2024)
  // Max length 50 chars to prevent abuse
  const customIdRegex = /^[A-Z0-9][A-Z0-9\-]{0,48}[A-Z0-9]$/i;
  
  return uuidV4Regex.test(id) || customIdRegex.test(id);
}

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
  const [filteredProfessors, setFilteredProfessors] = useState<Professor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    // Validate college ID before making any API calls
    if (!isValidCollegeId(id)) {
      if (id) {
        // ID exists but is invalid
        console.error('Invalid college ID format:', id);
        setIsLoading(false);
      }
      return;
    }

    // ID is validated - safe to use in API calls
    const validatedId = id as string;

    const fetchData = async (collegeId: string) => {
      try {
        setIsLoading(true);
        
        // Fetch college details - using validated ID parameter
        const collegeUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1'}/colleges/${collegeId}`;
        console.log('🔍 Fetching college from:', collegeUrl);
        const collegeResponse = await fetch(collegeUrl);
        console.log('📡 College response status:', collegeResponse.status);
        
        if (!collegeResponse.ok) {
          console.error('❌ College not found - Status:', collegeResponse.status);
          setIsLoading(false);
          return;
        }
        
        const collegeData = await collegeResponse.json();
        console.log('✅ College data:', collegeData);
        setCollege(collegeData);
        
        // Fetch ALL professors for this college (backend max limit is 200) - using validated ID
        const professorsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1'}/professors?college_id=${collegeId}&limit=200`);
        
        if (professorsResponse.ok) {
          const professorsData = await professorsResponse.json();
          const profsList = professorsData.professors || [];
          setProfessors(profsList);
          setFilteredProfessors(profsList);
          
          // Extract unique departments for filter
          const uniqueDepts = Array.from(
            new Set(
              profsList
                .map((p: Professor) => p.department)
                .filter((dept): dept is string => Boolean(dept))
            )
          ) as string[];
          setDepartments(uniqueDepts.sort());
        }
      } catch (error) {
        console.error('Error fetching college data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Call fetchData with the validated ID
    fetchData(validatedId);
  }, [id]);

  // Filter professors when department selection changes
  useEffect(() => {
    if (selectedDepartment === 'all') {
      setFilteredProfessors(professors);
    } else {
      setFilteredProfessors(professors.filter(p => p.department === selectedDepartment));
    }
  }, [selectedDepartment, professors]);

  // Filter professors by search query (letter-by-letter search)
  useEffect(() => {
    let result = professors;
    
    // Filter by department
    if (selectedDepartment !== 'all') {
      result = result.filter(p => p.department === selectedDepartment);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.department.toLowerCase().includes(query) ||
        (p.specialization && p.specialization.toLowerCase().includes(query))
      );
    }
    
    setFilteredProfessors(result);
  }, [selectedDepartment, searchQuery, professors]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading college details...</p>
        </div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">College Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">The college you're looking for doesn't exist.</p>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{college.name} Professor Reviews & Ratings | RateMyProf India</title>
        <meta 
          name="description" 
          content={`Browse ${professors.length} professor reviews at ${college.name} in ${college.city}, ${college.state}. Find top-rated faculty${departments.length > 0 ? ` in ${departments.slice(0, 3).join(', ')}${departments.length > 3 ? ' and more' : ''}` : ''}. Student ratings for teaching quality and course difficulty.`}
        />
        <meta 
          name="keywords" 
          content={`${college.name}, ${college.city} colleges, professor reviews ${college.city}, ${college.name} faculty ratings, ${college.state} universities, student reviews`}
        />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={`${college.name} - Professor Reviews & Ratings`} />
        <meta property="og:description" content={`${professors.length} professors reviewed by students. ${college.college_type} in ${college.city}.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://ratemyprof.me/colleges/${college.id}/`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${college.name} Professor Reviews`} />
        <meta name="twitter:description" content={`${professors.length} professors reviewed by students`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://ratemyprof.me/colleges/${college.id}/`} />
        
        {/* Structured Data - EducationalOrganization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": college.name,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": college.city,
                "addressRegion": college.state,
                "addressCountry": "IN"
              },
              ...(college.website && { "url": college.website }),
              ...(college.established_year && { "foundingDate": college.established_year.toString() }),
              "description": `${college.college_type} in ${college.city}, ${college.state} with ${professors.length} faculty members.`
            })
          }}
        />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors duration-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link href="/" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Link>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{college.name}</h1>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300 mb-4">
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
          {/* Compare & Explore Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl dark:shadow-gray-900/50 dark:hover:shadow-indigo-500/30 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Compare & Explore</h2>
              <button
                onClick={() => setShowCompareModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Compare Colleges
              </button>
            </div>
          </div>

          {/* Compare Modal */}
          {showCompareModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-backdropFadeIn">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden animate-modalFadeIn">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compare Colleges</h2>
                  <button
                    onClick={() => setShowCompareModal(false)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6">
                  <CompareColleges
                    currentCollegeId={college.id}
                    currentCollegeName={college.name}
                    onClose={() => setShowCompareModal(false)}
                  />
                </div>
              </div>
            </div>
          )}

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
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl dark:shadow-gray-900/50 dark:hover:shadow-blue-500/30 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 animate-scaleIn stagger-1 hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg shadow-sm">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{college.total_professors}</h3>
                  <p className="text-gray-600 dark:text-gray-300">Professors</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl dark:shadow-gray-900/50 dark:hover:shadow-green-500/30 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 animate-scaleIn stagger-2 hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg shadow-sm">
                  <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{college.college_type}</h3>
                  <p className="text-gray-600 dark:text-gray-300">Institution Type</p>
                </div>
              </div>
            </div>
            
            {college.established_year && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl dark:shadow-gray-900/50 dark:hover:shadow-purple-500/30 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 animate-scaleIn stagger-3 hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-lg shadow-sm">
                    <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {new Date().getFullYear() - college.established_year} Years
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">Experience</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* College Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl dark:shadow-gray-900/50 dark:hover:shadow-indigo-500/30 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">College Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <p className="text-gray-900 dark:text-white">{college.city}, {college.state}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Institution Type</label>
                <p className="text-gray-900 dark:text-white">{college.college_type}</p>
              </div>
              
              {college.established_year && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Established</label>
                  <p className="text-gray-900 dark:text-white">{college.established_year}</p>
                </div>
              )}
              
              {college.email_domain && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Domain</label>
                  <p className="text-gray-900 dark:text-white font-mono">@{college.email_domain}</p>
                </div>
              )}
              
              {college.website && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Official Website</label>
                  <a
                    href={college.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
                  >
                    {college.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Professors */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border dark:border-gray-700 transition-colors duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Professors ({filteredProfessors.length})
              </h2>
              <Link
                href={`/professors/add?college_id=${college.id}`}
                className="text-sm text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#4e46e5' }}
              >
                Add Professor
              </Link>
            </div>
            
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search professors by name, department, or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            {/* Department Filter */}
            {departments.length > 1 && (
              <div className="mb-4">
                <label htmlFor="department-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Department
                </label>
                <select
                  id="department-filter"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                >
                  <option value="all">All Departments ({professors.length})</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} ({professors.filter(p => p.department === dept).length})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {filteredProfessors.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">
                {searchQuery || selectedDepartment !== 'all'
                  ? 'No professors found matching your search criteria.' 
                  : 'No professors found for this college.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProfessors.map((professor, index) => (
                  <Link
                    key={professor.id}
                    href={`/professors/${professor.id}`}
                    className={`block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 animate-fadeSlideUp stagger-${Math.min(index + 1, 6)} shadow-sm hover:shadow-md`}
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{professor.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{professor.department}</p>
                    {professor.specialization && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{professor.specialization}</p>
                    )}
                    {professor.average_rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                          ⭐ {professor.average_rating.toFixed(1)}
                        </span>
                        {professor.total_reviews && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
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