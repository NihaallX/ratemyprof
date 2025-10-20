import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNotification } from '../contexts/NotificationContext';
import { 
  Bell, 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Mail,
  Users,
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react';

interface Notification {
  id: string;
  notification_type: string;
  subject: string;
  body: string;
  action_required: boolean;
  appeal_allowed: boolean;
  read: boolean;
  created_at: string;
  read_at?: string;
}

interface Appeal {
  id: string;
  user_id: string;
  moderation_action_id: string;
  appeal_reason: string;
  additional_info?: string;
  status: 'pending' | 'approved' | 'rejected';
  resolved_by?: string;
  resolution_details?: string;
  resolved_at?: string;
  created_at: string;
}

interface CommunicationStats {
  total_notifications: number;
  unread_notifications: number;
  notification_types: Record<string, number>;
  total_appeals: number;
  appeal_statuses: Record<string, number>;
}

interface UserCommunicationPanelProps {
  onRefresh?: () => void;
}

const UserCommunicationPanel: React.FC<UserCommunicationPanelProps> = ({ onRefresh }) => {
  const { showToast } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newNotification, setNewNotification] = useState({
    notification_type: '',
    context_data: {}
  });
  const [appealResolution, setAppealResolution] = useState({
    decision: '',
    resolution_details: ''
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    status: 'all',
    type: 'all',
    dateRange: '7'
  });

  useEffect(() => {
    loadStats();
    loadAppeals();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/moderation/communication-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.communication_stats);
      }
    } catch (error) {
      console.error('Error loading communication stats:', error);
    }
  };

  const loadNotifications = async (userId: string) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/moderation/notifications/${userId}?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppeals = async () => {
    try {
      const response = await fetch('/api/admin/moderation/appeals?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppeals(data.appeals);
      }
    } catch (error) {
      console.error('Error loading appeals:', error);
    }
  };

  const sendNotification = async () => {
    if (!selectedUserId || !newNotification.notification_type) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/moderation/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          notification_type: newNotification.notification_type,
          context_data: {
            ...newNotification.context_data,
            created_at: new Date().toISOString()
          }
        })
      });
      
      if (response.ok) {
        showToast('Notification sent successfully', 'success');
        setNewNotification({ notification_type: '', context_data: {} });
        loadNotifications(selectedUserId);
        loadStats();
      } else {
        showToast('Failed to send notification', 'error');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      showToast('Error sending notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resolveAppeal = async (appealId: string) => {
    if (!appealResolution.decision || !appealResolution.resolution_details) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/moderation/appeals/${appealId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(appealResolution)
      });
      
      if (response.ok) {
        showToast(`Appeal ${appealResolution.decision} successfully`, 'success');
        setAppealResolution({ decision: '', resolution_details: '' });
        loadAppeals();
        loadStats();
      } else {
        showToast('Failed to resolve appeal', 'error');
      }
    } catch (error) {
      console.error('Error resolving appeal:', error);
      showToast('Error resolving appeal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review_approved':
      case 'professor_verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'review_rejected':
      case 'professor_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'account_warned':
      case 'account_banned':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAppealStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredAppeals = appeals.filter(appeal => {
    if (filter.status !== 'all' && appeal.status !== filter.status) return false;
    
    if (filter.dateRange !== 'all') {
      const daysAgo = parseInt(filter.dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysAgo);
      if (new Date(appeal.created_at) < cutoff) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Communication Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                  <p className="text-2xl font-bold">{stats.total_notifications.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-bold">{stats.unread_notifications.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Appeals</p>
                  <p className="text-2xl font-bold">{stats.total_appeals.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Appeals</p>
                  <p className="text-2xl font-bold">
                    {(stats.appeal_statuses.pending || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">User Notifications</TabsTrigger>
          <TabsTrigger value="appeals">Appeal Management</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <Input
                    placeholder="Enter user ID"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notification Type</label>
                  <Select
                    value={newNotification.notification_type}
                    onValueChange={(value) => 
                      setNewNotification(prev => ({ ...prev, notification_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="review_approved">Review Approved</SelectItem>
                      <SelectItem value="review_rejected">Review Rejected</SelectItem>
                      <SelectItem value="professor_verified">Professor Verified</SelectItem>
                      <SelectItem value="professor_rejected">Professor Rejected</SelectItem>
                      <SelectItem value="account_warned">Account Warning</SelectItem>
                      <SelectItem value="account_banned">Account Banned</SelectItem>
                      <SelectItem value="account_unbanned">Account Unbanned</SelectItem>
                      <SelectItem value="flag_resolved">Flag Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={sendNotification} disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => selectedUserId && loadNotifications(selectedUserId)}
                  disabled={!selectedUserId}
                >
                  Load User Notifications
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Notifications List */}
          {notifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>User Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg ${
                          notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.notification_type)}
                            <div className="flex-1">
                              <h4 className="font-semibold">{notification.subject}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.body.substring(0, 200)}...
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>
                                  {new Date(notification.created_at).toLocaleString()}
                                </span>
                                {notification.action_required && (
                                  <Badge variant="outline" className="text-orange-600">
                                    Action Required
                                  </Badge>
                                )}
                                {notification.appeal_allowed && (
                                  <Badge variant="outline" className="text-blue-600">
                                    Appeal Allowed
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {!notification.read && (
                            <Badge variant="default" className="ml-2">Unread</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Appeals Tab */}
        <TabsContent value="appeals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Appeal Management
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Select value={filter.status} onValueChange={(value) => 
                    setFilter(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {filteredAppeals.map((appeal) => (
                    <div key={appeal.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">Appeal #{appeal.id.substring(0, 8)}</h4>
                            {getAppealStatusBadge(appeal.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Reason:</strong> {appeal.appeal_reason}
                          </p>
                          {appeal.additional_info && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Additional Info:</strong> {appeal.additional_info}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Submitted: {new Date(appeal.created_at).toLocaleString()}
                          </p>
                          {appeal.resolved_at && (
                            <p className="text-xs text-gray-500">
                              Resolved: {new Date(appeal.resolved_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        
                        {appeal.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Resolve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Resolve Appeal</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Decision</label>
                                  <Select
                                    value={appealResolution.decision}
                                    onValueChange={(value) => 
                                      setAppealResolution(prev => ({ ...prev, decision: value }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select decision" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="approved">Approve Appeal</SelectItem>
                                      <SelectItem value="rejected">Reject Appeal</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Resolution Details</label>
                                  <Textarea
                                    placeholder="Explain the decision..."
                                    value={appealResolution.resolution_details}
                                    onChange={(e) => 
                                      setAppealResolution(prev => ({ 
                                        ...prev, 
                                        resolution_details: e.target.value 
                                      }))
                                    }
                                  />
                                </div>
                                <Button 
                                  onClick={() => resolveAppeal(appeal.id)}
                                  disabled={loading}
                                  className="w-full"
                                >
                                  Resolve Appeal
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredAppeals.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No appeals found matching the current filters.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Notification templates are managed in the backend configuration. 
                  Templates include automated messages for review approvals/rejections, 
                  account warnings, professor verifications, and more. Contact the 
                  development team to modify templates.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold">Available Template Types:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Review Approved - Confirmation of review publication</li>
                  <li>Review Rejected - Notification of review removal with reason</li>
                  <li>Professor Verified - Confirmation of professor profile approval</li>
                  <li>Professor Rejected - Notification of profile rejection</li>
                  <li>Account Warning - Warning notice with policy guidelines</li>
                  <li>Account Banned - Temporary restriction notification</li>
                  <li>Account Unbanned - Access restoration confirmation</li>
                  <li>Flag Resolved - Report resolution notification</li>
                  <li>Appeal Received - Appeal submission confirmation</li>
                  <li>Appeal Resolved - Appeal decision notification</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserCommunicationPanel;