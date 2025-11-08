# RateMyProf Landing Site

A production-ready, highly interactive single-page landing site featuring:
- 🎨 **3D Parallax Hero** with depth-mapped professor portraits
- 🌊 **Fluid Blob Masking** via custom GLSL shaders
- 🔤 **Per-Letter Animated Text** with staggered transitions
- 🎭 **Non-Rectangular Cards** with animated clip-path reveals
- 📊 **Real-Time Analytics** dashboard with WebSocket updates
- ⚡ **Buttery Smooth Performance** with 60fps animations
- ♿ **Accessibility First** with reduced-motion fallbacks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Frontend Setup

```bash
cd landing-site
npm install
npm run dev
```

The site will be available at `http://localhost:3001`

### Backend Setup

```bash
cd landing-site-backend
npm install
npm run db:push  # Initialize SQLite database
npm run dev
```

The API will be available at `http://localhost:3000`

### Production Build

```bash
# Frontend
cd landing-site
npm run build
npm run preview

# Backend
cd landing-site-backend
npm run migrate:deploy
npm start
```

## 📁 Project Structure

```
landing-site/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx          # Main landing page
│   │   ├── ParallaxHero.tsx         # 3D parallax hero section
│   │   ├── BlobMask.tsx             # WebGL blob mask shader
│   │   ├── AnimatedText.tsx         # Per-letter text animations
│   │   ├── ProfessorCard.tsx        # Non-rectangular cards
│   │   ├── AdminDashboard.tsx       # Real-time analytics
│   │   └── FPSMeter.tsx             # Performance monitor
│   ├── shaders/
│   │   ├── blob.vert                # Blob vertex shader
│   │   └── blob.frag                # Blob fragment shader
│   ├── utils/
│   │   └── helpers.ts               # Utility functions
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
├── public/
│   ├── models/                      # 3D models (place glTF here)
│   └── textures/                    # Depth maps and textures
├── vite.config.ts
├── tailwind.config.js
└── package.json

landing-site-backend/
├── src/
│   └── server.js                    # Fastify server
├── prisma/
│   └── schema.prisma                # Database schema
├── tests/
│   └── server.test.js               # API tests
└── package.json
```

## 🎨 Key Features Explained

### 1. 3D Parallax Hero

The hero section uses Three.js with a subdivided plane and depth map texture:

```typescript
// Depth map: lighter pixels = closer to camera
// The shader displaces vertices based on depth and mouse position
// Creates realistic 3D parallax from 2D images
```

**To replace the professor image:**
1. Place your image in `public/textures/professor.jpg`
2. Create a depth map (grayscale image where white = close, black = far)
3. Update `ParallaxHero.tsx` texture loading paths

### 2. Blob Masking Shader

Custom GLSL fragment shader creates fluid, organic blobs that follow the cursor:

```glsl
// Uses smooth noise for organic shapes
// Reveals underlying content (ratings, badges)
// GPU-accelerated for smooth 60fps performance
```

### 3. Non-Rectangular Cards

Professor cards use CSS `clip-path` with animated reveals:

```css
/* Three alternating shapes */
- Hexagon: polygon(30% 0%, 70% 0%, ...)
- Ellipse: ellipse(50% 50% at 50% 50%)
- Blob: polygon(50% 0%, 80% 10%, ...)
```

On hover, an animated circle clip-path expands to reveal ratings.

### 4. Scroll-Driven Animations

Uses Lenis for natural smooth scrolling + Framer Motion for scroll-triggered animations:

```typescript
const { scrollYProgress } = useScroll();
const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
```

### 5. Real-Time Analytics

WebSocket connection pushes live metrics to admin dashboard:
- Page views
- User interactions
- Top professors
- Time-series charts

## 📊 Backend API

### Endpoints

**POST `/api/metrics`**
Track user events
```json
{
  "event_type": "page_view",
  "data": { "page": "/" }
}
```

**GET `/api/stats`**
Get aggregated statistics
```json
{
  "totalPageViews": 15234,
  "totalInteractions": 8756,
  "topProfessors": [...],
  "recentEvents": [...],
  "timeSeriesData": [...]
}
```

**GET `/api/health`**
Health check endpoint

**GET `/api/export`**
Export metrics as CSV (admin only)

**WebSocket `/ws/stats`**
Real-time stats updates

### Rate Limiting

- 100 requests per minute per IP
- Automatic throttling
- In-memory implementation (use Redis in production)

### Metrics Buffering

- Writes batched (50 metrics or 5 seconds)
- Reduces database load
- Automatic flush on shutdown

## 🎯 Performance Optimizations

### Code Splitting

