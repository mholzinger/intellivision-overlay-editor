#!/bin/bash
set -e

echo "🐳 Testing Intellivision Overlay Editor in Docker (CLEAN, NO CACHE)"
echo "=================================================================="
echo ""

# Capture git info for version display
export GIT_COMMIT_HASH=$(git rev-parse --short=7 HEAD 2>/dev/null || echo "")
export GIT_COMMIT_DATE=$(git log -1 --format=%cd --date=short 2>/dev/null || echo "")

if [ -n "$GIT_COMMIT_HASH" ]; then
    echo "📌 Version: $GIT_COMMIT_HASH (${GIT_COMMIT_DATE})"
    echo ""
fi

echo "🧹 Tearing down existing containers, networks, and volumes..."
docker-compose down --volumes --remove-orphans

echo ""
echo "🗑️  Pruning dangling images (optional but recommended)..."
docker image prune -f

echo ""
echo "📦 Building Docker image (NO CACHE)..."
docker-compose build --no-cache --pull

echo ""
echo "🚀 Starting container (fresh)..."
docker-compose up -d --force-recreate

echo ""
echo "⏳ Waiting for application to start (10 seconds)..."
sleep 10

echo ""
echo "🧪 Testing endpoints..."
echo ""

# Helper function
check_200 () {
    if curl -s -o /dev/null -w "%{http_code}" "$1" | grep -q "200"; then
        echo "✅ $2: OK"
    else
        echo "❌ $2: FAILED"
    fi
}

check_200 "http://localhost:5000/" "Main page"
check_200 "http://localhost:5000/static/css/theme.css" "CSS (theme.css)"
check_200 "http://localhost:5000/static/css/main.css" "CSS (main.css)"
check_200 "http://localhost:5000/static/css/components.css" "CSS (components.css)"
check_200 "http://localhost:5000/static/js/overlay_editor.js" "JS (overlay_editor.js)"
check_200 "http://localhost:5000/static/js/services/api.js" "JS (api.js)"
check_200 "http://localhost:5000/static/js/services/stateManager.js" "JS (stateManager.js)"
check_200 "http://localhost:5000/get_template" "API (get_template)"
check_200 "http://localhost:5000/fonts/list" "API (fonts/list)"

echo ""
echo "=================================================================="
echo "🎉 Testing complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Open browser: http://localhost:5000"
echo "   2. Test the UI manually"
echo "   3. View logs: docker-compose logs -f"
echo "   4. Stop container: docker-compose down"
echo ""
echo "📚 For detailed testing, see DOCKER_TESTING.md"
echo "=================================================================="
