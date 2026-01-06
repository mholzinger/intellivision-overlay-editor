# Docker Testing Guide

## Quick Start

### 1. Build the Docker Image

```bash
cd /Users/mikeholzinger/src/intellivision-overlay-editor
docker-compose build
```

Or build directly with Docker:

```bash
docker build -t intellivision-overlay-editor .
```

### 2. Run the Container

Using docker-compose (recommended):

```bash
docker-compose up
```

Or run directly with Docker:

```bash
docker run -p 5000:5000 intellivision-overlay-editor
```

### 3. Access the Application

Open your browser and navigate to:

```
http://localhost:5000
```

### 4. Stop the Container

If using docker-compose:

```bash
docker-compose down
```

If using docker run:

```bash
docker ps                    # Find container ID
docker stop <container-id>
```

## Testing Checklist

Once the application is running, verify:

- [ ] Page loads without errors
- [ ] Browser console shows no 404 errors
- [ ] All CSS files load from `/static/css/`
- [ ] All JS files load from `/static/js/`
- [ ] SVG template loads
- [ ] Fonts load correctly
- [ ] Title editing works
- [ ] Button labels work
- [ ] Artwork upload works
- [ ] PNG export works

## Checking Logs

### View container logs:

```bash
# If using docker-compose
docker-compose logs -f

# If using docker run
docker logs -f intellivision-overlay-editor
```

### Check for static file serving:

Look for these requests in the logs:
```
GET /static/css/theme.css
GET /static/css/main.css
GET /static/css/components.css
GET /static/js/overlay_editor.js
GET /static/js/modules/svgManager.js
... etc
```

All should return **200 OK**

## Common Issues & Solutions

### Issue: CSS not loading (404 errors)

**Check:** Verify static directory was copied
```bash
docker exec intellivision-overlay-editor ls -la /app/static
```

**Expected output:**
```
drwxr-xr-x  css/
drwxr-xr-x  js/
```

**Fix:** Rebuild the image if static/ is missing
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Issue: JS modules not loading

**Check:** Browser console for errors

**Common errors:**
- `Failed to load module script` - CORS or wrong path
- `Cannot find module` - Missing `.js` extension in imports

**Fix:** Ensure Flask app serves static files correctly

### Issue: Fonts not loading

**Check:** Font cache in container
```bash
docker exec intellivision-overlay-editor fc-list | grep -i eurostile
```

**Fix:** Rebuild with font cache refresh

### Issue: Port already in use

**Error:** `Bind for 0.0.0.0:5000 failed: port is already allocated`

**Fix:** Use a different port
```bash
# Edit docker-compose.yml
ports:
  - "8080:5000"  # Change 5000 to 8080 (or any available port)
```

Then access at: `http://localhost:8080`

## Inspecting the Container

### Shell into running container:

```bash
docker exec -it intellivision-overlay-editor bash
```

### Verify files are present:

```bash
ls -la /app/
ls -la /app/static/css/
ls -la /app/static/js/
ls -la /app/templates/
```

### Check Flask is serving static files:

```bash
# Inside container
curl http://localhost:5000/static/css/theme.css
```

Should return CSS content.

## Development Mode

For development with live reloading, mount local directories:

Edit `docker-compose.yml`:

```yaml
services:
  overlay-editor:
    build: .
    container_name: intellivision-overlay-editor
    ports:
      - "5000:5000"
    environment:
      - OVL_HOST=0.0.0.0
      - OVL_PORT=5000
      - OVL_DEBUG=1  # Enable debug mode
    volumes:
      # Mount local directories for live changes
      - ./static:/app/static
      - ./templates:/app/templates
      - ./overlay_editor_app.py:/app/overlay_editor_app.py
    restart: unless-stopped
```

Then restart:

```bash
docker-compose down
docker-compose up
```

Now changes to files will reflect immediately (may need browser refresh).

## Testing Network Requests

### From your host machine:

```bash
# Test static files are accessible
curl http://localhost:5000/static/css/theme.css
curl http://localhost:5000/static/js/overlay_editor.js

# Test API endpoints
curl http://localhost:5000/get_template
curl http://localhost:5000/fonts/list
```

### From inside container:

```bash
docker exec intellivision-overlay-editor curl http://localhost:5000/
```

## Browser Developer Tools Check

1. **Open DevTools** (F12)
2. **Network Tab** - Verify all files load:
   ```
   ✓ 200 OK - /
   ✓ 200 OK - /static/css/theme.css
   ✓ 200 OK - /static/css/main.css
   ✓ 200 OK - /static/css/components.css
   ✓ 200 OK - /static/js/overlay_editor.js
   ✓ 200 OK - /static/js/services/api.js
   ✓ 200 OK - /static/js/services/stateManager.js
   ✓ 200 OK - /static/js/modules/svgManager.js
   ... (all other modules)
   ```

3. **Console Tab** - Should see:
   ```
   ✓ Found Eurostile BQ at index X
   ✓ Selected font index: X
   ✓ Template loaded successfully!
   ```

4. **Application Tab** - Check for any storage errors

## Performance Testing

Test with a high-resolution image:

1. Upload large PNG (e.g., 4000x4000px)
2. Verify it loads smoothly
3. Test export with large artwork

## Cleanup

### Remove containers:

```bash
docker-compose down
```

### Remove images:

```bash
docker rmi intellivision-overlay-editor
```

### Remove all (containers, images, volumes):

```bash
docker-compose down -v
docker system prune -a
```

## Production Deployment

For production, consider:

1. **Use multi-stage build** to reduce image size
2. **Add health checks** to docker-compose.yml
3. **Use environment variables** for configuration
4. **Enable HTTPS** with reverse proxy (nginx)
5. **Set up logging** to external service

### Example health check:

```yaml
services:
  overlay-editor:
    build: .
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Troubleshooting Commands

```bash
# View all containers
docker ps -a

# View images
docker images

# Check container resource usage
docker stats intellivision-overlay-editor

# View detailed container info
docker inspect intellivision-overlay-editor

# Restart container
docker restart intellivision-overlay-editor

# Force rebuild
docker-compose build --no-cache
```

## Success Criteria

✅ Container builds without errors
✅ Container starts and runs
✅ Application accessible at http://localhost:5000
✅ All static files load (CSS, JS)
✅ No 404 errors in browser console
✅ Title editing works
✅ Artwork upload works
✅ PNG export works
✅ All features from original work

## Quick Test Script

```bash
#!/bin/bash
echo "Building Docker image..."
docker-compose build

echo "Starting container..."
docker-compose up -d

echo "Waiting for application to start..."
sleep 5

echo "Testing endpoints..."
curl -s http://localhost:5000/ > /dev/null && echo "✓ Main page OK" || echo "✗ Main page FAILED"
curl -s http://localhost:5000/static/css/theme.css > /dev/null && echo "✓ CSS OK" || echo "✗ CSS FAILED"
curl -s http://localhost:5000/static/js/overlay_editor.js > /dev/null && echo "✓ JS OK" || echo "✗ JS FAILED"
curl -s http://localhost:5000/get_template > /dev/null && echo "✓ Template OK" || echo "✗ Template FAILED"

echo "
Application ready at: http://localhost:5000
View logs: docker-compose logs -f
Stop: docker-compose down
"
```

Save as `test-docker.sh`, make executable, and run:

```bash
chmod +x test-docker.sh
./test-docker.sh
```
