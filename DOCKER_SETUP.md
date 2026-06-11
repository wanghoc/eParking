# eParking Docker Setup - Complete Initialization Guide

## ✅ Completed Setup Steps

### 1. Environment Configuration
- **File Created**: `.env` (in root directory)
- **Status**: ✅ Ready with default configurations
- **Variables Configured**:
  - Database: PostgreSQL 17 on port 5432
  - Backend: Node.js Express on ports 5000 & 5001
  - Frontend: React on port 3000
  - All services use internal Docker network: `eparking_network`

### 2. Docker Build Status
- **Backend Service**: Multi-stage build in progress
  - Stage 1: Node.js 22 Alpine dependencies
  - Stage 2: Python 3.11 + ML libraries (torch, torchvision, opencv-headless, ultralytics)
  - Stage 3: Combined Node.js + Python image
  - Includes Prisma client generation and database entrypoint script
  
- **Frontend Service**: React build in progress
  - Build stage: npm install and React build
  - Nginx stage: Production-ready with custom nginx.conf
  - Build-time arguments for API URL configuration
  
- **Database**: PostgreSQL 17 Alpine
  - Automatic healthcheck (pg_isready)
  - Data persistence with named volume `eparking_pg_data`

### 3. Database Setup (Automatic)
The docker-entrypoint.sh script will automatically:
1. Wait for PostgreSQL to be healthy
2. Generate Prisma client
3. Run migrations: `prisma db push`
4. Seed database: `prisma db seed`

### 4. Services & Ports
```
✓ postgres:5432        - PostgreSQL database
✓ backend:5000         - Node.js Express API
✓ backend:5001         - WebSocket ML detector service
✓ frontend:3000        - React application (Nginx)
```

### 5. Volumes & Networks
```
Networks:
  - eparking_network (bridge)

Volumes:
  - eparking_pg_data     (PostgreSQL data)
  - eparking_detected_plates (ML detection output)
```

## 🚀 Docker Commands Reference

### Build All Images
```bash
docker-compose build
```

### Start All Services
```bash
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Check Service Status
```bash
docker-compose ps
```

### Stop Services
```bash
docker-compose down
```

### Complete Reset (remove volumes)
```bash
docker-compose down -v
```

## ✅ Configuration Files

### .env File Location
```
d:/eParking/.env
```

### Key Settings in .env
```
NODE_ENV=production
BACKEND_PORT=5000
FRONTEND_PORT=3000
DB_USER=eparking_user
DB_PASSWORD=eparking_password_2024
DB_DATABASE_NAME=eParking_db
GEMINI_API_KEY=your_gemini_api_key_here
```

### To Update Environment
Edit `.env` and restart services:
```bash
docker-compose restart backend frontend
```

## 📊 Service Health Checks

All services have built-in healthchecks:
- PostgreSQL: `pg_isready` command
- Backend: HTTP GET `/api/health`
- Frontend: Nginx automatic availability

## 🔐 Security Notes

1. `.env` file is **NOT tracked in Git** (.gitignore configured)
2. Database credentials use strong passwords
3. Non-root users in containers (frontend runs as `frontend` user)
4. ML service isolated on dedicated WebSocket port 5001

## 📝 Next Steps After Docker Starts

1. **Verify services are healthy**:
   ```bash
   docker-compose ps
   # All containers should show "healthy" status
   ```

2. **Test API health**:
   ```bash
   curl http://localhost:5000/api/health
   # Expected: {"ok": true, "ts": "..."}
   ```

3. **Access applications**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Prisma Studio: `docker-compose exec backend npx prisma studio`

4. **View database**:
   ```bash
   docker-compose exec postgres psql -U eparking_user -d eParking_db
   ```

## 🐛 Troubleshooting

### Build Takes Too Long
- ML dependencies (torch, opencv) are large (~500MB combined)
- Expected build time: 15-25 minutes
- This is normal - be patient!

### Database Connection Fails
```bash
# Check database logs
docker-compose logs postgres

# Verify network
docker network ls | grep eparking
```

### Backend Startup Issues
```bash
# Check backend logs
docker-compose logs backend

# Verify Prisma generation
docker-compose exec backend npx prisma generate
```

### ML Service Not Starting
- Ensure Python 3.11 environment is ready
- Check GPU availability (if using GPU)
- Review websocket_detector.py logs

## 📋 Build Time Estimates

```
PostgreSQL (Alpine):           ~2 minutes
Frontend (Node + Nginx):      ~5-7 minutes
Backend (Node + Python + ML): ~20-25 minutes
  - System dependencies:       ~5 min
  - Node dependencies:         ~3 min
  - Python ML libraries:       ~15-20 min (torch, opencv)
  - Prisma generation:         ~2 min

Total estimated time: 30-40 minutes
```

## 🔄 Git Integration

### Repository Status
```
Branch: main
Remote: origin/main (https://github.com/ThaiTaka/eparking.git)
Status: Ready for development
.env: Ignored by Git ✓
```

### Push to GitHub
All configuration files are ready. The repository is clean and tracked:
```bash
git status
# On branch main
# Your branch is up to date with 'origin/main'
# nothing to commit, working tree clean
```

---

**Setup Status**: 🟡 In Progress (Docker build running)
**Last Updated**: 2026-06-11
