# eParking Docker Quick Reference

## 🚀 Quick Start

### Start All Services
```bash
docker-compose up -d
```

### Stop All Services  
```bash
docker-compose down
```

### Complete Reset (Clean Start)
```bash
docker-compose down -v
docker-compose up -d
```

---

## 📊 Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web UI |
| Backend API | http://localhost:5000/api | REST API |
| Janus REST | http://localhost:8088/janus | Janus Gateway API |
| Janus Proxy | http://localhost:9000/api | RTSP Stream Manager |
| Prisma Studio | http://localhost:5555 | Database UI |
| PostgreSQL | localhost:5432 | Database |

---

## 🎥 RTSP Streaming

### Create a Stream

```bash
curl -X POST http://localhost:9000/api/create-stream \
  -H "Content-Type: application/json" \
  -d '{"rtsp_url": "rtsp://admin:Abc@12345@10.10.40.246:554/live/cam/realmonitor?channel=1&subtype=0"}'
```

**Response:**
```json
{"streamId": 123456}
```

### Access in Frontend

Navigate to the camera view on http://localhost:3000 and the stream will play via WebRTC.

---

## 🔍 Health Checks

```bash
# Backend
curl http://localhost:5000/api/health

# Janus Proxy
curl http://localhost:9000/api/health

# Frontend
curl http://localhost:3000/
```

---

## 📝 View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f janus
docker-compose logs -f janus-proxy
```

---

## 🔧 Troubleshooting

### Services Won't Start
```bash
docker-compose down -v
docker volume prune -f
docker-compose up -d
```

### Check Service Status
```bash
docker-compose ps
```

### Restart Specific Service
```bash
docker-compose restart backend
docker-compose restart frontend
```

---

## 🏗️ Build from Scratch

```bash
# Clean everything
docker-compose down -v
docker system prune -f

# Rebuild (if needed)
docker-compose build

# Start
docker-compose up -d
```

---

## 📁 Important Files

- `docker-compose.yml` - Service orchestration
- `.env` - Environment variables
- `BE/Dockerfile` - Backend container config
- `FE/Dockerfile` - Frontend container config
- `FE/nginx.conf` - Frontend nginx proxy config
- `BE/janus/Dockerfile` - Janus proxy container config

---

## ⚙️ Environment Variables

See [.env](file:///d:/eParking/.env) for all configuration options.

Key variables:
- `DB_USER` / `DB_PASSWORD` - Database credentials
- `GEMINI_API_KEY` - AI chatbot API key
- `REACT_APP_JANUS_URL` - Janus Gateway URL
- `REACT_APP_CAMERA_STREAM_URL` - Janus Proxy URL

---

## 🎯 Production Checklist

- [ ] Update CORS settings
- [ ] Configure SSL/TLS
- [ ] Set strong database passwords
- [ ] Review firewall rules
- [ ] Enable monitoring
- [ ] Set up log aggregation
- [ ] Configure backups
