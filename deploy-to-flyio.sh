# Deploy to fly.io

fly deploy \
  --no-cache \
  --build-arg GIT_COMMIT_HASH=$(git rev-parse --short=7 HEAD) \
  --build-arg GIT_COMMIT_DATE=$(git log -1 --format=%cd --date=short)

