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
COPY intellivision_overlay_RECTANGULAR.svg .
COPY templates/ templates/
COPY static/ static/
COPY sf_intellivised/ sf_intellivised/

# Create directory for logs
RUN mkdir -p /app/logs

# Expose Flask port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=overlay_editor_app.py
ENV PYTHONUNBUFFERED=1

# Run the Flask app
CMD ["python", "overlay_editor_app.py"]
