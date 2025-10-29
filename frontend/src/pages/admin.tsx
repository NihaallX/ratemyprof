import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Shield, Users, Flag, Check, ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import AdminLoginModal from '../components/AdminLoginModal';
import { supabase } from '../lib/supabase';
import { Professor } from '../services/api';
import { API_BASE_URL, API_BASE } from '../config/api';

const AdminPage: NextPage = () => {
  const router = useRouter();
  const { user, session, loading: authLoading, signIn } = useAuth();
  const { showToast, showConfirm } = useNotification();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [stats, setStats] = useState({
    flaggedReviews: 0,
    pendingProfessors: 0,
    totalUsers: 0,
    totalProfessors: 0,
    pendingApproval: 0,
  });
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [pendingProfessors, setPendingProfessors] = useState([]);
  const [users, setUsers] = useState([]);
  const [allProfessors, setAllProfessors] = useState<Professor[]>([]);
  const [pendingApprovalProfessors, setPendingApprovalProfessors] = useState([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reviews' | 'professors' | 'users' | 'all-professors' | 'pending-approval' | 'professor-reviews' | 'college-reviews'>('dashboard');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<any>(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Filters and pagination for All Professors tab
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'reviews' | 'rating'>('reviews');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingAllProfessors, setIsLoadingAllProfessors] = useState(false);
  const [professorsLoaded, setProfessorsLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProfessorsCount, setTotalProfessorsCount] = useState(0);
  const PAGE_SIZE = 100;

  // Professor Reviews Moderation state
  const [professorReviews, setProfessorReviews] = useState([]);
  const [professorReviewStats, setProfessorReviewStats] = useState({
    total_reviews: 0,
    pending_reviews: 0,
    approved_reviews: 0,
    removed_reviews: 0,
    flagged_reviews: 0,
    total_flags: 0
  });
  const [professorReviewStatusFilter, setProfessorReviewStatusFilter] = useState<string>('pending');
  const [isLoadingProfessorReviews, setIsLoadingProfessorReviews] = useState(false);

  // College Reviews Moderation state
  const [flaggedCollegeReviews, setFlaggedCollegeReviews] = useState([]);
  const [allCollegeReviews, setAllCollegeReviews] = useState([]);
  const [collegeReviewStats, setCollegeReviewStats] = useState({
    pending_college_review_flags: 0,
    total_college_review_flags: 0,
    flagged_college_reviews: 0,
    total_college_reviews: 0,
  });
  const [collegeReviewStatusFilter, setCollegeReviewStatusFilter] = useState<string>('pending');
  const [isLoadingCollegeReviews, setIsLoadingCollegeReviews] = useState(false);

  const showAdminWelcomeNotification = () => {
    setShowWelcomeModal(true);
    setTimeout(() => setShowWelcomeModal(false), 4000);
  };

  const handleAdminLogin = async (email: string, password: string) => {
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Check if the logged in user is admin
      const isAdminUser = email === 'admin@gmail.com' || email.endsWith('@ratemyprof.in');
      if (!isAdminUser) {
        return { success: false, error: 'Access denied. Admin credentials required.' };
      }
      
      setShowAdminLoginModal(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const loadRealTimeStats = async () => {
    try {
      console.log('Loading admin dashboard stats (lightweight)...');
      
      // Get admin token using the admin login API
      let adminToken = null;
      
      // Try to get from stored session first
      const storedSession = localStorage.getItem('adminSession');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          adminToken = sessionData.access_token;
          console.log('Using stored admin session token');
        } catch (e) {
          console.log('Failed to parse stored session');
        }
      }
      
      // If no stored token, try to login as admin
      if (!adminToken) {
        try {
          const adminLoginResponse = await fetch(`${API_BASE}/api/moderation/admin/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: 'admin@gmail.com',
              password: 'gauravnihal123'
            })
          });
          
          if (adminLoginResponse.ok) {
            const adminData = await adminLoginResponse.json();
            adminToken = adminData.access_token;
            localStorage.setItem('adminSession', JSON.stringify(adminData));
            console.log('Admin login successful, got token');
          } else {
            console.log('Admin login failed');
          }
        } catch (loginError) {
          console.log('Admin login error:', loginError);
        }
      }
      
      console.log('Admin token available:', !!adminToken);
      
      const headers = adminToken ? {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };
      
      // Use single optimized endpoint for all dashboard stats
      if (adminToken) {
        try {
          const statsResponse = await fetch(`${API_BASE}/api/moderation/dashboard/stats`, { headers });
          if (statsResponse.ok) {
            const stats = await statsResponse.json();
            
            // Update all state from single response
            setStats({
              totalProfessors: stats.total_professors || 0,
              pendingProfessors: stats.professors_with_no_reviews || 0,
              flaggedReviews: stats.flagged_reviews_count || 0,
              pendingApproval: stats.pending_professors || 0,
              totalUsers: stats.total_users || 0
            });
            
            // Set recent data for tables
            setFlaggedReviews(stats.recent_flagged_reviews || []);
            setPendingApprovalProfessors(stats.recent_pending_professors || []);
            setUsers(stats.recent_users || []);
            
            setIsLoading(false);
            return;
          }
        } catch (statsError) {
          console.log('Optimized stats endpoint not available, falling back to old method:', statsError);
        }
      }
      
      // Fallback: Load minimal data for dashboard stats (old method)
      // Just get counts, don't load full datasets
      // Fetch enough professors to calculate "no reviews" count accurately
      const professorsResponse = await fetch(`${API_BASE}/api/professors?limit=200&offset=0`, { headers });
      let professors = [];
      if (professorsResponse.ok) {
        const professorsData = await professorsResponse.json();
        professors = Array.isArray(professorsData.professors) ? professorsData.professors : [];
      }
      
      // Try to load admin-specific data if we have admin token
      let flaggedReviews = [];
      let users = [];
      let pendingApprovalProfs = [];
      
      if (adminToken) {
        try {
          // Load flagged reviews
          const flaggedResponse = await fetch(`${API_BASE}/api/moderation/reviews`, { headers });
          if (flaggedResponse.ok) {
            const flaggedData = await flaggedResponse.json();
            flaggedReviews = Array.isArray(flaggedData.flagged_reviews) ? flaggedData.flagged_reviews : [];
            setFlaggedReviews(flaggedReviews);
          }
          
          // Load users (when table exists)
          const usersResponse = await fetch(`${API_BASE}/api/moderation/users`, { headers });
          console.log('Users response status:', usersResponse.status);
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            console.log('Raw users data:', usersData);
            users = Array.isArray(usersData) ? usersData : [];
            console.log('Processed users array:', users, 'Length:', users.length);
            setUsers(users);
          } else {
            console.log('Users response not ok:', await usersResponse.text());
          }
          
          // Load pending professors
          const pendingResponse = await fetch(`${API_BASE}/api/moderation/professors/pending`, { headers });
          if (pendingResponse.ok) {
            const pendingData = await pendingResponse.json();
            pendingApprovalProfs = Array.isArray(pendingData.professors) ? pendingData.professors : [];
            setPendingApprovalProfessors(pendingApprovalProfs);
          }
        } catch (adminError) {
          console.log('Admin endpoints not available yet:', adminError);
        }
      }
      
      // Calculate real stats from actual data
      // Use the professors array we just fetched (limit=200 should cover all in dev)
      const pendingProfessors = professors.filter((prof: any) => prof.total_reviews === 0);
      const flaggedCount = flaggedReviews.length;
      const pendingApprovalCount = pendingApprovalProfs.length;
      
      // We'll get these counts from the API metadata instead of loading full data
      
      // Get total professors count from API metadata
      let totalProfsCount = professors.length;
      try {
        const countResponse = await fetch(`${API_BASE}/api/professors?limit=1`, { headers });
        if (countResponse.ok) {
          const countData = await countResponse.json();
          totalProfsCount = countData.total || professors.length;
        }
      } catch (e) {
        console.log('Could not fetch total professors count');
      }

      setStats({
        flaggedReviews: flaggedCount,
        pendingProfessors: pendingProfessors.length,
        totalUsers: users.length || 0,
        totalProfessors: totalProfsCount,
        pendingApproval: pendingApprovalCount,
      });
      
      setPendingProfessors(pendingProfessors);
      
      console.log('Dashboard stats loaded:', {
        totalProfessors: totalProfsCount,
        flaggedReviews: flaggedCount,
        pendingProfessors: pendingProfessors.length,
        pendingApproval: pendingApprovalCount,
        registeredUsers: users.length
      });
      
    } catch (error) {
      console.error('Error loading real-time stats:', error);
      // Set empty arrays but don't override existing data
      setStats(prevStats => ({
        ...prevStats,
        flaggedReviews: 0,
        pendingProfessors: 0,
        totalUsers: 0,
        totalProfessors: 0,
        pendingApproval: 0,
      }));
    }
  };

  useEffect(() => {
    console.log('Admin page loading...');
    
    // Skip Supabase user authentication and go directly to admin API authentication
    const checkAdminAccess = async () => {
      try {
        // Try to load admin data directly
        await loadRealTimeStats();
        setIsAdmin(true);
        setIsLoading(false);
        
        // Show success notification
        const hasSeenAdminWelcome = sessionStorage.getItem('adminWelcomeShown');
        if (!hasSeenAdminWelcome) {
          showAdminWelcomeNotification();
          sessionStorage.setItem('adminWelcomeShown', 'true');
        }
      } catch (error) {
        console.log('Admin access check failed:', error);
        setIsLoading(false);
      }
    };
    
    checkAdminAccess();
  }, []);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (isAdmin) {
      const interval = setInterval(() => {
        console.log('Auto-refreshing admin data...');
        loadRealTimeStats();
      }, 300000); // 5 minutes (300 seconds)

      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  // Load all professors when user switches to that tab
  useEffect(() => {
    if (activeTab === 'all-professors' && !professorsLoaded) {
      loadAllProfessors();
    }
  }, [activeTab]);

  // Load all users when user switches to Users tab
  useEffect(() => {
    if (activeTab === 'users' && users.length <= 5) {
      loadAllUsers();
    }
  }, [activeTab]);

  // Manual refresh function
  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    loadRealTimeStats();
  };

  // Load all users (called when user clicks "Users" tab)
  const loadAllUsers = async () => {
    try {
      const adminToken = localStorage.getItem('adminSession');
      if (!adminToken) {
        console.log('No admin token found');
        return;
      }

      const sessionData = JSON.parse(adminToken);
      const headers = {
        'Authorization': `Bearer ${sessionData.access_token}`,
        'Content-Type': 'application/json'
      };

      console.log('Loading all users...');
      const usersResponse = await fetch(`${API_BASE}/api/moderation/users`, { headers });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('All users loaded:', usersData.length);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else {
        console.log('Failed to load users:', await usersResponse.text());
      }
    } catch (error) {
      console.error('Error loading all users:', error);
    }
  };

  // Load all professors (called when user clicks "All Professors" tab)
  const loadAllProfessors = async () => {
    if (professorsLoaded || isLoadingAllProfessors) {
      return; // Already loaded or currently loading
    }

    setIsLoadingAllProfessors(true);
    console.log('Loading all professors...');

    try {
      // Get admin token
      let adminToken = null;
      const storedSession = localStorage.getItem('adminSession');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          adminToken = sessionData.access_token;
        } catch (e) {
          console.log('Failed to parse stored session');
        }
      }

      const headers = adminToken ? {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      } : { 'Content-Type': 'application/json' };

      // Fetch all professors in batches
      let allProfs = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`${API_BASE}/api/professors?limit=${limit}&offset=${offset}`, { headers });
        if (response.ok) {
          const data = await response.json();
          const batch = Array.isArray(data.professors) ? data.professors : [];
          allProfs.push(...batch);
          hasMore = data.has_more && batch.length === limit;
          offset += limit;

          // Update UI progressively
          setAllProfessors([...allProfs]);
          console.log(`Loaded ${allProfs.length} professors so far...`);
        } else {
          hasMore = false;
        }
      }

      setAllProfessors(allProfs);
      // Don't override the count - let loadRealTimeStats handle it
      // setTotalProfessorsCount(allProfs.length);
      setProfessorsLoaded(true);
      console.log(`Finished loading all ${allProfs.length} professors`);
    } catch (error) {
      console.error('Error loading all professors:', error);
    } finally {
      setIsLoadingAllProfessors(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch professors data 
      const professorsResponse = await fetch(`${API_BASE}/api/professors`);
      if (professorsResponse.ok) {
        const professorsResult = await professorsResponse.json();
        const professorsData = professorsResult.professors || [];
        setAllProfessors(professorsData);
        
        // For now, treat professors with 0 reviews as "pending" verification
        const pending = professorsData.filter((prof: any) => prof.total_reviews === 0);
        setPendingProfessors(pending);
        
        // Count total unique users from professor reviews
        let totalReviews = 0;
        professorsData.forEach((prof: any) => {
          totalReviews += prof.total_reviews;
        });

        // Fetch real users from the moderation API
        let realUsers = [];
        try {
          // Get the current Supabase session token
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const usersResponse = await fetch(`${API_BASE}/api/moderation/users`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (usersResponse.ok) {
              const usersData = await usersResponse.json();
              realUsers = usersData.map((user: any) => ({
                id: user.id,
                email: user.email,
                name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email.split('@')[0],
                full_name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'Not provided',
                last_login: 'Not available',
                registration_date: user.created_at,
                status: user.is_active ? 'active' : 'banned',
                reviews_count: user.total_reviews || 0,
                flags_submitted: user.total_flags_submitted || 0,
                is_active: user.is_active
              }));
              console.log(`Fetched ${realUsers.length} real users from API`);
            }
          }
        } catch (error) {
          console.error('Failed to fetch real users:', error);
        }

        setUsers(realUsers);
        
        // Fetch pending approval professors from API (professors that need admin approval)
        let pendingApprovalProfessors = [];
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const pendingResponse = await fetch(`${API_BASE}/api/moderation/professors/pending`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (pendingResponse.ok) {
              const pendingData = await pendingResponse.json();
              pendingApprovalProfessors = pendingData.professors || pendingData || [];
              console.log(`Fetched ${pendingApprovalProfessors.length} pending professors for approval`);
            }
          }
        } catch (error) {
          console.error('Failed to fetch pending professors:', error);
        }
        
        setPendingApprovalProfessors(pendingApprovalProfessors);
        
        setStats({
          flaggedReviews: 0, // Will be updated if endpoint works
          pendingProfessors: pending.length,
          totalUsers: realUsers.length,
          totalProfessors: professorsData.length,
          pendingApproval: pendingApprovalProfessors.length
        });
        
        console.log(`Fetched ${professorsData.length} professors, ${pending.length} pending verification, ${realUsers.length} real users`);
      }

      // Try to fetch flagged reviews (might fail if endpoint has issues)
      try {
        // Get admin token from localStorage or Supabase session
        let authToken = null;
        const storedSession = localStorage.getItem('adminSession');
        if (storedSession) {
          try {
            const sessionData = JSON.parse(storedSession);
            authToken = sessionData.access_token;
          } catch (e) {
            console.log('Failed to parse stored admin session');
          }
        }
        
        // Fallback to Supabase session if no admin token
        if (!authToken) {
          const { data: { session } } = await supabase.auth.getSession();
          authToken = session?.access_token;
        }
        
        if (authToken) {
          const flaggedResponse = await fetch(`${API_BASE}/api/moderation/reviews`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (flaggedResponse.ok) {
            const flaggedData = await flaggedResponse.json();
            const reviews = flaggedData.reviews || [];
            setFlaggedReviews(reviews);
            setStats(prev => ({ ...prev, flaggedReviews: reviews.length }));
          }
        }
      } catch (flaggedError) {
        console.log('Flagged reviews endpoint not available:', flaggedError);
        setFlaggedReviews([]);
      }

    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  // Management functions
  const handleReviewAction = async (reviewId: string, action: 'approve' | 'delete') => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/reviews/${reviewId}/${action}`, {
        method: 'POST'
      });
      if (response.ok) {
        await loadRealTimeStats(); // Refresh data with proper count
      }
    } catch (error) {
      console.error(`Failed to ${action} review:`, error);
    }
  };

  const handleProfessorVerify = async (professorId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/verify-professor/${professorId}`, {
        method: 'POST'
      });
      if (response.ok) {
        await loadRealTimeStats(); // Refresh data with proper count
      }
    } catch (error) {
      console.error('Failed to verify professor:', error);
    }
  };

  const handleProfessorDelete = async (professorId: string) => {
    showConfirm(
      'Are you sure you want to delete this professor? This action cannot be undone.',
      async () => {
        try {
          // First, get admin token
          const adminLoginResponse = await fetch(`${API_BASE}/api/moderation/admin/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: 'admin@gmail.com',
              password: 'gauravnihal123'
            })
          });

          if (!adminLoginResponse.ok) {
            throw new Error('Failed to authenticate as admin');
          }

          const adminData = await adminLoginResponse.json();
          const adminToken = adminData.access_token;

          // Now delete the professor with admin token
          const response = await fetch(`${API_BASE}/api/moderation/professors/${professorId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            // Remove professor from local state immediately
            setAllProfessors(prev => prev.filter(p => p.id !== professorId));
            setPendingApprovalProfessors(prev => prev.filter(p => p.id !== professorId));
            
            // Also refresh dashboard stats
            await loadRealTimeStats();
            showToast('Professor deleted successfully', 'success');
          } else {
            const errorData = await response.json();
            showToast(`Failed to delete professor: ${errorData.detail || 'Unknown error'}`, 'error');
          }
        } catch (error) {
          console.error('Failed to delete professor:', error);
          showToast('Failed to delete professor', 'error');
        }
      },
      'Delete Professor'
    );
  };

  const handleProfessorEdit = (professor: any) => {
    setEditingProfessor(professor);
    setShowEditModal(true);
  };

  const handleProfessorUpdate = async (updatedData: any) => {
    try {
      // First, get admin token
      const adminLoginResponse = await fetch(`${API_BASE}/api/moderation/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin@gmail.com',
          password: 'gauravnihal123'
        })
      });

      if (!adminLoginResponse.ok) {
        throw new Error('Failed to authenticate as admin');
      }

      const adminData = await adminLoginResponse.json();
      const adminToken = adminData.access_token;

      // Now update the professor with admin token
      const response = await fetch(`${API_BASE}/api/moderation/professors/${editingProfessor.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingProfessor(null);
        await loadRealTimeStats(); // Refresh data with proper count
        showToast('Professor updated successfully', 'success');
      } else {
        const errorData = await response.json();
        showToast(`Failed to update professor: ${errorData.detail || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Failed to update professor:', error);
      showToast('Failed to update professor', 'error');
    }
  };

  const handleUserAction = async (userId: string, action: 'warn' | 'suspend' | 'ban') => {
    const actionText = action === 'suspend' ? 'temporarily suspend' : action;
    showConfirm(
      `Are you sure you want to ${actionText} this user?`,
      async () => {
        try {
          const response = await fetch(`${API_BASE}/api/admin/users/${userId}/${action}`, {
            method: 'POST'
          });
          if (response.ok) {
            await loadRealTimeStats(); // Refresh data with proper count
            showToast(`User ${actionText}ed successfully`, 'success');
          }
        } catch (error) {
          console.error(`Failed to ${action} user:`, error);
          showToast(`Failed to ${action} user`, 'error');
        }
      },
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`
    );
  };

  // Professor Reviews Moderation Functions
  const loadProfessorReviews = async () => {
    setIsLoadingProfessorReviews(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('No session token available');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      // Load professor reviews with current filter
      const reviewsResponse = await fetch(
        `${API_BASE}/api/moderation/professor-reviews/all?status_filter=${professorReviewStatusFilter || 'all'}&limit=100`,
        { headers }
      );

      if (reviewsResponse.ok) {
        const data = await reviewsResponse.json();
        setProfessorReviews(data.reviews || []);
      }

      // Load stats
      const statsResponse = await fetch(
        `${API_BASE}/api/moderation/professor-reviews/stats`,
        { headers }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setProfessorReviewStats(statsData);
      }

    } catch (error) {
      console.error('Failed to load professor reviews:', error);
      showToast('Failed to load professor reviews', 'error');
    } finally {
      setIsLoadingProfessorReviews(false);
    }
  };

  const moderateProfessorReview = async (reviewId: string, action: 'approve' | 'remove', reason: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(
        `${API_BASE}/api/moderation/reviews/${reviewId}/action`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action, reason })
        }
      );

      if (response.ok) {
        showToast(`Review ${action}d successfully`, 'success');
        await loadProfessorReviews(); // Reload
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(`Failed to ${action} review: ${errorData.detail || response.statusText}`, 'error');
      }
    } catch (error) {
      console.error(`Failed to ${action} review:`, error);
      showToast(`Network error: Failed to ${action} review`, 'error');
    }
  };

  // College Reviews Moderation Functions
  const loadFlaggedCollegeReviews = async () => {
    setIsLoadingCollegeReviews(true);
    try {
      // Get admin token
      const storedSession = localStorage.getItem('adminSession');
      let adminToken = null;
      
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          adminToken = sessionData.access_token;
        } catch (e) {
          console.error('Failed to parse admin session');
        }
      }

      if (!adminToken) {
        const adminLoginResponse = await fetch(`${API_BASE}/api/moderation/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'admin@gmail.com',
            password: 'gauravnihal123'
          })
        });
        
        if (adminLoginResponse.ok) {
          const adminData = await adminLoginResponse.json();
          adminToken = adminData.access_token;
          localStorage.setItem('adminSession', JSON.stringify(adminData));
        }
      }

      if (!adminToken) {
        throw new Error('Failed to get admin token');
      }

      const headers = {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      };

      // Load flagged college reviews
      const flaggedResponse = await fetch(
        `${API_BASE}/v1/college-review-moderation/admin/flagged-reviews?status_filter=${collegeReviewStatusFilter || 'pending'}&limit=100`,
        { headers }
      );

      if (flaggedResponse.ok) {
        const data = await flaggedResponse.json();
        setFlaggedCollegeReviews(data.flagged_reviews || []);
      }

      // Load college review stats
      const statsResponse = await fetch(
        `${API_BASE}/v1/college-review-moderation/admin/stats`,
        { headers }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setCollegeReviewStats(statsData);
      }

    } catch (error) {
      console.error('Failed to load flagged college reviews:', error);
      showToast('Failed to load college reviews', 'error');
    } finally {
      setIsLoadingCollegeReviews(false);
    }
  };

  const loadAllCollegeReviews = async () => {
    try {
      const storedSession = localStorage.getItem('adminSession');
      let adminToken = null;
      
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        adminToken = sessionData.access_token;
      } else if (session?.access_token) {
        adminToken = session.access_token;
      }

      if (!adminToken) {
        console.warn('No admin token available for loading college reviews');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      };

      console.log('Loading all college reviews...');
      
      // Load all college reviews
      const response = await fetch(
        `${API_BASE}/v1/college-review-moderation/admin/all-reviews?limit=50`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('College reviews loaded:', data.reviews?.length || 0);
        setAllCollegeReviews(data.reviews || []);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Failed to load all reviews:', response.status, errorData);
        showToast(`Failed to load college reviews: ${errorData.detail || response.statusText}`, 'error');
      }

    } catch (error) {
      console.error('Failed to load all college reviews:', error);
      showToast('Network error loading college reviews', 'error');
    }
  };

  const handleCollegeReviewFlagAction = async (flagId: string, action: 'approve_flag' | 'dismiss_flag') => {
    try {
      const storedSession = localStorage.getItem('adminSession');
      let adminToken = null;
      
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        adminToken = sessionData.access_token;
      }

      if (!adminToken) {
        showToast('Admin authentication required', 'error');
        return;
      }

      const response = await fetch(
        `${API_BASE}/v1/college-review-moderation/admin/flags/${flagId}/review`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: action,
            admin_notes: action === 'approve_flag' ? 'Flagged content removed by admin' : 'Flag dismissed by admin'
          })
        }
      );

      if (response.ok) {
        showToast(
          action === 'approve_flag' ? 'Flag approved successfully' : 'Flag dismissed successfully',
          'success'
        );
        await loadFlaggedCollegeReviews(); // Reload data
      } else {
        const error = await response.json();
        showToast(error.detail || 'Action failed', 'error');
      }
    } catch (error) {
      console.error('Failed to process flag action:', error);
      showToast('Failed to process action', 'error');
    }
  };

  // Set up real-time updates
  // DISABLED: Old auto-refresh conflicting with loadRealTimeStats()
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (isAdmin) {
  //       fetchStats();
  //     }
  //   }, 30000); // Update every 30 seconds

  //   return () => clearInterval(interval);
  // }, [isAdmin]);

  // Load college reviews when tab changes
  useEffect(() => {
    if (isAdmin && activeTab === 'college-reviews') {
      loadFlaggedCollegeReviews();
      loadAllCollegeReviews();
    }
  }, [isAdmin, activeTab, collegeReviewStatusFilter]);

  // Load professor reviews when tab changes
  useEffect(() => {
    if (isAdmin && activeTab === 'professor-reviews') {
      loadProfessorReviews();
    }
  }, [isAdmin, activeTab, professorReviewStatusFilter]);

  // Show loading while checking auth
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Show login modal if user not authenticated
  if (shouldShowModal || showAdminLoginModal) {
    return (
      <>
        <Head>
          <title>Admin Login - RateMyProf</title>
          <meta name="description" content="Admin login for RateMyProf platform" />
        </Head>
        <AdminLoginModal
          isOpen={showAdminLoginModal}
          onClose={() => router.push('/')}
          onLogin={handleAdminLogin}
        />
      </>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin panel</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - RateMyProf</title>
        <meta name="description" content="Admin dashboard for managing RateMyProf platform" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link href="/">
                  <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Site
                  </button>
                </Link>
                <div className="flex items-center">
                  <Shield className="w-6 h-6 text-indigo-600 mr-2" />
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Refresh Data
                </button>
                <div className="text-sm text-gray-600">
                  Welcome, {user?.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab('reviews')}
            >
              <div className="flex items-center">
                <Flag className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Flagged Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.flaggedReviews}</p>
                </div>
              </div>
            </div>
            
            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab('professors')}
            >
              <div className="flex items-center">
                <Check className="w-8 h-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">No Reviews Yet</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingProfessors}</p>
                </div>
              </div>
            </div>
            
            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab('pending-approval')}
            >
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">New Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingApproval}</p>
                </div>
              </div>
            </div>
            
            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab('all-professors')}
            >
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Professors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProfessors}</p>
                </div>
              </div>
            </div>
            
            <div 
              className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab('users')}
            >
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Flagged Reviews ({stats.flaggedReviews})
              </button>
              <button
                onClick={() => setActiveTab('professors')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'professors'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                No Reviews Yet ({stats.pendingProfessors})
              </button>
              <button
                onClick={() => setActiveTab('pending-approval')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending-approval'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Approval ({stats.pendingApproval})
              </button>
              <button
                onClick={() => setActiveTab('all-professors')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all-professors'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Professors ({stats.totalProfessors})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users ({stats.totalUsers})
              </button>
              <button
                onClick={() => setActiveTab('professor-reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'professor-reviews'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Professor Reviews
              </button>
              <button
                onClick={() => setActiveTab('college-reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'college-reviews'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                College Reviews
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Moderation</h3>
                <p className="text-gray-600 mb-4">Review and moderate flagged reviews from users.</p>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  View Flagged Reviews
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Professor Management</h3>
                <p className="text-gray-600 mb-4">View professors with no reviews yet and verify new submissions.</p>
                <button 
                  onClick={() => setActiveTab('professors')}
                  className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                >
                  View No Reviews
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Professors</h3>
                <p className="text-gray-600 mb-4">Edit, delete, or manage all professors in the database.</p>
                <button 
                  onClick={() => setActiveTab('all-professors')}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Manage All Professors
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
                <p className="text-gray-600 mb-4">Manage user accounts and moderate user actions.</p>
                <button 
                  onClick={() => setActiveTab('users')}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Manage Users
                </button>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Flagged Reviews</h3>
              </div>
              <div className="p-6">
                {flaggedReviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No flagged reviews at the moment</p>
                ) : (
                  <div className="space-y-4">
                    {flaggedReviews.map((review: any) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">Review #{review.id}</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleReviewAction(review.id, 'approve')}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewAction(review.id, 'delete')}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{review.content}</p>
                        <p className="text-sm text-gray-500">Rating: {review.rating}/5</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'professors' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Professors With No Reviews Yet</h3>
                <p className="text-sm text-gray-600 mt-1">
                  These professors are verified and visible in search, but haven't received any student reviews yet.
                </p>
              </div>
              <div className="p-6">
                {pendingProfessors.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">All professors have reviews!</p>
                ) : (
                  <div className="space-y-4">
                    {pendingProfessors.map((professor: any) => (
                      <div key={professor.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{professor.name}</h4>
                          <span className="text-sm text-gray-500">No reviews yet</span>
                        </div>
                        <p className="text-gray-700">Department: {professor.department}</p>
                        <p className="text-gray-700">Designation: {professor.designation || 'Faculty'}</p>
                        <p className="text-gray-700">College ID: {professor.college_id}</p>
                        {professor.subjects && professor.subjects.length > 0 && (
                          <p className="text-gray-700">Subjects: {professor.subjects.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'all-professors' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">All Professors Management</h3>
                    <p className="text-sm text-gray-600 mt-1">Edit, delete, or manage all professors in the database</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {isLoadingAllProfessors ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Loading: {allProfessors.length} of {stats.totalProfessors}...
                      </span>
                    ) : (
                      <span>Total: {allProfessors.length} professors</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Professors</label>
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Department Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Departments</option>
                      {Array.from(new Set(allProfessors.map(p => p.department).filter(Boolean))).sort().map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'reviews' | 'rating')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="name">Name (A-Z)</option>
                      <option value="reviews">Most Reviews</option>
                      <option value="rating">Highest Rating</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {isLoadingAllProfessors && allProfessors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 mb-2">Loading professors...</p>
                    <p className="text-sm text-gray-500">This may take a moment for large databases</p>
                  </div>
                ) : (() => {
                  // Apply filters and sorting
                  let filtered = allProfessors.filter((prof: any) => {
                    const matchesSearch = !searchQuery || prof.name.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesDept = !departmentFilter || prof.department === departmentFilter;
                    return matchesSearch && matchesDept;
                  });
                  
                  // Apply sorting
                  filtered.sort((a: any, b: any) => {
                    if (sortBy === 'name') {
                      return a.name.localeCompare(b.name);
                    } else if (sortBy === 'reviews') {
                      return (b.total_reviews || 0) - (a.total_reviews || 0);
                    } else {
                      return (b.average_rating || 0) - (a.average_rating || 0);
                    }
                  });
                  
                  if (filtered.length === 0) {
                    return <p className="text-gray-500 text-center py-8">No professors match your filters</p>;
                  }
                  
                  return (
                    <>
                      <div className="mb-4 text-sm text-gray-600">
                        Showing {filtered.length} of {allProfessors.length} professors
                      </div>
                      <div className="space-y-4">
                        {filtered.map((professor: any) => (
                        <div key={professor.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{professor.name}</h4>
                              <p className="text-sm text-gray-600">Rating: {professor.average_rating.toFixed(1)}/5.0 ({professor.total_reviews} reviews)</p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleProfessorEdit(professor)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleProfessorDelete(professor.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-700">Department: {professor.department}</p>
                          <p className="text-gray-700">Designation: {professor.designation || 'Faculty'}</p>
                          <p className="text-gray-700">College ID: {professor.college_id}</p>
                          {professor.subjects && professor.subjects.length > 0 && (
                            <p className="text-gray-700">Subjects: {professor.subjects.join(', ')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
              </div>
            </div>
          )}

          {activeTab === 'pending-approval' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Professors Pending Approval</h3>
                <p className="text-sm text-gray-600 mt-1">Review and approve new professor submissions</p>
              </div>
              <div className="p-6">
                {pendingApprovalProfessors.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No professors pending approval</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApprovalProfessors.map((professor) => (
                      <div key={professor.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h4 className="text-lg font-semibold text-gray-900">{professor.name}</h4>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending Review
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-600"><strong>Email:</strong> {professor.email || 'Not provided'}</p>
                                <p className="text-sm text-gray-600"><strong>Department:</strong> {professor.department}</p>
                                <p className="text-sm text-gray-600"><strong>Designation:</strong> {professor.designation || 'Not specified'}</p>
                                <p className="text-sm text-gray-600"><strong>College ID:</strong> {professor.college_id}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600"><strong>Subjects:</strong> {professor.subjects ? professor.subjects.join(', ') : 'None specified'}</p>
                                <p className="text-sm text-gray-600"><strong>Experience:</strong> {professor.years_of_experience ? `${professor.years_of_experience} years` : 'Not specified'}</p>
                                <p className="text-sm text-gray-600"><strong>Submitted:</strong> {new Date(professor.created_at).toLocaleDateString()}</p>
                                {professor.biography && (
                                  <p className="text-sm text-gray-600"><strong>Biography:</strong> {professor.biography.length > 100 ? professor.biography.substring(0, 100) + '...' : professor.biography}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex space-x-3">
                              <button
                                onClick={async () => {
                                  try {
                                    // Get admin token from localStorage
                                    let token = null;
                                    const storedSession = localStorage.getItem('adminSession');
                                    if (storedSession) {
                                      try {
                                        const sessionData = JSON.parse(storedSession);
                                        token = sessionData.access_token;
                                      } catch (e) {
                                        console.error('Failed to parse admin session');
                                      }
                                    }
                                    
                                    if (!token) {
                                      console.error('No admin token available');
                                      return;
                                    }
                                    
                                    const response = await fetch(`${API_BASE}/api/moderation/professors/${professor.id}/verify`, {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                        action: 'verify',
                                        verification_notes: 'Approved by admin'
                                      })
                                    });
                                    
                                    if (response.ok) {
                                      // Remove from pending list
                                      setPendingApprovalProfessors(prev => 
                                        prev.filter(p => p.id !== professor.id)
                                      );
                                      // Refresh stats with the proper count function
                                      await loadRealTimeStats();
                                      console.log('Professor approved successfully');
                                    } else {
                                      const errorText = await response.text();
                                      console.error('Failed to approve professor:', response.status, errorText);
                                    }
                                  } catch (error) {
                                    console.error('Error approving professor:', error);
                                  }
                                }}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    // Get admin token from localStorage
                                    let token = null;
                                    const storedSession = localStorage.getItem('adminSession');
                                    if (storedSession) {
                                      try {
                                        const sessionData = JSON.parse(storedSession);
                                        token = sessionData.access_token;
                                      } catch (e) {
                                        console.error('Failed to parse admin session');
                                      }
                                    }
                                    
                                    if (!token) {
                                      console.error('No admin token available');
                                      return;
                                    }
                                    
                                    const response = await fetch(`${API_BASE}/api/moderation/professors/${professor.id}/verify`, {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                        action: 'reject',
                                        verification_notes: 'Rejected by admin'
                                      })
                                    });
                                    
                                    if (response.ok) {
                                      // Remove from pending list
                                      setPendingApprovalProfessors(prev => 
                                        prev.filter(p => p.id !== professor.id)
                                      );
                                      // Refresh stats with the proper count function
                                      await loadRealTimeStats();
                                      console.log('Professor rejected successfully');
                                    } else {
                                      const errorText = await response.text();
                                      console.error('Failed to reject professor:', response.status, errorText);
                                    }
                                  } catch (error) {
                                    console.error('Error rejecting professor:', error);
                                  }
                                }}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Registered Users</h3>
                <p className="text-sm text-gray-600 mt-1">
                  All users who have registered accounts. Registration is required to submit reviews and add professors.
                </p>
              </div>
              <div className="p-6">
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2 font-medium">No Registered Users Yet</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 max-w-2xl mx-auto text-left">
                      <h4 className="font-semibold text-blue-900 mb-2">User Registration</h4>
                      <div className="text-sm text-blue-800 space-y-2">
                        <p>• <strong>Registration Required:</strong> Users must create an account to submit reviews</p>
                        <p>• <strong>What Users Can Do:</strong> Rate professors, write reviews, add new professors, vote on reviews</p>
                        <p>• <strong>This Tab Shows:</strong> All users registered via email/password or social login</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleRefresh}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Refresh Data
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user: any) => (
                      <div key={user.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {user.display_name || 
                                 (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : null) ||
                                 user.email.split('@')[0]}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.is_banned ? 'bg-red-100 text-red-800' : 
                                user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.is_banned ? 'Banned' : user.is_verified ? 'Verified' : 'Unverified'}
                              </span>
                              {user.is_admin && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Email:</span> {user.email}
                              </div>
                              <div>
                                <span className="font-medium">Joined:</span> {new Date(user.created_at).toLocaleDateString()}
                              </div>
                              {user.last_login && (
                                <div>
                                  <span className="font-medium">Last Login:</span> {new Date(user.last_login).toLocaleDateString()}
                                </div>
                              )}
                              {user.college_id && (
                                <div>
                                  <span className="font-medium">College ID:</span> {user.college_id}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {!user.is_banned ? (
                              <button 
                                onClick={() => {
                                  showConfirm(
                                    `Are you sure you want to ban ${user.email}? They will not be able to log in or submit reviews.`,
                                    async () => {
                                      try {
                                        // TODO: Implement ban user endpoint
                                        showToast('Ban user functionality coming soon', 'info');
                                      } catch (error) {
                                        showToast('Failed to ban user', 'error');
                                      }
                                    },
                                    'Ban User'
                                  );
                                }}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                              >
                                Ban User
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  showConfirm(
                                    `Are you sure you want to unban ${user.email}?`,
                                    async () => {
                                      try {
                                        // TODO: Implement unban user endpoint
                                        showToast('Unban user functionality coming soon', 'info');
                                      } catch (error) {
                                        showToast('Failed to unban user', 'error');
                                      }
                                    },
                                    'Unban User'
                                  );
                                }}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                              >
                                Unban User
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetailsModal(true);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'professor-reviews' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                      <Flag className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{professorReviewStats.pending_reviews}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <Flag className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Flags</p>
                      <p className="text-2xl font-bold text-gray-900">{professorReviewStats.total_flags}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                      <Shield className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Flagged Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{professorReviewStats.flagged_reviews}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{professorReviewStats.total_reviews}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Filter by status:</label>
                  <select
                    value={professorReviewStatusFilter}
                    onChange={(e) => setProfessorReviewStatusFilter(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="removed">Removed</option>
                    <option value="flagged">Flagged Only</option>
                    <option value="all">All Reviews</option>
                  </select>
                  <button
                    onClick={loadProfessorReviews}
                    disabled={isLoadingProfessorReviews}
                    className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoadingProfessorReviews ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {/* Professor Reviews Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Professor Reviews</h3>
                  <p className="text-sm text-gray-600 mt-1">View all submitted professor reviews and their authors</p>
                </div>
                
                {isLoadingProfessorReviews ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading reviews...</p>
                  </div>
                ) : professorReviews.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No professor reviews found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review Content</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flag Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flagged Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {professorReviews.map((review: any) => (
                          <tr key={review.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{review.professor_name}</div>
                              <div className="text-sm text-gray-500">{review.college_name}</div>
                              <div className="text-xs text-gray-400">{review.college_city}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-md">
                                <div className="font-medium">Course: {review.course_name}</div>
                                <div className="mt-1">Rating: {review.overall_rating}/5 ⭐</div>
                                {review.review_text && (
                                  <div className="mt-2 text-gray-600 line-clamp-3">{review.review_text}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {review.has_flags ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Flagged ({review.flag_count})
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Clean
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {review.has_flags ? 'User reported' : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                review.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {review.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              {review.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => moderateProfessorReview(review.id, 'approve', 'Approved by admin')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => moderateProfessorReview(review.id, 'remove', 'Policy violation')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Dismiss
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'college-reviews' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                      <Flag className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Flags</p>
                      <p className="text-2xl font-bold text-gray-900">{collegeReviewStats.pending_college_review_flags}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <Flag className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Flags</p>
                      <p className="text-2xl font-bold text-gray-900">{collegeReviewStats.total_college_review_flags}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                      <Shield className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Flagged Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{collegeReviewStats.flagged_college_reviews}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{collegeReviewStats.total_college_reviews}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Filter by status:</label>
                  <select
                    value={collegeReviewStatusFilter}
                    onChange={(e) => setCollegeReviewStatusFilter(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved Flags</option>
                    <option value="dismissed">Dismissed Flags</option>
                    <option value="">All Flags</option>
                  </select>
                  <button
                    onClick={loadFlaggedCollegeReviews}
                    disabled={isLoadingCollegeReviews}
                    className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoadingCollegeReviews ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {/* Flagged College Reviews Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Flagged College Reviews</h3>
                </div>
                
                {isLoadingCollegeReviews ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading flagged reviews...</p>
                  </div>
                ) : flaggedCollegeReviews.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Flag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No flagged college reviews found</p>
                    <p className="text-sm mt-2">Change the filter to see different results</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">College</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Review Content</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flag Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flagged Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {flaggedCollegeReviews.map((flag: any) => (
                          <tr key={flag.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {flag.college?.name || 'Unknown College'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {flag.college?.city}, {flag.college?.state}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-md">
                                <p className="line-clamp-2">{flag.college_review?.review_text || 'No content'}</p>
                                <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                                  <span>Rating: {flag.college_review?.overall_rating || 'N/A'}/5</span>
                                  <span>•</span>
                                  <span>Reviews: {flag.college_review?.total_reviews || 0}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                flag.flag_type === 'spam' ? 'bg-red-100 text-red-800' :
                                flag.flag_type === 'fake' ? 'bg-orange-100 text-orange-800' :
                                flag.flag_type === 'offensive' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {flag.flag_type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600 max-w-xs truncate">
                                {flag.reason || 'No reason provided'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                flag.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                flag.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {flag.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(flag.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm space-x-2">
                              {flag.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleCollegeReviewFlagAction(flag.id, 'approve_flag')}
                                    className="text-green-600 hover:text-green-900 font-medium"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleCollegeReviewFlagAction(flag.id, 'dismiss_flag')}
                                    className="text-red-600 hover:text-red-900 font-medium"
                                  >
                                    Dismiss
                                  </button>
                                </>
                              )}
                              {flag.status !== 'pending' && (
                                <span className="text-gray-400">
                                  {flag.status === 'approved' ? 'Flag Approved' : 'Flag Dismissed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* All College Reviews Section */}
              <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">All College Reviews</h3>
                  <p className="text-sm text-gray-500 mt-1">View all submitted college reviews and their authors</p>
                </div>
                
                {allCollegeReviews.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No college reviews found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {allCollegeReviews.map((review: any) => (
                      <div key={review.id} className="p-6 hover:bg-gray-50">
                        {/* Header with College Name and Author */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {review.colleges?.name || 'Unknown College'}
                            </h4>
                            <div className="text-sm text-gray-500 mt-1">
                              {review.colleges?.city}, {review.colleges?.state}
                            </div>
                            <div className="text-sm text-indigo-600 mt-1 font-medium">
                              Author: {review.author?.email || review.author?.username || 'Anonymous'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-indigo-600">
                              {review.ratings?.overall?.toFixed(1) || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">Overall Rating</div>
                          </div>
                        </div>

                        {/* Student Info */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                          <span className="font-medium">{review.course_name}</span>
                          <span>•</span>
                          <span>{review.year_of_study}</span>
                          {review.graduation_year && (
                            <>
                              <span>•</span>
                              <span>Class of {review.graduation_year}</span>
                            </>
                          )}
                        </div>

                        {/* Individual Ratings Grid */}
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                          {[
                            { key: 'teaching', label: 'Teaching' },
                            { key: 'facilities', label: 'Facilities' },
                            { key: 'opportunities', label: 'Opportunities' },
                            { key: 'clubs', label: 'Clubs' },
                            { key: 'internet', label: 'Internet' },
                            { key: 'food', label: 'Food' }
                          ].map((category) => (
                            <div key={category.key} className="text-center bg-gray-50 rounded-lg p-2">
                              <div className="text-xs text-gray-600 mb-1">{category.label}</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {review.ratings?.[category.key]?.toFixed(1) || 'N/A'}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Review Text */}
                        {review.review_text && (
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="text-gray-700 text-sm">{review.review_text}</p>
                          </div>
                        )}

                        {/* Voting Stats and Metadata */}
                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <ThumbsUp className="w-4 h-4 mr-1 text-green-600" />
                              {review.helpful_count || 0} helpful
                            </span>
                            <span className="flex items-center">
                              <ThumbsDown className="w-4 h-4 mr-1 text-red-600" />
                              {review.not_helpful_count || 0} not helpful
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              review.status === 'approved' ? 'bg-green-100 text-green-800' :
                              review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {review.status}
                            </span>
                            <span>{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Admin API Documentation</h3>
              <p className="text-blue-800 mb-4">
                Access the complete admin API documentation for advanced management features.
              </p>
              <button 
                onClick={() => window.open(`${API_BASE}/docs`, '_blank')}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Open API Docs
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 transform animate-pulse">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Admin Access Granted! 🎉
              </h3>
              <p className="text-gray-600 mb-4">
                Welcome to the RateMyProf admin panel. You now have full access to manage professors, reviews, and users.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                <Check className="w-4 h-4" />
                <span>Successfully authenticated as admin</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onLogin={handleAdminLogin}
      />

      {/* Professor Edit Modal */}
      {showEditModal && editingProfessor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Professor: {editingProfessor.name}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const updatedData: any = {};
              
              // Only include fields that have values
              const name = formData.get('name') as string;
              if (name && name !== editingProfessor.name) updatedData.name = name;
              
              const email = formData.get('email') as string;
              if (email && email !== editingProfessor.email) updatedData.email = email;
              
              const department = formData.get('department') as string;
              if (department && department !== editingProfessor.department) updatedData.department = department;
              
              const designation = formData.get('designation') as string;
              if (designation && designation !== editingProfessor.designation) updatedData.designation = designation;
              
              const biography = formData.get('biography') as string;
              if (biography && biography !== editingProfessor.biography) updatedData.biography = biography;
              
              const experience = formData.get('years_of_experience') as string;
              if (experience && experience !== editingProfessor.years_of_experience?.toString()) {
                updatedData.years_of_experience = parseInt(experience);
              }
              
              const education = formData.get('education') as string;
              if (education && education !== editingProfessor.education) updatedData.education = education;
              
              const research = formData.get('research_interests') as string;
              if (research && research !== editingProfessor.research_interests) updatedData.research_interests = research;
              
              if (Object.keys(updatedData).length > 0) {
                handleProfessorUpdate(updatedData);
              } else {
                showToast('No changes detected', 'info');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingProfessor.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingProfessor.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    defaultValue={editingProfessor.department}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    defaultValue={editingProfessor.designation}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    name="years_of_experience"
                    defaultValue={editingProfessor.years_of_experience}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                  <textarea
                    name="education"
                    defaultValue={editingProfessor.education}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Research Interests</label>
                  <textarea
                    name="research_interests"
                    defaultValue={editingProfessor.research_interests}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Biography</label>
                  <textarea
                    name="biography"
                    defaultValue={editingProfessor.biography}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProfessor(null);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update Professor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal - Modern Design */}
      {showUserDetailsModal && selectedUser && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="user-details-modal"
          role="dialog"
          aria-modal="true"
        >
          {/* Background overlay with blur effect */}
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm transition-opacity animate-backdropFadeIn"
            onClick={() => {
              setShowUserDetailsModal(false);
              setSelectedUser(null);
            }}
          ></div>

          {/* Modal container */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all animate-modalFadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl px-6 py-8 text-white">
                <button
                  onClick={() => {
                    setShowUserDetailsModal(false);
                    setSelectedUser(null);
                  }}
                  className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="flex items-center space-x-4">
                  {/* User Avatar */}
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl font-bold backdrop-blur-sm">
                    {selectedUser.first_name && selectedUser.last_name 
                      ? `${selectedUser.first_name[0]}${selectedUser.last_name[0]}`
                      : selectedUser.email[0].toUpperCase()
                    }
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">
                      {selectedUser.first_name && selectedUser.last_name 
                        ? `${selectedUser.first_name} ${selectedUser.last_name}`
                        : selectedUser.email.split('@')[0]
                      }
                    </h2>
                    <p className="text-blue-100 text-sm">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedUser.is_banned ? 'bg-red-500 text-white' : 
                        selectedUser.is_active ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                      }`}>
                        {selectedUser.is_banned ? '🚫 Banned' : selectedUser.is_active ? '✓ Active' : '⏳ Pending'}
                      </span>
                      {selectedUser.is_admin && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-500 text-white">
                          👑 Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6">
                {/* User Information Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-blue-900">User ID</h3>
                    </div>
                    <p className="text-xs text-blue-700 font-mono break-all">{selectedUser.id}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-green-900">Member Since</h3>
                    </div>
                    <p className="text-sm text-green-700 font-medium">
                      {new Date(selectedUser.created_at).toLocaleDateString('en-IN', { 
                        day: 'numeric',
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>

                  {selectedUser.last_login && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-sm font-semibold text-purple-900">Last Login</h3>
                      </div>
                      <p className="text-sm text-purple-700 font-medium">
                        {new Date(selectedUser.last_login).toLocaleDateString('en-IN', { 
                          day: 'numeric',
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  )}

                  {selectedUser.college_id && (
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3 className="text-sm font-semibold text-orange-900">College ID</h3>
                      </div>
                      <p className="text-sm text-orange-700 font-medium">{selectedUser.college_id}</p>
                    </div>
                  )}
                </div>

                {/* Activity Statistics */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-900">Activity Statistics</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                          <p className="text-3xl font-bold text-blue-600">{selectedUser.total_reviews || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Flags Submitted</p>
                          <p className="text-3xl font-bold text-red-600">{selectedUser.total_flags_submitted || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  {!selectedUser.is_banned ? (
                    <button
                      onClick={() => {
                        setShowUserDetailsModal(false);
                        showConfirm(
                          `Are you sure you want to ban ${selectedUser.email}? They will not be able to log in or submit reviews.`,
                          async () => {
                            try {
                              showToast('Ban user functionality coming soon', 'info');
                            } catch (error) {
                              showToast('Failed to ban user', 'error');
                            }
                          },
                          'Ban User'
                        );
                      }}
                      className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      🚫 Ban User
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowUserDetailsModal(false);
                        showConfirm(
                          `Are you sure you want to unban ${selectedUser.email}?`,
                          async () => {
                            try {
                              showToast('Unban user functionality coming soon', 'info');
                            } catch (error) {
                              showToast('Failed to unban user', 'error');
                            }
                          },
                          'Unban User'
                        );
                      }}
                      className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      ✅ Unban User
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowUserDetailsModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-5 py-2.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPage;
