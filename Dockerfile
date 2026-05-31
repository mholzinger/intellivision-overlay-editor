FROM python:3.11-slim

# Install system dependencies for CairoSVG and font rendering
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    fontconfig \
    fonts-liberation \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Create font directories
RUN mkdir -p /usr/share/fonts/truetype/custom /usr/share/fonts/opentype/custom

# Copy custom fonts from sf_intellivised folder
COPY sf_intellivised/ /tmp/fonts/

# Install fonts (gracefully handle if no fonts exist)
RUN find /tmp/fonts -name "*.ttf" -exec cp {} /usr/share/fonts/truetype/custom/ \; || true && \
    find /tmp/fonts -name "*.otf" -exec cp {} /usr/share/fonts/opentype/custom/ \; || true && \
    rm -rf /tmp/fonts

# Refresh font cache to make fonts available to CairoSVG
RUN fc-cache -f -v

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY overlay_editor_app.py .
COPY config.py .
COPY intellivision_overlay_RECTANGULAR.svg .
COPY templates/ templates/
COPY svg-templates/ svg-templates/
COPY layout-templates/ layout-templates/
COPY boxart-templates/ boxart-templates/
COPY static/ static/
COPY sf_intellivised/ sf_intellivised/

# ── Music Studio: WASM playback toolchain (optional) ────────────────────────
# Uncomment the block below to enable bit-perfect MUSIC playback. Requires
# Linux x86_64 builds of intybasic + as1600 in vendor/intellivision-toolchain/
# in the repo. See docs/wasm-playback.md for setup details.
#
# COPY vendor/intellivision-toolchain/intybasic              /usr/local/bin/intybasic
# COPY vendor/intellivision-toolchain/as1600                 /usr/local/bin/as1600
# COPY vendor/intellivision-toolchain/intybasic_prologue.asm /usr/local/share/intybasic/intybasic_prologue.asm
# COPY vendor/intellivision-toolchain/intybasic_epilogue.asm /usr/local/share/intybasic/intybasic_epilogue.asm
# RUN chmod +x /usr/local/bin/intybasic /usr/local/bin/as1600
# ENV OVL_INTYBASIC_LIBRARY_PATH=/usr/local/share/intybasic

# ── Music Studio: MIDI Import ───────────────────────────────────────────────
# Enables the 📥 MIDI button in the Music Studio toolbar. The vendored Linux
# binary lives in vendor/inty-midi/ (Patrick Pelletier's MIDI → IntyBASIC
# MUSIC converter, BSD-3-Clause — see vendor/inty-midi/LICENSES.txt). The
# binary needs libgmp10 at runtime.
RUN apt-get update && apt-get install -y libgmp10 && rm -rf /var/lib/apt/lists/*
COPY vendor/inty-midi/inty-midi /usr/local/bin/inty-midi
RUN chmod +x /usr/local/bin/inty-midi

# Create directory for logs
RUN mkdir -p /app/logs

# Expose Flask port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=overlay_editor_app.py
ENV PYTHONUNBUFFERED=1

# Git version info (passed at build time)
ARG GIT_COMMIT_HASH=""
ARG GIT_COMMIT_DATE=""
ENV GIT_COMMIT_HASH=${GIT_COMMIT_HASH}
ENV GIT_COMMIT_DATE=${GIT_COMMIT_DATE}

# Run the Flask app
CMD ["python", "overlay_editor_app.py"]
