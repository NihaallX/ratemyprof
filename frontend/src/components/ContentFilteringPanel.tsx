import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Filter,
  Play,
  Eye,
  Settings
} from 'lucide-react';

interface ContentAnalysis {
  is_profane: boolean;
  profanity_score: number;
  is_spam: boolean;
  spam_score: number;
  quality_score: number;
  sentiment_score: number;
  auto_flag: boolean;
  flag_reasons: string[];
  cleaned_text?: string;
}

interface FilterStats {
  total_auto_flags: number;
  professor_review_flags: number;
  college_review_flags: number;
  flag_type_distribution: Record<string, number>;
  content_filter_stats: {
    profanity_threshold: number;
    spam_threshold: number;
    quality_threshold: number;
    sentiment_threshold: number;
    spam_patterns_count: number;
    quality_keywords_count: number;
    poor_quality_indicators_count: number;
  };
}

interface AnalysisLog {
  id: string;
  review_id: string;
  review_type: 'professor' | 'college';
  profanity_score: number;
  spam_score: number;
  quality_score: number;
  sentiment_score: number;
  auto_flagged: boolean;
  flag_reasons: string[];
  analyzed_at: string;
}

const ContentFilteringPanel: React.FC = () => {
  const { showToast } = useNotification();
  const [testText, setTestText] = useState('');
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [filterStats, setFilterStats] = useState<FilterStats | null>(null);
  const [analysisLogs, setAnalysisLogs] = useState<AnalysisLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkAnalysisRunning, setBulkAnalysisRunning] = useState(false);

  // Load filter stats on component mount
  useEffect(() => {
    loadFilterStats();
    loadAnalysisLogs();
  }, []);

  const loadFilterStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/moderation/content/filter-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFilterStats(data);
      }
    } catch (error) {
      console.error('Error loading filter stats:', error);
    }
  };

  const loadAnalysisLogs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/moderation/content/analysis-logs?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisLogs(data.logs);
      }
    } catch (error) {
      console.error('Error loading analysis logs:', error);
    }
  };

  const analyzeTestContent = async () => {
    if (!testText.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/moderation/content/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: testText }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Error analyzing content:', error);
    } finally {
      setLoading(false);
    }
  };

  const runBulkAnalysis = async () => {
    setBulkAnalysisRunning(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/moderation/content/bulk-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ limit: 100 }),
      });

      if (response.ok) {
        showToast('Bulk analysis started! Running in background...', 'success');
        // Refresh stats after a short delay
        setTimeout(() => {
          loadFilterStats();
          loadAnalysisLogs();
        }, 2000);
      }
    } catch (error) {
      console.error('Error starting bulk analysis:', error);
    } finally {
      setBulkAnalysisRunning(false);
    }
  };

  const getScoreColor = (score: number, isHighBad: boolean = true) => {
    if (isHighBad) {
      if (score >= 0.7) return 'text-red-600';
      if (score >= 0.4) return 'text-yellow-600';
      return 'text-green-600';
    } else {
      if (score >= 0.7) return 'text-green-600';
      if (score >= 0.4) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.3) return 'text-green-600';
    if (score >= -0.3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Automated Content Filtering</h2>
        </div>
        <Button 
          onClick={runBulkAnalysis} 
          disabled={bulkAnalysisRunning}
          className="flex items-center space-x-2"
        >
          <Play className="h-4 w-4" />
          <span>{bulkAnalysisRunning ? 'Running...' : 'Bulk Analysis'}</span>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="test">Test Content</TabsTrigger>
          <TabsTrigger value="logs">Analysis Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {filterStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Auto-Flags</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filterStats.total_auto_flags}</div>
                  <p className="text-xs text-muted-foreground">
                    {filterStats.professor_review_flags} professor + {filterStats.college_review_flags} college
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Spam Patterns</CardTitle>
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filterStats.content_filter_stats.spam_patterns_count}
                  </div>
                  <p className="text-xs text-muted-foreground">Active detection patterns</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quality Keywords</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {filterStats.content_filter_stats.quality_keywords_count}
                  </div>
                  <p className="text-xs text-muted-foreground">Positive indicators</p>
                </CardContent>
              </Card>
            </div>
          )}

          {filterStats && (
            <Card>
              <CardHeader>
                <CardTitle>Flag Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(filterStats.flag_type_distribution).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {filterStats && (
            <Card>
              <CardHeader>
                <CardTitle>Filter Thresholds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm font-medium">Profanity</div>
                    <div className="text-lg">{filterStats.content_filter_stats.profanity_threshold}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Spam</div>
                    <div className="text-lg">{filterStats.content_filter_stats.spam_threshold}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Quality</div>
                    <div className="text-lg">{filterStats.content_filter_stats.quality_threshold}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Sentiment</div>
                    <div className="text-lg">{filterStats.content_filter_stats.sentiment_threshold}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Content Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Test Text</label>
                <Textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter text to analyze..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              <Button onClick={analyzeTestContent} disabled={loading || !testText.trim()}>
                {loading ? 'Analyzing...' : 'Analyze Content'}
              </Button>

              {analysis && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">Profanity</div>
                      <div className={`text-lg font-bold ${getScoreColor(analysis.profanity_score)}`}>
                        {(analysis.profanity_score * 100).toFixed(1)}%
                      </div>
                      {analysis.is_profane && <Badge variant="destructive">Detected</Badge>}
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Spam</div>
                      <div className={`text-lg font-bold ${getScoreColor(analysis.spam_score)}`}>
                        {(analysis.spam_score * 100).toFixed(1)}%
                      </div>
                      {analysis.is_spam && <Badge variant="destructive">Detected</Badge>}
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Quality</div>
                      <div className={`text-lg font-bold ${getScoreColor(analysis.quality_score, false)}`}>
                        {(analysis.quality_score * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Sentiment</div>
                      <div className={`text-lg font-bold ${getSentimentColor(analysis.sentiment_score)}`}>
                        {analysis.sentiment_score.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {analysis.auto_flag && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Auto-Flag Triggered:</strong> {analysis.flag_reasons.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {analysis.cleaned_text && analysis.cleaned_text !== testText && (
                    <div>
                      <label className="text-sm font-medium">Cleaned Text</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded border">
                        {analysis.cleaned_text}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Analysis Logs</CardTitle>
              <Button onClick={loadAnalysisLogs} variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisLogs.map((log) => (
                  <div key={log.id} className="border rounded p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Badge variant={log.review_type === 'professor' ? 'default' : 'secondary'}>
                          {log.review_type}
                        </Badge>
                        {log.auto_flagged && (
                          <Badge variant="destructive">Auto-Flagged</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.analyzed_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Profanity:</span> {(log.profanity_score * 100).toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-medium">Spam:</span> {(log.spam_score * 100).toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-medium">Quality:</span> {(log.quality_score * 100).toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-medium">Sentiment:</span> {log.sentiment_score.toFixed(2)}
                      </div>
                    </div>
                    
                    {log.flag_reasons.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium">Reasons:</span> {log.flag_reasons.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
                
                {analysisLogs.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No analysis logs found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Filter Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Filter settings are currently managed server-side. Contact system administrator to modify thresholds and detection patterns.
                </AlertDescription>
              </Alert>
              
              {filterStats && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Current Configuration</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Profanity Threshold: {filterStats.content_filter_stats.profanity_threshold}</div>
                      <div>Spam Threshold: {filterStats.content_filter_stats.spam_threshold}</div>
                      <div>Quality Threshold: {filterStats.content_filter_stats.quality_threshold}</div>
                      <div>Sentiment Threshold: {filterStats.content_filter_stats.sentiment_threshold}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Detection Components</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Spam Patterns: {filterStats.content_filter_stats.spam_patterns_count}</div>
                      <div>Quality Keywords: {filterStats.content_filter_stats.quality_keywords_count}</div>
                      <div>Poor Quality Indicators: {filterStats.content_filter_stats.poor_quality_indicators_count}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentFilteringPanel;