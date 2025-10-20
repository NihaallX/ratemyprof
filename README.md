# 🎓 RateMyProf India Platform

> A comprehensive professor rating platform for Indian universities with advanced moderation tools

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)]()
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-000000)]()
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791)]()

---

## 🚀 Quick Start

### Start Both Servers (Recommended)

**Windows:**
```batch
start-dev.bat
```

**PowerShell:**
```powershell
.\start-dev.ps1
```

This will start:
- 🌐 Frontend: http://localhost:3000
- 📡 Backend API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs

---

## 📖 Documentation

**Start Here:**
1. 📄 **[EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)** - One-page project overview
2. 📊 **[VISUAL_PROJECT_MAP.md](VISUAL_PROJECT_MAP.md)** - Visual guide with diagrams
3. 📋 **[PROJECT_STATUS_OVERVIEW.md](PROJECT_STATUS_OVERVIEW.md)** - Complete detailed status

**Technical Documentation:**
- [SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md) - Full architecture
- [NEW_FEATURES_DOCUMENTATION.md](NEW_FEATURES_DOCUMENTATION.md) - Recent features
- [PRIORITY_2-5_IMPLEMENTATION_COMPLETE.md](PRIORITY_2-5_IMPLEMENTATION_COMPLETE.md) - Admin features

---

## ✨ Features

### For Students
- ⭐ Multi-dimensional professor ratings (Overall, Clarity, Helpfulness, Difficulty)
- 🔒 Anonymous or public review posting
- 🗳️ Vote on review helpfulness
- 🚩 Flag inappropriate content
- ➕ Add professors not in database
- 📊 Personal review dashboard

### For Administrators
- 🤖 AI-powered content filtering (profanity, spam detection)
- 📊 Comprehensive analytics dashboard
- ⚡ Bulk moderation operations
- 📧 User notification system
- 🔍 Review flagging and appeals management
- 👥 User management (ban, warn, delete)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Python FastAPI, Pydantic, Uvicorn |
| **Database** | PostgreSQL (via Supabase) |
| **Auth** | Supabase Authentication |
| **ML/AI** | scikit-learn, TextBlob, better-profanity |

---

## 📦 Installation

### Prerequisites
- Node.js 16+
- Python 3.11+
- npm or yarn
- Git

### First Time Setup

1. **Clone the repository**
```bash
git clone https://github.com/NihaallX/ratemyprof.in.git
cd ratemyprof
```

2. **Setup Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. **Setup Frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. **Setup Database**
```bash
python backend/setup_database.py
```

5. **Start Development Servers**
```bash
# From project root:
start-dev.bat  # Windows
# or
.\start-dev.ps1  # PowerShell
```

---

## 📁 Project Structure

```
ratemyprof/
├── backend/              # Python FastAPI application
│   ├── src/
│   │   ├── api/         # REST API endpoints
│   │   ├── services/    # Business logic
│   │   ├── models/      # Data models
│   │   └── main.py      # Entry point
│   └── tests/           # Test suites
│
├── frontend/            # Next.js React application
│   ├── src/
│   │   ├── app/        # Next.js 14 pages
│   │   ├── components/ # React components
│   │   └── services/   # API clients
│   └── public/         # Static assets
│
├── scripts/            # Database & utility scripts
├── specs/              # Project specifications
└── docs/               # Documentation files
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

---

## 📊 Current Status

| Component | Status | Coverage |
|-----------|--------|----------|
| Core Platform | ✅ Complete | 100% |
| Admin Features | ✅ Complete | 100% |
| Testing | ⚠️ In Progress | 60% |
| Documentation | ✅ Complete | 95% |

**Overall:** 🟢 Production Ready

---

## 🎯 Roadmap

### Current Phase: Pre-Launch Testing
- [ ] Complete remaining test coverage
- [ ] Security audit
- [ ] Performance optimization
- [ ] User documentation

### Next Phase: Beta Launch
- [ ] Deploy to production
- [ ] Beta testing with users
- [ ] Gather feedback
- [ ] Iterate on features

### Future Enhancements
- Mobile app (React Native)
- Advanced search (Elasticsearch)
- Email notifications
- AI review summarization
- Multi-language support

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

[To be determined]

---

## 👥 Team

- **Project Lead:** NihaallX
- **Repository:** github.com/NihaallX/ratemyprof.in
- **Branch:** 001-ratemyprof-india-platform

---

## 📞 Support

For questions or issues:
- 📧 Email: [To be added]
- 🐛 Issues: [GitHub Issues](https://github.com/NihaallX/ratemyprof.in/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/NihaallX/ratemyprof.in/discussions)

---

## ⭐ Acknowledgments

Built for Indian universities, starting with Vishwakarma University (VU) Pune.

Special thanks to all contributors and beta testers!

---

<div align="center">
  
**Made with ❤️ for Indian Education**

[Documentation](EXECUTIVE_SUMMARY.md) • [Features](NEW_FEATURES_DOCUMENTATION.md) • [Architecture](SYSTEM_DOCUMENTATION.md)

</div>
