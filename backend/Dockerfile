# 1. Use a lightweight Python base image
FROM python:3.10-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Install essential system dependencies required by OpenCV (used by YOLOv12)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy requirements file first to leverage Docker layer caching
COPY requirements.txt .

# 5. The Magic Trick: Install CPU-only PyTorch to save massive space
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 6. Install the rest of your application dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 7. Copy your application code and the YOLO best.pt model into the container
COPY . .

# 8. Hugging Face Spaces routes web traffic strictly through port 7860
EXPOSE 7860

# 9. Start the FastAPI server on the required port
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]