# RateMyProf Landing Site - Complete Repository Structure

## 📦 Repository Tree

```
ratemyprof/
│
├── landing-site/                          # Frontend (Vite + React + Three.js)
│   ├── .github/
│   │   └── workflows/
│   │       └── ci.yml                     # GitHub Actions CI/CD pipeline
│   │
│   ├── public/
│   │   ├── models/
│   │   │   └── professor.glb              # (Optional) 3D model - PLACE YOUR MODEL HERE
│   │   └── textures/
│   │       ├── professor-portrait.jpg     # (Optional) Main portrait - REPLACE THIS
│   │       └── professor-depth.jpg        # (Optional) Depth map - REPLACE THIS
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.tsx         # Real-time analytics dashboard
│   │   │   ├── AnimatedText.tsx           # Per-letter text animations
│   │   │   ├── BlobMask.tsx               # WebGL blob reveal shader
│   │   │   ├── FPSMeter.tsx               # Dev-only performance monitor
│   │   │   ├── LandingPage.tsx            # Main landing page component
│   │   │   ├── ParallaxHero.tsx           # 3D depth-mapped parallax hero
│   │   │   ├── ProfessorCard.tsx          # Non-rectangular cards with clip-path
│   │   │   └── ProfessorModel.tsx         # Optional glTF 3D model loader
│   │   │
│   │   ├── shaders/
│   │   │   ├── blob.vert                  # Blob vertex shader
│   │   │   └── blob.frag                  # Blob fragment shader (GLSL)
│   │   │
│   │   ├── utils/
│   │   │   └── helpers.ts                 # Utility functions (lerp, throttle, etc.)
│   │   │
│   │   ├── App.tsx                        # React Router setup
│   │   ├── main.tsx                       # React entry point
│   │   ├── index.css                      # Global CSS + Tailwind directives
│   │   └── vite-env.d.ts                  # Vite TypeScript declarations
│   │
│   ├── .gitignore                         # Git ignore rules
│   ├── index.html                         # HTML entry point
│   ├── package.json                       # Frontend dependencies
│   ├── postcss.config.js                  # PostCSS configuration
│   ├── README.md                          # Comprehensive documentation
│   ├── tailwind.config.js                 # Tailwind CSS theme
│   ├── tsconfig.json                      # TypeScript configuration
│   ├── tsconfig.node.json                 # TypeScript Node config
│   └── vite.config.ts                     # Vite build configuration
│
├── landing-site-backend/                  # Backend (Fastify + Prisma)
│   ├── prisma/
│   │   └── schema.prisma                  # Database schema (SQLite/PostgreSQL)
│   │
│   ├── src/
│   │   └── server.js                      # Main Fastify server
│   │
│   ├── tests/
│   │   └── server.test.js                 # Jest API tests
│   │
│   ├── .env                               # Environment variables (git-ignored)
│   ├── .env.example                       # Example environment file
│   ├── .gitignore                         # Git ignore rules
│   ├── dev.db                             # SQLite database (git-ignored, created on setup)
│   ├── jest.config.js                     # Jest test configuration
│   └── package.json                       # Backend dependencies
│
├── LANDING_SITE_SETUP.md                  # Complete setup guide
└── setup-landing-site.ps1                 # Automated setup script (PowerShell)
```

## 🎯 Key Files Explained

### Frontend Core Files

**`src/App.tsx`**
- React Router setup
- Lenis smooth scroll initialization
- Routes: `/` (landing) and `/admin` (dashboard)

**`src/components/LandingPage.tsx`**
- Main landing page with all sections
- Mouse/gyro tracking state
- Search functionality
- Mock professor data
- Hero, features, and CTA sections

**`src/components/ParallaxHero.tsx`**
- Three.js scene with subdivided plane (64x64 vertices)
- Custom shader for depth-based parallax
- Canvas texture creation for placeholder portrait
- Depth map for 3D displacement
- Mouse and gyroscope-driven camera

**`src/components/BlobMask.tsx`**
- WebGL shader component
- Cursor-following fluid blob
- Uses GLSL shaders from `shaders/` directory
- Additive blending for glow effect

**`src/components/AnimatedText.tsx`**
- Per-letter animation components
- `AnimatedText`: entrance animations
- `AnimatedWord`: word-by-word with rotation
- Framer Motion spring physics

**`src/components/ProfessorCard.tsx`**
- Non-rectangular cards (hexagon, ellipse, blob)
- CSS `clip-path` animations
- Hover reveal with circle expand
- Rating display and interaction tracking

**`src/components/AdminDashboard.tsx`**
- Real-time WebSocket connection
- Chart.js time-series visualization
- Live metrics display
- CSV export functionality
- Simple password authentication

**`src/components/FPSMeter.tsx`**
- Development-only performance monitor
- Displays current FPS
- Color-coded (green >= 55, yellow >= 30, red < 30)

**`src/shaders/blob.frag`**
- GLSL fragment shader
- Smooth noise functions
- Dynamic radius with animation
- Gradient coloring and glow

**`src/utils/helpers.ts`**
- `trackEvent()`: analytics tracking
- `prefersReducedMotion()`: accessibility check
- `isLowPowerMode()`: device detection
- `debounce()`, `throttle()`: performance utilities
- `lerp()`, `clamp()`, `mapRange()`: math utilities

### Configuration Files

**`vite.config.ts`**
- Dev server on port 3001
- Proxy to backend on port 3000
- Code splitting for Three.js and Chart.js
- Build optimization

**`tailwind.config.js`**
- Custom color scheme (primary, secondary, accent)
- Custom animations (float, pulse-slow)
- Content paths for purging

**`tsconfig.json`**
- TypeScript strict mode enabled
- React JSX transform
- Module bundler resolution

### Backend Core Files

**`src/server.js`**
- Fastify web server
- CORS and WebSocket support
- Metrics buffering and batch writes
- Rate limiting (100 req/min per IP)
- 5 REST endpoints + 1 WebSocket endpoint
- Graceful shutdown with metric flushing

**`prisma/schema.prisma`**
- Metric model definition
- SQLite (dev) or PostgreSQL (prod)
- Indexed on eventType and timestamp

### Setup & Documentation

**`setup-landing-site.ps1`**
- Automated PowerShell setup script
- Installs all dependencies
- Initializes database
- Provides next steps

**`LANDING_SITE_SETUP.md`**
- Complete setup instructions
- Deployment guides
- Troubleshooting section
- Asset replacement guide
- Performance benchmarks

**`landing-site/README.md`**
- Feature documentation
- API reference
- Technology stack
- Code examples
- Architecture explanations

## 📊 Data Flow

### Event Tracking Flow
```
User Interaction (Frontend)
    ↓
trackEvent() in helpers.ts
    ↓
POST /api/metrics (Backend)
    ↓
Metrics buffer (in-memory)
    ↓
Batch write to Database (every 5s or 50 events)
    ↓
WebSocket broadcast to Admin clients
    ↓
AdminDashboard updates (real-time)
```

### Admin Dashboard Flow
```
User opens /admin
    ↓
Password authentication (localStorage)
    ↓
GET /api/stats (initial data)
    ↓
WebSocket connection established
    ↓
Backend calculates stats every event
    ↓
Push updates via WebSocket
    ↓
React state updates
    ↓
Chart.js re-renders
```

## 🔧 Development Workflow

### Starting Development

```powershell
# Terminal 1: Backend
cd landing-site-backend
npm run dev

# Terminal 2: Frontend
cd landing-site
npm run dev
```

### Building for Production

```powershell
# Frontend
cd landing-site
npm run build        # Creates dist/
npm run preview      # Test production build

# Backend
cd landing-site-backend
npm run migrate:deploy  # Run migrations
npm start               # Start production server
```

### Running Tests

```powershell
# Backend tests
cd landing-site-backend
npm test

# Frontend lint
cd landing-site
npm run lint
```

## 📦 Dependencies Overview

### Frontend (package.json)

**Core:**
- `react` ^18.2.0
- `react-dom` ^18.2.0
- `typescript` ^5.2.2

**3D Graphics:**
- `three` ^0.159.0
- `@react-three/fiber` ^8.15.12
- `@react-three/drei` ^9.92.7

**Animation:**
- `framer-motion` ^10.16.16
- `@studio-freight/lenis` ^1.0.29

**Charts:**
- `chart.js` ^4.4.1
- `react-chartjs-2` ^5.2.0

**Routing:**
- `react-router-dom` ^6.20.1

**Build Tools:**
- `vite` ^5.0.8
- `tailwindcss` ^3.4.0
- `@vitejs/plugin-react` ^4.2.1

### Backend (package.json)

**Core:**
- `fastify` ^4.25.2
- `@prisma/client` ^5.7.1
- `dotenv` ^16.3.1

**Plugins:**
- `@fastify/cors` ^8.5.0
- `@fastify/websocket` ^9.0.0

**Testing:**
- `jest` ^29.7.0
- `supertest` ^6.3.3

**Dev Tools:**
- `prisma` ^5.7.1

## 🎨 Customization Points

### 1. Replace Professor Images
- `public/textures/professor-portrait.jpg`
- `public/textures/professor-depth.jpg`

### 2. Add 3D Model
- `public/models/professor.glb`
- Update `ProfessorModel.tsx`

### 3. Customize Colors
- `tailwind.config.js` → colors section

### 4. Modify Professor Data
- `LandingPage.tsx` → `mockProfessors` array

### 5. Change Analytics Events
- `helpers.ts` → `trackEvent()` calls
- `server.js` → event type handling

## 🚀 Deployment Checklist

- [ ] Build frontend with `npm run build`
- [ ] Test production build with `npm run preview`
- [ ] Run backend tests with `npm test`
- [ ] Set production environment variables
- [ ] Migrate database to PostgreSQL (if needed)
- [ ] Deploy backend to hosting service
- [ ] Deploy frontend dist/ to CDN/static host
- [ ] Update frontend API URLs
- [ ] Test WebSocket connection
- [ ] Run Lighthouse audit
- [ ] Enable HTTPS
- [ ] Set strong admin password
- [ ] Monitor performance metrics

## 📞 Support & Resources

**Documentation:**
- Frontend: `landing-site/README.md`
- Setup: `LANDING_SITE_SETUP.md`
- This file: Repo structure overview

**External Docs:**
- Three.js: https://threejs.org/docs/
- React Three Fiber: https://docs.pmnd.rs/react-three-fiber
- Fastify: https://www.fastify.io/docs/
- Prisma: https://www.prisma.io/docs/

**Learning Resources:**
- GLSL Shaders: https://thebookofshaders.com/
- Three.js Journey: https://threejs-journey.com/
- Framer Motion: https://www.framer.com/motion/

---

**Complete! 🎉**

All files are in place and documented. Run `.\setup-landing-site.ps1` to get started!
