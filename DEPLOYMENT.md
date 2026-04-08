# Docker & Deployment Guide

## Quick Start mit Docker Compose

### Voraussetzungen
- Docker und Docker Compose installiert
- GitHub Secrets konfiguriert (für CI/CD)
- Discord Bot Token und OAuth Credentials

### 1. Umgebungsvariablen einrichten

```bash
# Kopiere die Example-Datei
cp .env.example .env.production

# Bearbeite die Werte (nutze einen Editor oder nano/vim)
nano .env.production
```

Wichtige Werte, die du setzen musst:
- `DISCORD_CLIENT_ID` - von Discord Developer Portal
- `DISCORD_CLIENT_SECRET` - von Discord Developer Portal
- `DISCORD_BOT_TOKEN` - dein Bot Token
- `DISCORD_ADMIN_ID` - deine Discord User ID
- `DISCORD_GUILD_ID` - Server ID
- `JWT_SECRET` - generieren mit: `openssl rand -base64 32`
- `JWT_REFRESH_SECRET` - generieren mit: `openssl rand -base64 32`

### 2. Docker Images builden und starten

```bash
# Option A: Direkt von den Dockerfiles builden (lokal)
docker-compose build
docker-compose up -d

# Option B: Mit Pre-built Images (nach GitHub Actions)
docker-compose --env-file .env.production up -d
```

### 3. Datenbank migrieren (erste Verwendung)

```bash
# Im Container die Prisma Migrationen ausführen
docker exec sophrox-poll-backend npx prisma migrate deploy
```

### 4. Logs anschauen

```bash
# Alle Services
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend
```

---

## GitHub Actions CI/CD Pipeline

### Setup

1. **Push den Code auf GitHub main Branch**

2. **GitHub Secrets konfigurieren** (für GHCR automatisches Pushen):
   - Keine zusätzlichen Secrets nötig - nutzt GITHUB_TOKEN

3. **Workflow wird automatisch getriggert** bei:
   - Push zu `main`
   - Changes in: `backend/`, `sophrox-polls/`, `Dockerfile.*`, `.github/workflows/`

### Was der Workflow macht

✅ Backend Docker Image bauen  
✅ Frontend Docker Image bauen  
✅ Zu GitHub Container Registry (ghcr.io) pushen  
✅ Automatisches Caching für schnellere Builds  

### Images in Production verwenden

Nach erfolgreichem Build sind die Images unter:
- `ghcr.io/your-username/sophrox-poll/backend:latest`
- `ghcr.io/your-username/sophrox-poll/frontend:latest`

---

## Production Setup auf Server

### 1. Server vorbereiten

```bash
# SSH auf deinen Server
ssh user@your-server.com

# Docker installieren (falls nicht vorhanden)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose installieren
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Projekt klonen und konfigurieren

```bash
# Projekt klonen
git clone https://github.com/your-username/sophrox-poll.git
cd sophrox-poll

# Umgebungsdatei erstellen
cp .env.example .env.production
nano .env.production  # Alle Werte setzen

# Sichere Secrets generieren
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env.production
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" >> .env.production
```

### 3. Container starten

```bash
# Login zu GitHub Container Registry (falls privates Repo)
docker login ghcr.io -u USERNAME -p TOKEN

# Starte die Services
docker-compose --env-file .env.production up -d

# Migriere Datenbank
docker exec sophrox-poll-backend npx prisma migrate deploy

# Schaue die Logs
docker-compose logs -f
```

### 4. Reverse Proxy (Optional - für HTTPS)

Mit Nginx:
```nginx
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## CORS & Security Notes

### Backend CORS
- **Nur** `CORS_ORIGIN` Wert wird akzeptiert
- Alle anderen Origins werden blockiert
- Credentials werden mit included
- Perfekt für Single-Domain Setup

### Discord OAuth Flow
```
Frontend (user clicks login)
  ↓
Redirects to Discord login
  ↓
Discord redirects back to Backend callback
  ↓
Backend creates JWT tokens
  ↓
Redirects back to Frontend with tokens
  ↓
Frontend stores tokens in localStorage
```

### Keine externen API Calls
- Backend macht **keine** externen API Calls (außer Discord OAuth)
- Alle Daten sind lokal oder in der Datenbank
- Perfekt für firmeninterne Nutzung

---

## Troubleshooting

### "Failed to connect to backend"
- Stelle sicher, dass `CORS_ORIGIN` richtig gesetzt ist
- Backend muss auf Port 3000 erreichbar sein
- Logs checken: `docker-compose logs backend`

### "Discord login doesn't work"
- `DISCORD_REDIRECT_URI` muss exakt mit Discord Developer Portal Match
- `VITE_DISCORD_CLIENT_ID` muss gesetzt sein
- Check Backend Logs für OAuth Fehler

### Container startet nicht
```bash
# Logs detailliert anschauen
docker-compose logs backend

# Container Logs checken
docker ps -a  # Status anschauen
docker logs sophrox-poll-backend
```

### Datenbank Migrations fehlgeschlagen
```bash
# Reset Datenbank (Vorsicht - löscht alle Daten!)
docker exec sophrox-poll-backend npx prisma migrate reset

# Oder: Nur neue Migrationen spielen
docker exec sophrox-poll-backend npx prisma migrate deploy
```

---

## Monitoring & Maintenance

### Container Logs
```bash
# Alle Logs
docker-compose logs -f --tail=50

# Nur Fehler
docker-compose logs -f --tail=50 | grep -i error
```

### Backups
```bash
# Datenbank Backup
docker cp sophrox-poll-backend:/app/prisma/dev.db ./backup/dev.db.backup

# Alle Volumes
docker run --rm -v sophrox-db:/data -v $(pwd):/backup \
  alpine tar czf /backup/db-backup.tar.gz -C /data .
```

### Updates durchspielen
```bash
# Neue Images pullen
docker-compose pull

# Container mit neuen Images starten
docker-compose up -d

# Migrationen ausführen
docker exec sophrox-poll-backend npx prisma migrate deploy

# Alte Images aufräumen
docker image prune
```
