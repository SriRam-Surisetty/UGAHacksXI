"""Gunicorn configuration for DigitalOcean App Platform."""

import os

bind = f"0.0.0.0:{os.getenv('PORT', '8080')}"
workers = int(os.getenv("GUNICORN_WORKERS", "2"))
threads = 2
timeout = 120
accesslog = "-"
errorlog = "-"
loglevel = "info"
