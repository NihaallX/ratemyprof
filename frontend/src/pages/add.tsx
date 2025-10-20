/**
 * Add Professor Page
 * Allows users to submit new professor profiles for verification
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, User, Building, BookOpen, Plus, AlertCircle } from 'lucide-react';

interface CollegeOption {
  id: string;
  name: string;
}

export default function AddProfessor() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    college_id: '',
    department: '',
    subjects: '',
    bio: ''
  });
  
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch colleges on component mount
  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/colleges');
      if (response.ok) {
        const data = await response.json();
        setColleges(data);
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Professor name is required';
    }
    
    if (!formData.college_id) {
      newErrors.college_id = 'Please select a college';
    }
    
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    
    // Email validation removed as email is not stored
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      setNotification({ message: 'Please log in to add a professor', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = session?.access_token;
      if (!token) {
        setNotification({ message: 'Authentication token not found. Please log in again.', type: 'error' });
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/professors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          subjects: formData.subjects ? formData.subjects.split(',').map(s => s.trim()).filter(s => s) : []
        }),
      });

      if (response.ok) {
        setNotification({ 
          message: 'Professor submitted successfully! It will be reviewed by our team before being published.', 
          type: 'success' 
        });
        
        // Reset form
        setFormData({
          name: '',
          college_id: '',
          department: '',
          subjects: '',
          bio: ''
        });
        
        // Redirect after a delay
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        const errorData = await response.json();
        setNotification({ 
          message: errorData.detail || 'Failed to submit professor. Please try again.', 
          type: 'error' 
        });
      }
    } catch (error) {
      setNotification({ 
        message: 'Network error. Please check your connection and try again.', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Add Professor - RateMyProf India</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center">
              <Link href="/">
                <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center mb-2">
                <Plus className="w-6 h-6 text-indigo-600 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">Add a Professor</h1>
              </div>
              <p className="text-gray-600">
                Help expand our database by adding a professor who isn't listed yet. 
                All submissions are reviewed before being published.
              </p>
            </div>

            {/* Notification */}
            {notification && (
              <div className={`mx-6 mt-4 p-4 rounded-lg ${
                notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {notification.message}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Professor Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professor Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Dr. Jane Smith"
                  />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* College */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <select
                    name="college_id"
                    value={formData.college_id}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.college_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a college</option>
                    {colleges.map((college) => (
                      <option key={college.id} value={college.id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.college_id && <p className="mt-1 text-sm text-red-600">{errors.college_id}</p>}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Computer Science"
                />
                {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
              </div>

              {/* Email field removed - not stored in database */}

              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjects Taught (Optional)
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="subjects"
                    value={formData.subjects}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Data Structures, Algorithms, Machine Learning"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">Separate multiple subjects with commas</p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief description about the professor's background, specializations, etc."
                />
              </div>

              {/* Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Submission Guidelines</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ensure the professor is not already listed on our platform</li>
                  <li>• Provide accurate and complete information</li>
                  <li>• All submissions will be verified before publication</li>
                  <li>• You'll be notified once your submission is reviewed</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Link href="/">
                  <button
                    type="button"
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}