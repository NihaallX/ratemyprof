import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  FileText,
  Eye,
  Clock,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface ModerationMetrics {
  total_flags: number;
  pending_reviews: number;
  pending_college_reviews: number;
  pending_professors: number;
  auto_flags_today: number;
  manual_flags_today: number;
  resolution_rate: number;
  avg_resolution_time: number;
}

interface TrendData {
  date: string;
  flags: number;
  resolutions: number;
  new_users: number;
  new_reviews: number;
}

interface ViolationPattern {
  type: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  percentage_change: number;
}

interface UserActivityData {
  hour: number;
  review_submissions: number;
  flag_submissions: number;
  user_registrations: number;
}

interface TopViolators {
  user_id: string;
  email: string;
  violation_count: number;
  violation_types: string[];
  last_violation: string;
}

const EnhancedAnalyticsPanel: React.FC = () => {
  // State for analytics data
  const [moderationMetrics, setModerationMetrics] = useState<ModerationMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [violationPatterns, setViolationPatterns] = useState<ViolationPattern[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivityData[]>([]);
  const [topViolators, setTopViolators] = useState<TopViolators[]>([]);
  
  // Filters
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadModerationMetrics(),
        loadTrendData(),
        loadViolationPatterns(),
        loadUserActivity(),
        loadTopViolators()
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModerationMetrics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/moderation/analytics/metrics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setModerationMetrics(data);
      }
    } catch (error) {
      console.error('Error loading moderation metrics:', error);
      // Mock data for demo
      setModerationMetrics({
        total_flags: 342,
        pending_reviews: 28,
        pending_college_reviews: 12,
        pending_professors: 5,
        auto_flags_today: 15,
        manual_flags_today: 8,
        resolution_rate: 94.2,
        avg_resolution_time: 4.6
      });
    }
  };

  const loadTrendData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/moderation/analytics/trends?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrendData(data);
      }
    } catch (error) {
      console.error('Error loading trend data:', error);
      // Mock data for demo
      const mockTrends = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        mockTrends.push({
          date: date.toISOString().split('T')[0],
          flags: Math.floor(Math.random() * 20) + 5,
          resolutions: Math.floor(Math.random() * 25) + 10,
          new_users: Math.floor(Math.random() * 15) + 5,
          new_reviews: Math.floor(Math.random() * 50) + 20
        });
      }
      setTrendData(mockTrends);
    }
  };

  const loadViolationPatterns = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/moderation/analytics/violations?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setViolationPatterns(data);
      }
    } catch (error) {
      console.error('Error loading violation patterns:', error);
      // Mock data for demo
      setViolationPatterns([
        { type: 'Inappropriate Content', count: 45, trend: 'down', percentage_change: -12.5 },
        { type: 'Spam', count: 23, trend: 'up', percentage_change: 8.3 },
        { type: 'Low Quality', count: 67, trend: 'stable', percentage_change: 1.2 },
        { type: 'Harassment', count: 12, trend: 'down', percentage_change: -25.0 },
        { type: 'False Information', count: 8, trend: 'up', percentage_change: 33.3 }
      ]);
    }
  };

  const loadUserActivity = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/moderation/analytics/activity?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserActivity(data);
      }
    } catch (error) {
      console.error('Error loading user activity:', error);
      // Mock data for demo
      const mockActivity = [];
      for (let hour = 0; hour < 24; hour++) {
        mockActivity.push({
          hour,
          review_submissions: Math.floor(Math.random() * 20) + (hour >= 9 && hour <= 21 ? 10 : 2),
          flag_submissions: Math.floor(Math.random() * 5) + 1,
          user_registrations: Math.floor(Math.random() * 8) + (hour >= 9 && hour <= 21 ? 3 : 1)
        });
      }
      setUserActivity(mockActivity);
    }
  };

  const loadTopViolators = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/moderation/analytics/violators?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTopViolators(data);
      }
    } catch (error) {
      console.error('Error loading top violators:', error);
      // Mock data for demo
      setTopViolators([
        {
          user_id: 'user-1',
          email: 'problematic.user@example.com',
          violation_count: 8,
          violation_types: ['spam', 'inappropriate'],
          last_violation: '2025-10-03T14:30:00Z'
        },
        {
          user_id: 'user-2',
          email: 'repeat.offender@example.com',
          violation_count: 6,
          violation_types: ['low_quality', 'harassment'],
          last_violation: '2025-10-02T09:15:00Z'
        }
      ]);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-red-600';
      case 'down':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimeRange = (range: string) => {
    switch (range) {
      case '1d':
        return 'Last 24 Hours';
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      case '90d':
        return 'Last 90 Days';
      default:
        return 'Last 7 Days';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Enhanced Analytics</h2>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {moderationMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{moderationMetrics.total_flags}</div>
                  <p className="text-xs text-muted-foreground">
                    {moderationMetrics.auto_flags_today} auto + {moderationMetrics.manual_flags_today} manual today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {moderationMetrics.pending_reviews + moderationMetrics.pending_college_reviews + moderationMetrics.pending_professors}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {moderationMetrics.pending_reviews} reviews + {moderationMetrics.pending_college_reviews} college + {moderationMetrics.pending_professors} professors
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{moderationMetrics.resolution_rate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Avg: {moderationMetrics.avg_resolution_time}h resolution time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round((moderationMetrics.auto_flags_today / (moderationMetrics.auto_flags_today + moderationMetrics.manual_flags_today)) * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Auto-detection rate</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trends ({formatTimeRange(timeRange)})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendData.slice(-7).map((day, index) => (
                    <div key={day.date} className="flex justify-between items-center">
                      <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex space-x-4 text-sm">
                        <span className="text-red-600">{day.flags} flags</span>
                        <span className="text-green-600">{day.resolutions} resolved</span>
                        <span className="text-blue-600">{day.new_reviews} reviews</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Violators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topViolators.map((violator) => (
                    <div key={violator.user_id} className="border rounded p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{violator.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {violator.violation_count} violations
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {violator.violation_types.map((type) => (
                            <Badge key={type} variant="destructive" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last: {new Date(violator.last_violation).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  
                  {topViolators.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No repeat violators in this period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Trends ({formatTimeRange(timeRange)})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {trendData.map((day, index) => (
                    <div key={day.date} className="border rounded p-3 space-y-2">
                      <div className="text-sm font-medium">
                        {new Date(day.date).toLocaleDateString()}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Flags:</span>
                          <span className="font-medium">{day.flags}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Resolved:</span>
                          <span className="font-medium">{day.resolutions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>New Users:</span>
                          <span className="font-medium">{day.new_users}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reviews:</span>
                          <span className="font-medium">{day.new_reviews}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Violation Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {violationPatterns.map((pattern) => (
                  <div key={pattern.type} className="border rounded p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{pattern.type}</h3>
                      {getTrendIcon(pattern.trend)}
                    </div>
                    <div className="text-2xl font-bold">{pattern.count}</div>
                    <div className={`text-sm ${getTrendColor(pattern.trend)}`}>
                      {pattern.percentage_change > 0 ? '+' : ''}{pattern.percentage_change.toFixed(1)}% vs previous period
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Activity Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2">
                  {userActivity.map((hour) => (
                    <div key={hour.hour} className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        {hour.hour.toString().padStart(2, '0')}:00
                      </div>
                      <div className="space-y-1">
                        <div 
                          className="bg-blue-200 rounded text-xs p-1"
                          style={{ height: `${Math.max(hour.review_submissions * 2, 10)}px` }}
                          title={`${hour.review_submissions} reviews`}
                        >
                          {hour.review_submissions > 5 ? hour.review_submissions : ''}
                        </div>
                        <div 
                          className="bg-red-200 rounded text-xs p-1"
                          style={{ height: `${Math.max(hour.flag_submissions * 4, 8)}px` }}
                          title={`${hour.flag_submissions} flags`}
                        >
                          {hour.flag_submissions > 2 ? hour.flag_submissions : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-200 rounded"></div>
                    <span>Review Submissions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-200 rounded"></div>
                    <span>Flag Submissions</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peak Activity Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userActivity
                  .sort((a, b) => b.review_submissions - a.review_submissions)
                  .slice(0, 5)
                  .map((hour, index) => (
                    <div key={hour.hour} className="flex justify-between items-center">
                      <span className="font-medium">
                        #{index + 1} - {hour.hour.toString().padStart(2, '0')}:00
                      </span>
                      <div className="flex space-x-4 text-sm">
                        <span>{hour.review_submissions} reviews</span>
                        <span>{hour.flag_submissions} flags</span>
                        <span>{hour.user_registrations} signups</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAnalyticsPanel;