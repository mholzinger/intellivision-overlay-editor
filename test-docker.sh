#!/bin/bash

echo "🐳 Testing Intellivision Overlay Editor in Docker"
echo "=================================================="
echo ""

# Capture git info for version display
export GIT_COMMIT_HASH=$(git rev-parse --short=7 HEAD 2>/dev/null || echo "")
export GIT_COMMIT_DATE=$(git log -1 --format=%cd --date=short 2>/dev/null || echo "")

if [ -n "$GIT_COMMIT_HASH" ]; then
    echo "📌 Version: $GIT_COMMIT_HASH (${GIT_COMMIT_DATE})"
    echo ""
fi

echo "📦 Building Docker image..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🚀 Starting container..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container!"
    exit 1
fi

echo ""
echo "⏳ Waiting for application to start (10 seconds)..."
sleep 10

echo ""
echo "🧪 Testing endpoints..."
echo ""

# Test main page
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/ | grep -q "200"; then
    echo "✅ Main page: OK"
else
    echo "❌ Main page: FAILED"
fi

# Test CSS files
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/static/css/theme.css | grep -q "200"; then
    echo "✅ CSS (theme.css): OK"
else
    echo "❌ CSS (theme.css): FAILED"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/static/css/main.css | grep -q "200"; then
    echo "✅ CSS (main.css): OK"
else
    echo "❌ CSS (main.css): FAILED"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/static/css/components.css | grep -q "200"; then
    echo "✅ CSS (components.css): OK"
else
    echo "❌ CSS (components.css): FAILED"
fi

# Test JavaScript files
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/static/js/overlay_editor.js | grep -q "200"; then
    echo "✅ JavaScript (overlay_editor.js): OK"
else
    echo "❌ JavaScript (overlay_editor.js): FAILED"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/static/js/services/api.js | grep -q "200"; then
    echo "✅ JavaScript (api.js): OK"
else
    echo "❌ JavaScript (api.js): FAILED"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/static/js/services/stateManager.js | grep -q "200"; then
    echo "✅ JavaScript (stateManager.js): OK"
else
    echo "❌ JavaScript (stateManager.js): FAILED"
fi

# Test API endpoints
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/get_template | grep -q "200"; then
    echo "✅ API (get_template): OK"
else
    echo "❌ API (get_template): FAILED"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/fonts/list | grep -q "200"; then
    echo "✅ API (fonts/list): OK"
else
    echo "❌ API (fonts/list): FAILED"
fi

echo ""
echo "=================================================="
echo "🎉 Testing complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Open browser: http://localhost:5000"
echo "   2. Test the UI manually"
echo "   3. View logs: docker-compose logs -f"
echo "   4. Stop container: docker-compose down"
echo ""
echo "📚 For detailed testing, see DOCKER_TESTING.md"
echo "=================================================="
