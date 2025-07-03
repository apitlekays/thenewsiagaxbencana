# Docker Setup for MAPIM Strategic Centre

This document provides instructions for running the MAPIM Strategic Centre application using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### Development Mode

For development with hot reloading:

```bash
# Start development environment
docker-compose --profile dev up

# Or build and start
docker-compose --profile dev up --build
```

The application will be available at `http://localhost:3001`

### Production Mode

For production deployment:

```bash
# Build and start production environment
docker-compose --profile prod up --build

# Run in detached mode
docker-compose --profile prod up -d --build
```

### Production with Nginx Proxy Manager

For production with Nginx Proxy Manager:

```bash
# Start production service (internal only)
docker-compose --profile prod-internal up -d --build

# Or start with exposed port for direct access
docker-compose --profile prod up -d --build
```

Then configure Nginx Proxy Manager to proxy to `app-prod-internal:3000` or `localhost:3001`

## Docker Commands

### Building Images

```bash
# Build production image
docker build -t mapim-strategic-centre:latest .

# Build development image
docker build -f Dockerfile.dev -t mapim-strategic-centre:dev .
```

### Running Containers

```bash
# Run production container
docker run -p 3001:3000 mapim-strategic-centre:latest

# Run development container
docker run -p 3001:3000 -v $(pwd):/app mapim-strategic-centre:dev
```

### Managing Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f app-prod

# Restart a specific service
docker-compose restart app-prod
```

## Port Configuration

The application uses port **3001** externally to avoid conflicts with common services:
- **Port 3000**: Often used by other Node.js/React apps
- **Port 3001**: Less commonly used, reducing conflict risk
- **Internal port**: Always remains 3000 inside the container

To change the external port, modify the `docker-compose.yml`:
```yaml
ports:
  - "YOUR_PORT:3000"  # Change YOUR_PORT to desired external port
```

## Environment Variables

Create a `.env` file in the root directory for environment-specific configurations:

```env
# Database configuration (if needed)
DATABASE_URL=your_database_url

# API keys
NEXT_PUBLIC_API_KEY=your_api_key

# Environment
NODE_ENV=production
```

## Production Deployment

### Using Docker Compose

1. Clone the repository
2. Create `.env` file with production values
3. Run: `docker-compose --profile prod up -d --build`

### Using Portainer

1. **Access Portainer** at your server's Portainer URL

2. **Create a new Stack:**
   - Go to "Stacks" → "Add stack"
   - Name: `mapim-strategic-centre`
   - Build method: "Web editor" or "Upload"

3. **Copy the docker-compose.yml content** into the web editor

4. **Deploy the stack:**
   - Click "Deploy the stack"
   - Portainer will build and start the containers

5. **Access your application:**
   - The app will be available at `http://your-server:3001`
   - You can also access it through Portainer's container logs and console

6. **For Nginx Proxy Manager integration:**
   - Use the `prod-internal` profile to avoid port conflicts
   - Configure NPM to proxy to `mapim-strategic-centre_app-prod-internal:3000`

### Using Nginx Proxy Manager

1. **Start your app without exposed ports:**
   ```bash
   docker-compose --profile prod-internal up -d --build
   ```

2. **Access Nginx Proxy Manager** (typically at `http://your-server:81`)

3. **Add a new Proxy Host:**
   - **Domain Names:** Your domain (e.g., `app.yourdomain.com`)
   - **Scheme:** `http`
   - **Forward Hostname/IP:** `app-prod-internal` (or your container name)
   - **Forward Port:** `3000`
   - **Enable SSL:** Check for HTTPS
   - **Force SSL:** Recommended for production
   - **WebSocket Support:** Enable if needed
   - **Block Common Exploits:** Enable
   - **Client Certificate:** Optional

4. **Advanced Settings (optional):**
   - **Custom Nginx Configuration:**
   ```nginx
   # Add custom headers
   add_header X-Frame-Options "SAMEORIGIN" always;
   add_header X-XSS-Protection "1; mode=block" always;
   add_header X-Content-Type-Options "nosniff" always;
   
   # Gzip compression
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   ```

### Using Docker Swarm

```bash
# Initialize swarm (if not already done)
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml mapim-stack
```

### Using Kubernetes

Create a `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mapim-strategic-centre
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mapim-strategic-centre
  template:
    metadata:
      labels:
        app: mapim-strategic-centre
    spec:
      containers:
      - name: app
        image: mapim-strategic-centre:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: mapim-strategic-centre-service
spec:
  selector:
    app: mapim-strategic-centre
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Performance Optimization

### Multi-stage Build

The production Dockerfile uses multi-stage builds to:
- Reduce final image size
- Separate build dependencies from runtime
- Optimize layer caching

### Nginx Proxy Manager Configuration

When using Nginx Proxy Manager, you can configure:
- SSL certificates and HTTPS
- Custom domains and subdomains
- Gzip compression
- Security headers
- Rate limiting
- Load balancing
- WebSocket support

The web interface makes it easy to manage all these settings without editing configuration files.

### Health Checks

Add health checks to your deployment:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   
   # Kill the process or change port in docker-compose.yml
   ```

2. **Permission issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

3. **Build failures**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

### Logs and Debugging

```bash
# View container logs
docker-compose logs app-prod

# Access container shell
docker-compose exec app-prod sh

# Check container status
docker-compose ps
```

## Security Considerations

1. **Run as non-root user**: The production Dockerfile creates a `nextjs` user
2. **Security headers**: Nginx configuration includes security headers
3. **Rate limiting**: API endpoints are rate-limited
4. **Environment variables**: Sensitive data should be in `.env` files
5. **Image scanning**: Regularly scan images for vulnerabilities

## Monitoring

### Resource Usage

```bash
# Monitor container resources
docker stats

# Check disk usage
docker system df
```

### Application Monitoring

Consider adding monitoring tools like:
- Prometheus + Grafana
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Application Performance Monitoring (APM) tools

## Backup and Recovery

### Data Backup

```bash
# Backup volumes
docker run --rm -v mapim_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v mapim_data:/data -v $(pwd):/backup alpine tar xzf /backup/data-backup.tar.gz -C /data
```

## Support

For issues related to Docker setup, please check:
1. Docker and Docker Compose versions
2. System resources (CPU, memory, disk)
3. Network connectivity
4. Application logs

For application-specific issues, refer to the main README.md file. 