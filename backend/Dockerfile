# Use an official Python runtime as the base image
FROM python:3.11-slim

# Prevents Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
# Prevents Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (including gunicorn and whitenoise)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy the application code
COPY . .

# Collect static files (whitenoise serves them)
RUN python manage.py collectstatic --noinput || true

# Run database migrations and start Gunicorn
CMD ["sh", "-c", "python manage.py migrate && gunicorn backend_project.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"]