```javascript
// Vite config splits heavy libraries
manualChunks: {
  'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
  'charts-vendor': ['chart.js', 'react-chartjs-2'],
}
```

### Reduced Motion

```javascript
// Respects prefers-reduced-motion
if (prefersReducedMotion()) {
  setEnable3D(false); // Fallback to static images
}
```

### Low Power Mode

```javascript
// Detects low-memory devices
if (isLowPowerMode()) {
  setEnable3D(false); // Disable heavy 3D
}
```

### GPU Acceleration

```css
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}
```

## 🔐 Admin Dashboard

Access at `/admin`

**Default credentials:**
- Password: `admin123`

**Features:**
- Live metrics display
- WebSocket real-time updates
- Time-series charts (Chart.js)
- CSV export
- Top professors ranking
- Recent events log

**Security Note:** In production, implement proper JWT/session authentication and replace the simple password check.

## 🧪 Testing

### Frontend
```bash
cd landing-site
npm run lint
npm run build  # Test build succeeds
```

### Backend
```bash
cd landing-site-backend
npm test  # Run Jest tests
```

### CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):
- Runs on push/PR
- Lints code
- Builds frontend
- Tests backend
- Uploads artifacts

## 📈 Lighthouse Targets

**Desktop:**
- Performance: >= 90
- Accessibility: >= 95
- Best Practices: >= 90
- SEO: >= 90

**Mobile:**
- Performance: >= 70 (heavy 3D affects mobile)
- Accessibility: >= 95
- Best Practices: >= 90
- SEO: >= 90

**Optimizations applied:**
- Code splitting
- Lazy loading
- Image optimization
- Reduced motion fallbacks
- Semantic HTML

## 🔄 Asset Replacement Guide

### Professor Images

1. **Main Portrait:**
   - Place image: `public/textures/professor-portrait.jpg`
   - Recommended size: 1024x1024px
   - Update `ParallaxHero.tsx` line 28

2. **Depth Map:**
   - Create grayscale version: lighter = closer
   - Place: `public/textures/professor-depth.jpg`
   - Use Photoshop/GIMP: face white, background black
   - Update `ParallaxHero.tsx` line 63

### 3D Models (Optional)

1. Place glTF model: `public/models/professor.glb`
2. Include textures: diffuse, normal, roughness
3. Update model loader in `ParallaxHero.tsx`

```typescript
import { useGLTF } from '@react-three/drei';
const { scene } = useGLTF('/models/professor.glb');
```

### Card Images

Update `ProfessorCard.tsx`:
```typescript
<img src={professor.imageUrl} alt={professor.name} />
```

## 🌐 Deployment

### Frontend (Vite Static Site)

**Vercel:**
```bash
npm install -g vercel
cd landing-site
vercel
```

**Netlify:**
```bash
cd landing-site
npm run build
# Upload dist/ folder
```

### Backend (Node.js + Fastify)

**Railway:**
```bash
cd landing-site-backend
# Connect GitHub repo
# Set environment variables
```

**Heroku:**
```bash
cd landing-site-backend
heroku create
git push heroku main
```

**Environment Variables:**
```env
PORT=3000
ADMIN_PASSWORD=your-secure-password
DATABASE_URL=postgresql://...
```

### Database Migration

**SQLite (Development):**
```bash
npm run db:push
```

**PostgreSQL (Production):**
1. Update `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Run migration:
```bash
npm run migrate:deploy
```

## 🐛 Troubleshooting

### 3D Scene Not Rendering
- Check browser WebGL support: https://get.webgl.org/
- Open DevTools console for Three.js errors
- Verify texture paths in `ParallaxHero.tsx`

### WebSocket Connection Failed
- Ensure backend is running on port 3000
- Check CORS configuration in `server.js`
- Verify firewall allows WebSocket connections

### High CPU Usage
- FPS meter shows < 30fps: device may be underpowered
- Enable reduced motion in OS settings
- Code will automatically fallback to static images

### Database Errors
- Run `npm run db:push` to sync schema
- Check file permissions on `dev.db`
- Verify DATABASE_URL in `.env`

## 📚 Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Three.js** - 3D graphics
- **@react-three/fiber** - React renderer for Three.js
- **Framer Motion** - Animations
- **Lenis** - Smooth scroll
- **Chart.js** - Admin dashboard charts

### Backend
- **Fastify** - Web framework
- **Prisma** - ORM
- **SQLite** - Database (dev)
- **WebSocket** - Real-time updates
- **Jest** - Testing

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📞 Support

For issues and questions:
- Create GitHub issue
- Check troubleshooting section
- Review console errors

---

**Built with ❤️ for RateMyProf India**
