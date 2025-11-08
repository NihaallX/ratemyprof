import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// WebSocket clients for real-time stats
const wsClients = new Set();

// Metrics buffer for batch writes
const metricsBuffer = [];
const BUFFER_SIZE = 50;
const FLUSH_INTERVAL = 5000; // 5 seconds

// Enable CORS
await fastify.register(cors, {
  origin: true,
});

// Enable WebSocket
await fastify.register(websocket);

// Rate limiting map (simple in-memory implementation)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100;

// Rate limiting middleware
const checkRateLimit = (ip) => {
  const now = Date.now();
  const requests = rateLimitMap.get(ip) || [];
  
  // Remove old requests outside window
  const recentRequests = requests.filter((time) => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
};

// Flush metrics buffer to database
async function flushMetrics() {
  if (metricsBuffer.length === 0) return;
  
  const batch = [...metricsBuffer];
  metricsBuffer.length = 0;
  
  try {
    await prisma.metric.createMany({
      data: batch.map((metric) => ({
        eventType: metric.event_type,
        data: metric.data ? JSON.stringify(metric.data) : null,
        timestamp: new Date(metric.timestamp),
      })),
    });
    fastify.log.info(`Flushed ${batch.length} metrics to database`);
  } catch (error) {
    fastify.log.error('Failed to flush metrics:', error);
    // Put them back if failed
    metricsBuffer.push(...batch);
  }
}

// Periodic flush
setInterval(flushMetrics, FLUSH_INTERVAL);

// Health check endpoint
fastify.get('/api/health', async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    reply.code(500);
    return { status: 'unhealthy', error: error.message };
  }
});

// POST /api/metrics - Track events
fastify.post('/api/metrics', async (request, reply) => {
  const ip = request.ip;
  
  if (!checkRateLimit(ip)) {
    reply.code(429);
    return { error: 'Rate limit exceeded' };
  }
  
  const { event_type, data } = request.body;
  
  if (!event_type) {
    reply.code(400);
    return { error: 'event_type is required' };
  }
  
  const metric = {
    event_type,
    data,
    timestamp: new Date().toISOString(),
  };
  
  metricsBuffer.push(metric);
  
  // Flush if buffer is full
  if (metricsBuffer.length >= BUFFER_SIZE) {
    flushMetrics();
  }
  
  // Broadcast to WebSocket clients
  const statsUpdate = await calculateStats();
  broadcastStats({ ...statsUpdate, latestEvent: metric });
  
  return { success: true };
});

// GET /api/stats - Get aggregated statistics
fastify.get('/api/stats', async (request, reply) => {
  try {
    const stats = await calculateStats();
    return stats;
  } catch (error) {
    fastify.log.error('Failed to get stats:', error);
    reply.code(500);
    return { error: 'Failed to fetch stats' };
  }
});

// Calculate statistics
async function calculateStats() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Total counts
  const totalPageViews = await prisma.metric.count({
    where: { eventType: 'page_view' },
  });
  
  const totalInteractions = await prisma.metric.count({
    where: {
      eventType: {
        in: ['hero_hover', 'profile_card_hover', 'rating_click', 'search_query'],
      },
    },
  });
  
  // Top professors (from interaction data)
  const professorInteractions = await prisma.metric.findMany({
    where: {
      eventType: {
        in: ['profile_card_hover', 'rating_click'],
      },
      timestamp: {
        gte: oneHourAgo,
      },
    },
    select: {
      data: true,
    },
  });
  
  const professorCounts = {};
  professorInteractions.forEach((metric) => {
    try {
      const data = JSON.parse(metric.data || '{}');
      const profId = data.professorId;
      if (profId) {
        professorCounts[profId] = (professorCounts[profId] || 0) + 1;
      }
    } catch (e) {
      // Skip invalid JSON
    }
  });
  
  const topProfessors = Object.entries(professorCounts)
    .map(([professorId, interactions]) => ({
      professorId: parseInt(professorId),
      interactions,
    }))
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, 10);
  
  // Recent events
  const recentEvents = await prisma.metric.findMany({
    take: 20,
    orderBy: {
      timestamp: 'desc',
    },
    select: {
      eventType: true,
      data: true,
      timestamp: true,
    },
  });
  
  // Time series (events per minute for last hour)
  const timeSeriesData = await getTimeSeries(oneHourAgo, now);
  
  return {
    totalPageViews,
    totalInteractions,
    topProfessors,
    recentEvents: recentEvents.map((e) => ({
      event_type: e.eventType,
      data: e.data ? JSON.parse(e.data) : null,
      timestamp: e.timestamp.toISOString(),
    })),
    timeSeriesData,
  };
}

// Get time series data
async function getTimeSeries(start, end) {
  const metrics = await prisma.metric.findMany({
    where: {
      timestamp: {
        gte: start,
        lte: end,
      },
    },
    select: {
      timestamp: true,
    },
    orderBy: {
      timestamp: 'asc',
    },
  });
  
  // Group by minute
  const minuteCounts = {};
  metrics.forEach((metric) => {
    const minute = new Date(metric.timestamp);
    minute.setSeconds(0, 0);
    const key = minute.toISOString();
    minuteCounts[key] = (minuteCounts[key] || 0) + 1;
  });
  
  // Fill in missing minutes with 0
  const result = [];
  const current = new Date(start);
  current.setSeconds(0, 0);
  
  while (current <= end) {
    const key = current.toISOString();
    result.push({
      timestamp: key,
      count: minuteCounts[key] || 0,
    });
    current.setMinutes(current.getMinutes() + 1);
  }
  
  return result;
}

// Broadcast stats to all WebSocket clients
function broadcastStats(stats) {
  const message = JSON.stringify(stats);
  wsClients.forEach((client) => {
    try {
      client.socket.send(message);
    } catch (error) {
      fastify.log.error('Failed to send to WebSocket client:', error);
    }
  });
}

// WebSocket endpoint for real-time stats
fastify.register(async function (fastify) {
  fastify.get('/ws/stats', { websocket: true }, (connection, req) => {
    const client = { socket: connection.socket };
    wsClients.add(client);
    
    fastify.log.info('WebSocket client connected');
    
    // Send initial stats
    calculateStats().then((stats) => {
      connection.socket.send(JSON.stringify(stats));
    });
    
    connection.socket.on('close', () => {
      wsClients.delete(client);
      fastify.log.info('WebSocket client disconnected');
    });
  });
});

// GET /api/export - Export metrics as CSV
fastify.get('/api/export', async (request, reply) => {
  // Simple auth check (in production, use proper JWT/session)
  const authHeader = request.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  // For demo, allow if no auth or correct password
  // In production, implement proper authentication
  
  try {
    const metrics = await prisma.metric.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: 10000, // Limit to prevent huge exports
    });
    
    // Convert to CSV
    const csvHeader = 'ID,Event Type,Data,Timestamp\n';
    const csvRows = metrics.map((m) => {
      const data = m.data ? m.data.replace(/"/g, '""') : '';
      return `${m.id},"${m.eventType}","${data}","${m.timestamp.toISOString()}"`;
    });
    
    const csv = csvHeader + csvRows.join('\n');
    
    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="metrics.csv"')
      .send(csv);
  } catch (error) {
    fastify.log.error('Failed to export:', error);
    reply.code(500);
    return { error: 'Failed to export data' };
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, flushing metrics and shutting down...');
  await flushMetrics();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, flushing metrics and shutting down...');
  await flushMetrics();
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
