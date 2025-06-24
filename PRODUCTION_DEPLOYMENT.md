# Production Deployment Guide

This guide provides instructions for deploying the Concert Assignment application in a production environment using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on the production server
- Domain name configured with DNS pointing to your server
- SSL certificates (or use Let's Encrypt)
- Sufficient server resources (minimum 4GB RAM, 2 CPUs recommended)

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file and configure it with your production values:

```bash
cp env.prod.example .env.prod
```

Edit `.env.prod` with your production settings:
- Set strong passwords for PostgreSQL and Redis
- Configure JWT secret
- Set your domain name
- Configure API URLs

### 2. SSL Certificates

#### Option A: Using Let's Encrypt (Recommended)

First, create the SSL directory:
```bash
mkdir -p nginx/ssl
```

Generate certificates using certbot:
```bash
docker run -it --rm \
  -v $(pwd)/nginx/ssl:/etc/letsencrypt \
  -v $(pwd)/nginx/conf.d:/etc/nginx/conf.d \
  certbot/certbot certonly \
  --standalone \
  -d your-domain.com \
  -d www.your-domain.com
```

Link the certificates:
```bash
ln -s /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
ln -s /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

#### Option B: Using Your Own Certificates

Place your SSL certificates in the `nginx/ssl` directory:
```bash
cp your-certificate.crt nginx/ssl/cert.pem
cp your-private-key.key nginx/ssl/key.pem
```

### 3. Deploy the Application

#### Option A: With SSL (Production)

Load environment variables:
```bash
export $(cat .env.prod | xargs)
```

Deploy using Make:
```bash
make prod-deploy
```

Or manually:
```bash
docker-compose -f docker-compose.prod.yaml up -d --build
```

#### Option B: Without SSL (Testing/Behind Load Balancer)

If you don't need SSL (e.g., for testing or when SSL is handled by an external load balancer):

```bash
export $(cat .env.prod | xargs)
docker-compose -f docker-compose.prod-no-ssl.yaml up -d --build
```

**Note**: When running without SSL, update your environment variables:
- Change `CORS_ORIGIN` to use `http://` instead of `https://`
- Change `APP_API` to use `http://` instead of `https://`

### 4. Verify Deployment

Check service status:
```bash
make prod-status
```

View logs:
```bash
make prod-logs
```

## Production Commands

### Service Management

```bash
# Start services
make prod-up

# Stop services
make prod-down

# Restart services
make prod-restart

# View logs
make prod-logs

# Check status
make prod-status
```

### Scaling

Scale API instances:
```bash
make prod-scale-api n=3
```

Scale frontend instances:
```bash
make prod-scale-app n=3
```

### Database Management

Backup database:
```bash
make prod-backup
```

Connect to production database:
```bash
docker-compose -f docker-compose.prod.yaml exec postgres psql -U concert_user -d concert_prod
```

### Monitoring

Monitor container resources:
```bash
docker stats
```

Check container health:
```bash
docker-compose -f docker-compose.prod.yaml ps
```

## Security Considerations

1. **Environment Variables**: Never commit `.env.prod` to version control
2. **Firewall**: Only expose ports 80 and 443 to the internet
3. **Updates**: Regularly update base images and dependencies
4. **Backups**: Set up automated database backups
5. **Monitoring**: Implement application and infrastructure monitoring
6. **Secrets**: Use Docker secrets or external secret management for sensitive data

## Performance Optimization

1. **Database**:
   - Configure PostgreSQL for production workloads
   - Set up regular VACUUM and ANALYZE
   - Monitor slow queries

2. **Redis**:
   - Configure maxmemory policies
   - Set up persistence according to your needs
   - Monitor memory usage

3. **Nginx**:
   - Fine-tune worker processes and connections
   - Enable caching for static assets
   - Configure rate limiting

4. **Application**:
   - Enable production optimizations in Next.js
   - Configure appropriate Node.js memory limits
   - Implement health checks

## Troubleshooting

### Services Won't Start
- Check logs: `make prod-logs`
- Verify environment variables are loaded
- Ensure ports are not already in use

### SSL Certificate Issues
- Verify certificate files exist in `nginx/ssl`
- Check certificate permissions
- Ensure domain DNS is properly configured

### Database Connection Issues
- Verify DATABASE_URL in environment
- Check PostgreSQL container health
- Ensure network connectivity between containers

### Performance Issues
- Monitor resource usage: `docker stats`
- Check application logs for errors
- Scale services if needed

## Maintenance

### Regular Tasks
1. Monitor disk space for volumes
2. Rotate logs
3. Update container images
4. Backup database regularly
5. Review security updates

### Updates
```bash
# Pull latest images
docker-compose -f docker-compose.prod.yaml pull

# Rebuild and redeploy
make prod-deploy
```

## Support

For issues specific to the production environment:
1. Check container logs
2. Verify environment configuration
3. Ensure all dependencies are healthy
4. Review Nginx access and error logs 