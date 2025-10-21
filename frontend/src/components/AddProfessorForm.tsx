import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_LEGACY_BASE } from '../config/api';

interface College {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface AddProfessorFormData {
  name: string;
  email: string;
  department: string;
  designation: string;
  college_id: string;
  subjects: string[];
}

const AddProfessorForm: React.FC = () => {
  const { user, session } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState<AddProfessorFormData>({
    name: '',
    email: '',
    department: '',
    designation: '',
    college_id: '',
    subjects: [],
  });

  // Fetch colleges on component mount
  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch(`${API_LEGACY_BASE}/colleges`);
      if (response.ok) {
        const data = await response.json();
        setColleges(data.colleges || data || []);
      } else {
        // Fallback to hardcoded college if API fails
        setColleges([
          { id: 'VU-PUNE-001', name: 'Vishwakarma University', city: 'Pune', state: 'Maharashtra' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
      // Fallback to hardcoded college
      setColleges([
        { id: 'VU-PUNE-001', name: 'Vishwakarma University', city: 'Pune', state: 'Maharashtra' }
      ]);
    }
  };

  const handleInputChange = (field: keyof AddProfessorFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addSubject = () => {
    if (newSubject.trim() && !formData.subjects.includes(newSubject.trim())) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, newSubject.trim()],
      }));
      setNewSubject('');
    }
  };

  const removeSubject = (subjectToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(subject => subject !== subjectToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubject();
    }
  };

  const validateForm = (): boolean => {
    const requiredFields = ['name', 'department', 'college_id'];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof AddProfessorFormData]) {
        setMessage(`${field.replace('_', ' ')} is required.`);
        return false;
      }
    }

    if (formData.email && !formData.email.includes('@')) {
      setMessage('Please enter a valid email address.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check if user is logged in
    if (!user || !session) {
      setMessage('You need to be logged in to add a professor.');
      return;
    }

    console.log('User authenticated:', user.email);
    console.log('Session token available:', !!session.access_token);

    // Rate limiting: Check last submission time (5 hours = 18000000 ms)
    const lastSubmission = localStorage.getItem('lastProfessorSubmission');
    const now = Date.now();
    const cooldownPeriod = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
    
    if (lastSubmission && (now - parseInt(lastSubmission)) < cooldownPeriod) {
      const remainingTime = cooldownPeriod - (now - parseInt(lastSubmission));
      const hoursLeft = Math.ceil(remainingTime / (60 * 60 * 1000));
      setMessage(`Please wait ${hoursLeft} more hour(s) before submitting another professor. This prevents spam.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name,
        email: formData.email || undefined,
        department: formData.department,
        designation: formData.designation,
        college_id: formData.college_id,
        subjects: formData.subjects,
        message: `Professor ${formData.name} submitted by user ${user.email}`, // Add context for admin
      };

      const response = await fetch(`${API_LEGACY_BASE}/professors/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store submission timestamp for rate limiting
        localStorage.setItem('lastProfessorSubmission', now.toString());
        
        setMessage('Professor added successfully! Your submission will be reviewed and should appear in search results within 24 hours. You can submit another professor in 5 hours.');

        // Reset form
        setFormData({
          name: '',
          email: '',
          department: '',
          designation: '',
          college_id: '',
          subjects: [],
        });
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        console.error('Professor submission failed:', errorData);
        setMessage(errorData.detail || errorData.message || `Failed to add professor. Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          👨‍🏫 Add New Professor
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          Can't find a professor? Add them to our database! Your submission will be reviewed before it appears in search results.
        </p>
      </div>
      
      <div className="p-6">
        {message && (
          <div className={`mb-4 p-3 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              id="name"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Professor's full name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
            <input
              id="email"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="professor@college.edu"
            />
          </div>

          {/* College and Department */}
          <div>
            <label htmlFor="college" className="block text-sm font-medium text-gray-700 mb-1">College *</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.college_id} 
              onChange={(e) => handleInputChange('college_id', e.target.value)}
              required
            >
              <option value="">Select a college</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name} - {college.city}, {college.state}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <input
                id="department"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="e.g., Computer Science"
                required
              />
            </div>
            
            <div>
              <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.designation} 
                onChange={(e) => handleInputChange('designation', e.target.value)}
              >
                <option value="">Select designation</option>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Senior Lecturer">Senior Lecturer</option>
                <option value="Adjunct Professor">Adjunct Professor</option>
                <option value="Visiting Professor">Visiting Professor</option>
              </select>
            </div>
          </div>

          {/* Subjects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subjects Taught</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a subject..."
              />
              <button 
                type="button" 
                onClick={addSubject} 
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                ➕
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.subjects.map((subject, index) => (
                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {subject}
                  <button
                    type="button"
                    onClick={() => removeSubject(subject)}
                    className="ml-1 text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Review Process Information */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h4 className="font-medium text-blue-900 mb-2">Review Process</h4>
            <p className="text-sm text-blue-800">
              All professor submissions are reviewed by our team before being made public. This helps ensure 
              data accuracy and prevents duplicate entries. You'll be notified once your submission is approved.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Professor Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProfessorForm;