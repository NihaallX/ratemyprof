# RateMyProf Landing Site - Full Setup Guide

## 🎯 Project Overview

This is a production-ready landing site with:
- Interactive 3D hero with parallax depth mapping
- Fluid blob masking shader effects
- Animated per-letter text
- Non-rectangular professor cards
- Real-time analytics dashboard
- Backend API with WebSocket support

## 📦 What's Included

```
landing-site/              → Vite + React + Three.js frontend
landing-site-backend/      → Fastify + Prisma backend
```

## 🚀 Complete Setup Instructions

### Step 1: Install Frontend Dependencies

```powershell
cd landing-site
npm install
```

This installs:
- React 18 + TypeScript
- Three.js + @react-three/fiber
- Framer Motion
- Lenis smooth scroll
- Tailwind CSS
- Chart.js

### Step 2: Install Backend Dependencies

```powershell
cd ..\landing-site-backend
npm install
```

This installs:
- Fastify web framework
- Prisma ORM
- WebSocket support
- Jest for testing

### Step 3: Initialize Database

```powershell
# Still in landing-site-backend/
npx prisma generate
npx prisma db push
```

This creates:
- SQLite database file: `dev.db`
- Prisma client for database access
- Metrics table

### Step 4: Start Backend Server

```powershell
# In landing-site-backend/
npm run dev
```

Server runs on `http://localhost:3000`

Endpoints available:
- POST /api/metrics
- GET /api/stats
- GET /api/health
- GET /api/export
- WebSocket /ws/stats

### Step 5: Start Frontend Dev Server

```powershell
# Open new terminal
cd landing-site
npm run dev
```

Frontend runs on `http://localhost:3001`

### Step 6: Test the Site

1. **Landing Page:** http://localhost:3001
   - Hover over hero → 3D parallax follows cursor
   - Scroll down → smooth scroll with animations
   - Hover over cards → clip-path reveals
   - Watch text → per-letter animations

2. **Admin Dashboard:** http://localhost:3001/admin
   - Password: `admin123`
   - See real-time metrics
   - Watch WebSocket updates
   - Export CSV data

## 🎨 Customization

### Replace Professor Image

1. Create your professor image (1024x1024px)
2. Create depth map (grayscale: white = close, black = far)
3. Place in `landing-site/public/textures/`:
   - `professor-portrait.jpg`
   - `professor-depth.jpg`
4. Update `src/components/ParallaxHero.tsx` line 28 & 63

### Add Real 3D Model (Optional)

1. Get/create a glTF model (.glb file)
2. Place in `landing-site/public/models/professor.glb`
3. Update `ParallaxHero.tsx`:

```typescript
import { useGLTF } from '@react-three/drei';
const { scene } = useGLTF('/models/professor.glb');
```

### Customize Colors

Edit `landing-site/tailwind.config.js`:

```javascript
colors: {
  primary: '#6366f1',    // Change this
  secondary: '#8b5cf6',  // Change this
  accent: '#ec4899',     // Change this
}
```

### Modify Professor Data

Edit `landing-site/src/components/LandingPage.tsx`:

```typescript
const mockProfessors: Professor[] = [
  {
    id: 1,
    name: 'Your Professor Name',
    department: 'Department',
    rating: 4.8,
    reviews: 234,
    imageUrl: '/images/prof1.jpg', // Optional
  },
  // Add more...
];
```

## 📊 Analytics Events

The site tracks these events:

| Event Type | When Triggered | Data Captured |
|------------|----------------|---------------|
| `page_view` | Page load | page path |
| `hero_hover` | Mouse enters hero | timestamp |
| `profile_card_hover` | Card hover | professorId, professorName |
| `rating_click` | "View Profile" click | professorId |
| `search_query` | Search submit | query string |

Access analytics at `/admin`

## 🏗️ Production Build

### Build Frontend

```powershell
cd landing-site
npm run build
```

Creates optimized bundle in `dist/`:
- Minified JavaScript
- Split vendor chunks
- Optimized assets

Test production build:
```powershell
npm run preview
```

### Deploy Backend

**Option 1: Railway**
1. Push to GitHub
2. Connect repo to Railway
3. Set environment variables:
   ```
   DATABASE_URL=postgresql://...
   ADMIN_PASSWORD=your-secure-password
   ```

**Option 2: Heroku**
```powershell
cd landing-site-backend
heroku create
git push heroku main
```

**Option 3: VPS (Ubuntu)**
```bash
# Install Node.js 18+
# Clone repo
cd landing-site-backend
npm install
npm run migrate:deploy
npm start
```

### Deploy Frontend

**Option 1: Vercel**
```powershell
cd landing-site
npm install -g vercel
vercel
```

**Option 2: Netlify**
```powershell
cd landing-site
npm run build
# Upload dist/ folder to Netlify
```

**Option 3: Static Host**
- Build with `npm run build`
- Upload `dist/` folder to any static host
- Configure backend API URL

## 🔧 Configuration

### Frontend Environment

Create `landing-site/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

Update in production:
```env
VITE_API_URL=https://your-backend.com
VITE_WS_URL=wss://your-backend.com
```

### Backend Environment

`landing-site-backend/.env`:

```env
PORT=3000
ADMIN_PASSWORD=admin123
DATABASE_URL="file:./dev.db"

# Production PostgreSQL:
# DATABASE_URL="postgresql://user:pass@host:5432/db"
```

### Database Migration (PostgreSQL)

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Run migration:
```powershell
npm run migrate:deploy
```

## 🐛 Common Issues

### Issue: 3D scene black screen
**Solution:** Check browser supports WebGL at https://get.webgl.org/

### Issue: WebSocket connection failed
**Solution:** 
- Ensure backend is running
- Check firewall allows port 3000
- Verify CORS settings

### Issue: High CPU usage
**Solution:**
- Enable reduced motion in OS
- Code auto-detects and disables 3D
- Or manually set `enable3D = false`

### Issue: Database locked
**Solution:**
```powershell
cd landing-site-backend
rm dev.db
npm run db:push
```

## 📏 Performance Benchmarks

### Expected Lighthouse Scores (Desktop)
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 90+

### Load Times (3G)
- Initial load: < 3s
- Interactive: < 5s

### FPS
- Target: 60fps
- Fallback to static if < 30fps

## 🧪 Testing

### Run Backend Tests
```powershell
cd landing-site-backend
npm test
```

### Manual Testing Checklist

- [ ] Hero 3D parallax follows mouse
- [ ] Smooth scroll works (test find-on-page)
- [ ] Text animations stagger correctly
- [ ] Cards clip-path reveals on hover
- [ ] Search form submits
- [ ] Admin login works
- [ ] WebSocket updates real-time
- [ ] CSV export downloads
- [ ] Reduced motion disables animations
- [ ] Mobile touch works
- [ ] Gyroscope on mobile (if available)

## 📚 File Structure Reference

```
landing-site/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx          # Main page component
│   │   ├── ParallaxHero.tsx         # 3D hero with depth map
│   │   ├── BlobMask.tsx             # Shader-based blob reveal
│   │   ├── AnimatedText.tsx         # Per-letter animations
│   │   ├── ProfessorCard.tsx        # Clip-path cards
│   │   ├── AdminDashboard.tsx       # Analytics dashboard
│   │   └── FPSMeter.tsx             # Performance monitor
│   ├── shaders/
│   │   ├── blob.vert                # Vertex shader
│   │   └── blob.frag                # Fragment shader (noise)
│   ├── utils/
│   │   └── helpers.ts               # Utilities (lerp, throttle)
│   ├── App.tsx                      # Router setup
│   ├── main.tsx                     # React entry
│   └── index.css                    # Global CSS + Tailwind
├── public/
│   ├── models/                      # glTF models (optional)
│   └── textures/                    # Depth maps, images
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind theme
├── package.json
└── README.md

landing-site-backend/
├── src/
│   └── server.js                    # Fastify server
├── prisma/
│   └── schema.prisma                # Database schema
├── tests/
│   └── server.test.js               # Jest tests
├── .env                             # Environment variables
└── package.json
```

## 🎓 Learning Resources

### Three.js + React
- https://docs.pmnd.rs/react-three-fiber
- https://threejs-journey.com/

### GLSL Shaders
- https://thebookofshaders.com/
- https://www.shadertoy.com/

### Framer Motion
- https://www.framer.com/motion/

### Fastify
- https://www.fastify.io/docs/

### Prisma
- https://www.prisma.io/docs/

## 💡 Next Steps

1. Replace placeholder images with real professor photos
2. Create depth maps for 3D parallax effect
3. Customize colors and branding
4. Add more professor data
5. Deploy to production
6. Set up proper authentication for admin
7. Monitor performance with Lighthouse
8. Collect real user metrics

## 🆘 Getting Help

1. Check console errors (F12)
2. Review README troubleshooting section
3. Test with FPS meter (bottom right in dev)
4. Check backend logs
5. Verify database has data

## 📞 Support

For issues:
- Review documentation
- Check common issues section
- Verify all dependencies installed
- Ensure ports 3000 and 3001 are free

---

**Ready to launch! 🚀**

Start both servers and visit http://localhost:3001
