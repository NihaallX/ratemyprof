import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotification } from '../contexts/NotificationContext';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Users,
  FileText,
  GraduationCap,
  Building
} from 'lucide-react';

interface Review {
  id: string;
  professor_name?: string;
  college_name?: string;
  review_text: string;
  overall_rating?: number;
  moderation_status: string;
  created_at: string;
  flag_count?: number;
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  total_reviews: number;
  total_flags_submitted: number;
  is_active: boolean;
  created_at: string;
}

interface Professor {
  id: string;
  name: string;
  department: string;
  college_name: string;
  is_verified: boolean;
  total_reviews: number;
  average_rating?: number;
  created_at: string;
}

interface BulkOperationResult {
  success_count: number;
  failed_count: number;
  total_count: number;
  failed_items: Array<{id: string, error: string}>;
  success_message: string;
}

const BulkOperationsPanel: React.FC = () => {
  const { showToast } = useNotification();
  
  // State for different entity types
  const [reviews, setReviews] = useState<Review[]>([]);
  const [collegeReviews, setCollegeReviews] = useState<Review[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  
  // Selection state
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [selectedCollegeReviews, setSelectedCollegeReviews] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedProfessors, setSelectedProfessors] = useState<Set<string>>(new Set());
  
  // Operation state
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkReason, setBulkReason] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [operationResult, setOperationResult] = useState<BulkOperationResult | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadReviews();
    loadCollegeReviews();
    loadUsers();
    loadProfessors();
  }, []);

  const loadReviews = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/moderation/reviews?status=flagged&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const loadCollegeReviews = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/moderation/college-reviews?status=flagged&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCollegeReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error loading college reviews:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/moderation/users?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadProfessors = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/moderation/professors/pending?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfessors(data.professors || []);
      }
    } catch (error) {
      console.error('Error loading professors:', error);
    }
  };

  // Selection handlers
  const toggleReviewSelection = (reviewId: string) => {
    const newSelection = new Set(selectedReviews);
    if (newSelection.has(reviewId)) {
      newSelection.delete(reviewId);
    } else {
      newSelection.add(reviewId);
    }
    setSelectedReviews(newSelection);
  };

  const toggleCollegeReviewSelection = (reviewId: string) => {
    const newSelection = new Set(selectedCollegeReviews);
    if (newSelection.has(reviewId)) {
      newSelection.delete(reviewId);
    } else {
      newSelection.add(reviewId);
    }
    setSelectedCollegeReviews(newSelection);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleProfessorSelection = (professorId: string) => {
    const newSelection = new Set(selectedProfessors);
    if (newSelection.has(professorId)) {
      newSelection.delete(professorId);
    } else {
      newSelection.add(professorId);
    }
    setSelectedProfessors(newSelection);
  };

  const selectAllReviews = () => {
    setSelectedReviews(new Set(reviews.map(r => r.id)));
  };

  const clearAllReviews = () => {
    setSelectedReviews(new Set());
  };

  const selectAllCollegeReviews = () => {
    setSelectedCollegeReviews(new Set(collegeReviews.map(r => r.id)));
  };

  const clearAllCollegeReviews = () => {
    setSelectedCollegeReviews(new Set());
  };

  const selectAllUsers = () => {
    setSelectedUsers(new Set(users.map(u => u.id)));
  };

  const clearAllUsers = () => {
    setSelectedUsers(new Set());
  };

  const selectAllProfessors = () => {
    setSelectedProfessors(new Set(professors.map(p => p.id)));
  };

  const clearAllProfessors = () => {
    setSelectedProfessors(new Set());
  };

  // Bulk operation handlers
  const performBulkOperation = async (entityType: string, selectedIds: Set<string>, endpoint: string) => {
    if (selectedIds.size === 0) {
      showToast('Please select items to perform bulk action', 'warning');
      return;
    }

    if (!bulkAction) {
      showToast('Please select an action', 'warning');
      return;
    }

    if (!bulkReason.trim()) {
      showToast('Please provide a reason for the action', 'warning');
      return;
    }

    setLoading(true);
    setOperationResult(null);

    try {
      const token = localStorage.getItem('adminToken');
      const requestBody: any = {
        item_ids: Array.from(selectedIds),
        action: bulkAction,
        reason: bulkReason,
      };

      // Add duration for user actions
      if (entityType === 'users' && (bulkAction === 'ban' || bulkAction === 'warn') && durationDays) {
        requestBody.user_ids = requestBody.item_ids;
        requestBody.duration_days = durationDays;
        delete requestBody.item_ids;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        setOperationResult(result);
        
        // Clear selections and reload data
        if (entityType === 'reviews') {
          setSelectedReviews(new Set());
          loadReviews();
        } else if (entityType === 'college-reviews') {
          setSelectedCollegeReviews(new Set());
          loadCollegeReviews();
        } else if (entityType === 'users') {
          setSelectedUsers(new Set());
          loadUsers();
        } else if (entityType === 'professors') {
          setSelectedProfessors(new Set());
          loadProfessors();
        }
        
        // Clear form
        setBulkAction('');
        setBulkReason('');
        setDurationDays(undefined);
      } else {
        const error = await response.json();
        showToast(`Error: ${error.detail || 'Failed to perform bulk operation'}`, 'error');
      }
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      showToast('Failed to perform bulk operation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionOptions = (entityType: string) => {
    switch (entityType) {
      case 'reviews':
      case 'college-reviews':
        return [
          { value: 'approve', label: 'Approve' },
          { value: 'remove', label: 'Remove' },
          { value: 'pending', label: 'Mark Pending' },
        ];
      case 'users':
        return [
          { value: 'ban', label: 'Ban User' },
          { value: 'unban', label: 'Unban User' },
          { value: 'warn', label: 'Warn User' },
          { value: 'delete', label: 'Delete User' },
        ];
      case 'professors':
        return [
          { value: 'approve', label: 'Verify' },
          { value: 'remove', label: 'Reject' },
          { value: 'delete', label: 'Delete' },
        ];
      default:
        return [];
    }
  };

  const renderBulkActionForm = (entityType: string, selectedCount: number, onSubmit: () => void) => (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Bulk Actions ({selectedCount} selected)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Action</label>
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger>
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              {getActionOptions(entityType).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {entityType === 'users' && (bulkAction === 'ban' || bulkAction === 'warn') && (
          <div>
            <label className="text-sm font-medium">Duration (days)</label>
            <input
              type="number"
              value={durationDays || ''}
              onChange={(e) => setDurationDays(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder="Leave empty for permanent"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium">Reason</label>
          <Textarea
            value={bulkReason}
            onChange={(e) => setBulkReason(e.target.value)}
            placeholder="Provide a reason for this action..."
            className="mt-1"
            rows={3}
          />
        </div>

        <Button 
          onClick={onSubmit} 
          disabled={loading || selectedCount === 0 || !bulkAction || !bulkReason.trim()}
          className="w-full"
        >
          {loading ? 'Processing...' : `Apply to ${selectedCount} item(s)`}
        </Button>

        {operationResult && (
          <Alert className={operationResult.failed_count > 0 ? "border-yellow-500" : "border-green-500"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>{operationResult.success_message}</div>
                <div className="text-sm">
                  Success: {operationResult.success_count} | 
                  Failed: {operationResult.failed_count} | 
                  Total: {operationResult.total_count}
                </div>
                {operationResult.failed_items.length > 0 && (
                  <details className="text-sm">
                    <summary>View failures</summary>
                    <ul className="mt-2 space-y-1">
                      {operationResult.failed_items.map((item, index) => (
                        <li key={index}>ID: {item.id} - {item.error}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <CheckSquare className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Bulk Operations</h2>
      </div>

      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reviews">Professor Reviews</TabsTrigger>
          <TabsTrigger value="college-reviews">College Reviews</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="professors">Professors</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Professor Reviews ({reviews.length})</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button onClick={selectAllReviews} variant="outline" size="sm">
                  Select All
                </Button>
                <Button onClick={clearAllReviews} variant="outline" size="sm">
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedReviews.has(review.id)}
                        onCheckedChange={() => toggleReviewSelection(review.id)}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{review.professor_name || 'Unknown Professor'}</span>
                            <Badge variant={review.moderation_status === 'pending' ? 'destructive' : 'default'}>
                              {review.moderation_status}
                            </Badge>
                            {review.flag_count && review.flag_count > 0 && (
                              <Badge variant="outline">{review.flag_count} flag(s)</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {review.review_text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {reviews.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No flagged reviews found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {renderBulkActionForm(
            'reviews',
            selectedReviews.size,
            () => performBulkOperation('reviews', selectedReviews, '/api/moderation/reviews/bulk-action')
          )}
        </TabsContent>

        <TabsContent value="college-reviews" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>College Reviews ({collegeReviews.length})</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button onClick={selectAllCollegeReviews} variant="outline" size="sm">
                  Select All
                </Button>
                <Button onClick={clearAllCollegeReviews} variant="outline" size="sm">
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {collegeReviews.map((review) => (
                  <div key={review.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedCollegeReviews.has(review.id)}
                        onCheckedChange={() => toggleCollegeReviewSelection(review.id)}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{review.college_name || 'Unknown College'}</span>
                            <Badge variant={review.moderation_status === 'pending' ? 'destructive' : 'default'}>
                              {review.moderation_status}
                            </Badge>
                            {review.flag_count && review.flag_count > 0 && (
                              <Badge variant="outline">{review.flag_count} flag(s)</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {review.review_text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {collegeReviews.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No flagged college reviews found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {renderBulkActionForm(
            'college-reviews',
            selectedCollegeReviews.size,
            () => performBulkOperation('college-reviews', selectedCollegeReviews, '/api/moderation/college-reviews/bulk-action')
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Users ({users.length})</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button onClick={selectAllUsers} variant="outline" size="sm">
                  Select All
                </Button>
                <Button onClick={clearAllUsers} variant="outline" size="sm">
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{user.email}</span>
                            <Badge variant={user.is_active ? 'default' : 'destructive'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(user.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.total_reviews} reviews • {user.total_flags_submitted} flags submitted
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {users.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No users found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {renderBulkActionForm(
            'users',
            selectedUsers.size,
            () => performBulkOperation('users', selectedUsers, '/api/moderation/users/bulk-action')
          )}
        </TabsContent>

        <TabsContent value="professors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Professors ({professors.length})</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button onClick={selectAllProfessors} variant="outline" size="sm">
                  Select All
                </Button>
                <Button onClick={clearAllProfessors} variant="outline" size="sm">
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {professors.map((professor) => (
                  <div key={professor.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedProfessors.has(professor.id)}
                        onCheckedChange={() => toggleProfessorSelection(professor.id)}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{professor.name}</span>
                            <Badge variant={professor.is_verified ? 'default' : 'destructive'}>
                              {professor.is_verified ? 'Verified' : 'Pending'}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(professor.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {professor.department} • {professor.college_name} • {professor.total_reviews} reviews
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {professors.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No pending professors found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {renderBulkActionForm(
            'professors',
            selectedProfessors.size,
            () => performBulkOperation('professors', selectedProfessors, '/api/moderation/professors/bulk-action')
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkOperationsPanel;