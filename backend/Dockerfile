# 1. Base Image - Python 3.10 stable for YOLO/Torch
FROM python:3.10-slim

# 2. Set Working Directory inside the container
WORKDIR /app

# 3. System dependencies for OpenCV & YOLO
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy requirements file first to leverage Docker layer caching
COPY requirements.txt .

# 5. Install CPU-optimized PyTorch first (Saves ~2GB space)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 6. Install other dependencies & Force Upgrade Ultralytics for YOLOv12 support
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir --upgrade ultralytics

# 7. Copy your application code and the fine-tuned pothole model
COPY backend/app/ ./app/
COPY backend/best.pt .

# 8. Set Environment Variables
ENV PYTHONPATH=/app
ENV PORT=7860
ENV PYTHONUNBUFFERED=1

# 9. Start the FastAPI server on Hugging Face's required port
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]