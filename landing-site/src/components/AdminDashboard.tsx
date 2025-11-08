import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface MetricData {
  event_type: string;
  count: number;
  data?: any;
}

interface StatsData {
  totalPageViews: number;
  totalInteractions: number;
  topProfessors: Array<{ professorId: number; interactions: number }>;
  recentEvents: Array<{ event_type: string; timestamp: string; data: any }>;
  timeSeriesData: Array<{ timestamp: string; count: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  // Simple auth check
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, use proper authentication
    if (password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth', 'true');
    } else {
      alert('Invalid password');
    }
  };

  useEffect(() => {
    const authStatus = localStorage.getItem('admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch initial stats
  useEffect(() => {
    if (!isAuthenticated) return;

    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to fetch stats:', err));
  }, [isAuthenticated]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const ws = new WebSocket(`ws://${window.location.hostname}:3000/ws/stats`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStats((prevStats) => {
        if (!prevStats) return data;
        
        return {
          ...prevStats,
          ...data,
          recentEvents: [data.latestEvent, ...prevStats.recentEvents.slice(0, 19)],
        };
      });
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [isAuthenticated]);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `metrics-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_auth');
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900 p-12 rounded-2xl border border-white/10 max-w-md w-full"
        >
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleAuth}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg"
            >
              Login
            </motion.button>
          </form>
          <p className="text-gray-500 text-sm mt-4 text-center">
            Default password: admin123
          </p>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading stats...</div>
      </div>
    );
  }

  // Chart data
  const chartData = {
    labels: stats.timeSeriesData.map((d) =>
      new Date(d.timestamp).toLocaleTimeString()
    ),
    datasets: [
      {
        label: 'Events per Minute',
        data: stats.timeSeriesData.map((d) => d.count),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Real-time engagement metrics</p>
        </div>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="px-6 py-3 bg-secondary text-white rounded-lg font-semibold"
          >
            Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold"
          >
            Logout
          </motion.button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          <div className="text-gray-400 mb-2">Total Page Views</div>
          <div className="text-5xl font-bold">{stats.totalPageViews.toLocaleString()}</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-secondary/20 to-secondary/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          <div className="text-gray-400 mb-2">Total Interactions</div>
          <div className="text-5xl font-bold">{stats.totalInteractions.toLocaleString()}</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-accent/20 to-accent/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          <div className="text-gray-400 mb-2">Active Professors</div>
          <div className="text-5xl font-bold">{stats.topProfessors.length}</div>
        </motion.div>
      </div>

      {/* Time Series Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-12"
      >
        <h2 className="text-2xl font-bold mb-6">Activity Timeline</h2>
        <Line data={chartData} options={chartOptions} />
      </motion.div>

      {/* Two columns: Top Professors & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Professors */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold mb-6">Top Professors</h2>
          <div className="space-y-4">
            {stats.topProfessors.slice(0, 10).map((prof, index) => (
              <div
                key={prof.professorId}
                className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">Professor ID: {prof.professorId}</div>
                  </div>
                </div>
                <div className="text-gray-400">{prof.interactions} interactions</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold mb-6">Recent Events</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.recentEvents.map((event, index) => (
              <div
                key={index}
                className="p-4 bg-gray-800/30 rounded-lg text-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-primary">{event.event_type}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {event.data && (
                  <pre className="text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
