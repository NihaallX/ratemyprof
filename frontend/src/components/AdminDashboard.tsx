import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Users, 
  Flag, 
  UserCheck, 
  UserX, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface FlaggedReview {
  id: string;
  professor_id: string;
  user_id?: string;
  review_text?: string;
  ratings: Record<string, number>;
  anonymous: boolean;
  anon_display_name?: string;
  created_at: string;
  updated_at: string;
  status: string;
  flags: ReviewFlag[];
  helpful_count: number;
  not_helpful_count: number;
}

interface ReviewFlag {
  id: string;
  reason: string;
  description?: string;
  flagged_by: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: string;
  total_reviews: number;
  total_flags_submitted: number;
}

interface PendingProfessor {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  department: string;
  designation?: string;
  college: {
    name: string;
    city: string;
    state: string;
  };
  subjects?: string;
  biography?: string;
  years_of_experience?: number;
  education?: string;
  research_interests?: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [flaggedReviews, setFlaggedReviews] = useState<FlaggedReview[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingProfessors, setPendingProfessors] = useState<PendingProfessor[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reviews');

  // Fetch flagged reviews
  const fetchFlaggedReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/moderation/reviews', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setFlaggedReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching flagged reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async (status: string = 'all') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/moderation/users?status=${status}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending professors
  const fetchPendingProfessors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/moderation/professors/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setPendingProfessors(data.professors || []);
    } catch (error) {
      console.error('Error fetching pending professors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Moderate review
  const moderateReview = async (reviewId: string, action: string, reason: string) => {
    try {
      const response = await fetch(`/api/moderation/reviews/${reviewId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action, reason }),
      });
      
      if (response.ok) {
        fetchFlaggedReviews(); // Refresh the list
      }
    } catch (error) {
      console.error('Error moderating review:', error);
    }
  };

  // Moderate user
  const moderateUser = async (userId: string, action: string, reason: string) => {
    try {
      const response = await fetch(`/api/moderation/users/${userId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action, reason }),
      });
      
      if (response.ok) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error moderating user:', error);
    }
  };

  // Verify professor
  const verifyProfessor = async (professorId: string, action: string, notes?: string) => {
    try {
      const response = await fetch(`/api/moderation/professors/${professorId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action, verification_notes: notes }),
      });
      
      if (response.ok) {
        fetchPendingProfessors(); // Refresh the list
      }
    } catch (error) {
      console.error('Error verifying professor:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchFlaggedReviews();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'professors') {
      fetchPendingProfessors();
    }
  }, [activeTab]);

  const ReviewCard: React.FC<{ review: FlaggedReview }> = ({ review }) => {
    const [reason, setReason] = useState('');
    
    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Review ID: {review.id.slice(0, 8)}...</CardTitle>
              <p className="text-sm text-gray-600">
                {review.anonymous ? 'Anonymous' : review.user_id} • {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge variant={review.status === 'pending' ? 'destructive' : 'default'}>
              {review.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Review Text:</h4>
              <p className="bg-gray-50 p-3 rounded">{review.review_text || 'No text provided'}</p>
            </div>
            
            <div>
              <h4 className="font-semibold">Ratings:</h4>
              <div className="flex gap-4 text-sm">
                {Object.entries(review.ratings).map(([key, value]) => (
                  <span key={key}>{key}: {value}/5</span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                {review.helpful_count || 0}
              </div>
              <div className="flex items-center gap-1">
                <ThumbsDown className="w-4 h-4" />
                {review.not_helpful_count || 0}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold">Flags ({review.flags.length}):</h4>
              {review.flags.map((flag) => (
                <div key={flag.id} className="bg-red-50 p-2 rounded mb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{flag.reason}</span>
                    <span className="text-sm text-gray-600">{new Date(flag.created_at).toLocaleDateString()}</span>
                  </div>
                  {flag.description && <p className="text-sm mt-1">{flag.description}</p>}
                </div>
              ))}
            </div>
            
            <div>
              <Textarea
                placeholder="Moderation reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={() => moderateReview(review.id, 'approve', reason)}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  onClick={() => moderateReview(review.id, 'remove', reason)}
                  variant="destructive"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const UserCard: React.FC<{ user: User }> = ({ user }) => {
    const [reason, setReason] = useState('');
    
    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{user.email}</CardTitle>
              <p className="text-sm text-gray-600">
                {user.first_name} {user.last_name} • Joined {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge variant={user.is_active ? 'default' : 'destructive'}>
              {user.is_active ? 'Active' : 'Banned'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Reviews: {user.total_reviews}</div>
              <div>Flags Submitted: {user.total_flags_submitted}</div>
            </div>
            
            <div>
              <Textarea
                placeholder="Action reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mb-2"
              />
              <div className="flex gap-2">
                {user.is_active ? (
                  <Button 
                    onClick={() => moderateUser(user.id, 'ban', reason)}
                    variant="destructive"
                    size="sm"
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    Ban User
                  </Button>
                ) : (
                  <Button 
                    onClick={() => moderateUser(user.id, 'unban', reason)}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Unban User
                  </Button>
                )}
                <Button 
                  onClick={() => moderateUser(user.id, 'warn', reason)}
                  variant="outline"
                  size="sm"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Warn
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProfessorCard: React.FC<{ professor: PendingProfessor }> = ({ professor }) => {
    const [notes, setNotes] = useState('');
    
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">
            {professor.first_name} {professor.last_name}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {professor.department} • {professor.college.name}, {professor.college.city}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Email:</strong> {professor.email || 'Not provided'}</div>
              <div><strong>Designation:</strong> {professor.designation || 'Not provided'}</div>
              <div><strong>Experience:</strong> {professor.years_of_experience || 'Not provided'} years</div>
              <div><strong>Subjects:</strong> {professor.subjects || 'Not provided'}</div>
            </div>
            
            {professor.biography && (
              <div>
                <strong>Biography:</strong>
                <p className="bg-gray-50 p-2 rounded mt-1">{professor.biography}</p>
              </div>
            )}
            
            {professor.education && (
              <div>
                <strong>Education:</strong>
                <p className="bg-gray-50 p-2 rounded mt-1">{professor.education}</p>
              </div>
            )}
            
            <div>
              <Textarea
                placeholder="Verification notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={() => verifyProfessor(professor.id, 'verify', notes)}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verify
                </Button>
                <Button 
                  onClick={() => verifyProfessor(professor.id, 'reject', notes)}
                  variant="destructive"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Flagged Reviews
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="professors" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Pending Professors
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reviews" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Flagged Reviews</h2>
            <Button onClick={fetchFlaggedReviews} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          
          {flaggedReviews.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No flagged reviews to review</p>
              </CardContent>
            </Card>
          ) : (
            flaggedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">User Management</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fetchUsers('active')}>
                Active Users
              </Button>
              <Button variant="outline" onClick={() => fetchUsers('banned')}>
                Banned Users
              </Button>
              <Button onClick={() => fetchUsers('all')} disabled={loading}>
                {loading ? 'Loading...' : 'All Users'}
              </Button>
            </div>
          </div>
          
          {users.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No users found</p>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="professors" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Pending Professor Verifications</h2>
            <Button onClick={fetchPendingProfessors} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          
          {pendingProfessors.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No professors pending verification</p>
              </CardContent>
            </Card>
          ) : (
            pendingProfessors.map((professor) => (
              <ProfessorCard key={professor.id} professor={professor} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;