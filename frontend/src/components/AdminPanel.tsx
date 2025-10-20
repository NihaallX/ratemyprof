import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Check, X, Eye, Users, Flag, BookOpen } from 'lucide-react';

interface Review {
  id: string;
  professor_name: string;
  college_name: string;
  review_text: string;
  overall_rating: number;
  status: 'pending' | 'approved' | 'removed';
  flag_count: number;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'suspended' | 'banned';
  total_reviews: number;
  created_at: string;
}

interface Professor {
  id: string;
  name: string;
  college_name: string;
  department: string;
  status: 'pending' | 'verified' | 'rejected';
  submitted_by: string;
  created_at: string;
}

interface AdminStats {
  total_reviews: number;
  pending_reviews: number;
  flagged_reviews: number;
  total_users: number;
  pending_professors: number;
}

const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [flaggedReviews, setFlaggedReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingProfessors, setPendingProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch stats
      const statsResponse = await fetch('/api/moderation/stats', { headers });
      if (statsResponse.ok) {
        setStats(await statsResponse.json());
      }

      // Fetch flagged reviews
      const reviewsResponse = await fetch('/api/moderation/reviews?status=pending', { headers });
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setFlaggedReviews(reviewsData.reviews || []);
      }

      // Fetch users
      const usersResponse = await fetch('/api/moderation/users', { headers });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      // Fetch pending professors
      const professorsResponse = await fetch('/api/moderation/professors/pending', { headers });
      if (professorsResponse.ok) {
        const professorsData = await professorsResponse.json();
        setPendingProfessors(professorsData.professors || []);
      }

    } catch (err) {
      setError('Failed to load admin data');
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleReviewAction = async (reviewId: string, action: 'approve' | 'remove') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/moderation/reviews/${reviewId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          reason: action === 'remove' ? 'Inappropriate content' : 'Approved by admin'
        })
      });

      if (response.ok) {
        setFlaggedReviews(prev => prev.filter(review => review.id !== reviewId));
      } else {
        setError(`Failed to ${action} review`);
      }
    } catch (err) {
      setError(`Failed to ${action} review`);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'ban' | 'activate') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/moderation/users/${userId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          reason: `User ${action}ed by admin`
        })
      });

      if (response.ok) {
        fetchAdminData(); // Refresh data
      } else {
        setError(`Failed to ${action} user`);
      }
    } catch (err) {
      setError(`Failed to ${action} user`);
    }
  };

  const handleProfessorAction = async (professorId: string, action: 'verify' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/moderation/professors/${professorId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action === 'verify' ? 'approve' : 'reject',
          reason: action === 'verify' ? 'Professor verified' : 'Professor rejected by admin'
        })
      });

      if (response.ok) {
        setPendingProfessors(prev => prev.filter(prof => prof.id !== professorId));
      } else {
        setError(`Failed to ${action} professor`);
      }
    } catch (err) {
      setError(`Failed to ${action} professor`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <Button onClick={fetchAdminData}>Refresh Data</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_reviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_reviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged Reviews</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.flagged_reviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Professors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_professors}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reviews">Flagged Reviews</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="professors">Pending Professors</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Reviews</CardTitle>
              <CardDescription>Reviews that have been flagged by users</CardDescription>
            </CardHeader>
            <CardContent>
              {flaggedReviews.length === 0 ? (
                <p className="text-muted-foreground">No flagged reviews</p>
              ) : (
                <div className="space-y-4">
                  {flaggedReviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{review.professor_name}</h4>
                          <p className="text-sm text-muted-foreground">{review.college_name}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="destructive">{review.flag_count} flags</Badge>
                          <Badge>{review.overall_rating}★</Badge>
                        </div>
                      </div>
                      <p className="text-sm">{review.review_text}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                        <div className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewAction(review.id, 'approve')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReviewAction(review.id, 'remove')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-muted-foreground">No users found</p>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{user.name || user.email}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                            {user.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {user.total_reviews} reviews
                          </span>
                        </div>
                      </div>
                      <div className="space-x-2">
                        {user.status === 'active' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserAction(user.id, 'suspend')}
                            >
                              Suspend
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUserAction(user.id, 'ban')}
                            >
                              Ban
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUserAction(user.id, 'activate')}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professors">
          <Card>
            <CardHeader>
              <CardTitle>Pending Professors</CardTitle>
              <CardDescription>Professors awaiting verification</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingProfessors.length === 0 ? (
                <p className="text-muted-foreground">No pending professors</p>
              ) : (
                <div className="space-y-4">
                  {pendingProfessors.map((professor) => (
                    <div key={professor.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{professor.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {professor.department} at {professor.college_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted by: {professor.submitted_by}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleProfessorAction(professor.id, 'verify')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleProfessorAction(professor.id, 'reject')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;