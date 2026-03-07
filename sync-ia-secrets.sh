#!/bin/bash
# Reads Archive.org credentials from the local ia.ini config and pushes them
# to Fly.io as secrets for this project.

set -e

IA_CONFIG="${HOME}/.config/internetarchive/ia.ini"

if [ ! -f "$IA_CONFIG" ]; then
    echo "Error: ia.ini not found at $IA_CONFIG"
    echo "Run 'ia configure' first."
    exit 1
fi

# Extract values using Python's RawConfigParser (avoids % interpolation errors)
read -r ACCESS SECRET USER SIG <<< $(python3 - <<'EOF'
import configparser, sys
c = configparser.RawConfigParser()
c.read(f"{__import__('os').environ['HOME']}/.config/internetarchive/ia.ini")
print(
    c.get('s3',      'access'),
    c.get('s3',      'secret'),
    c.get('cookies', 'logged-in-user'),
    c.get('cookies', 'logged-in-sig'),
    sep='\t'
)
EOF
)

if [ -z "$ACCESS" ] || [ -z "$SECRET" ]; then
    echo "Error: Could not read S3 credentials from ia.ini"
    exit 1
fi

echo "Setting Fly.io secrets from ia.ini..."
fly secrets set \
    OVL_IA_ACCESS_KEY="$ACCESS" \
    OVL_IA_SECRET_KEY="$SECRET" \
    OVL_IA_LOGGED_IN_USER="$USER" \
    OVL_IA_LOGGED_IN_SIG="$SIG"

echo "Done."
