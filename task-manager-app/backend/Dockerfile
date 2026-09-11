FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["sh", "-c", "python -c 'import threading, worker; threading.Thread(target=worker.run_worker_loop, daemon=True).start()' & uvicorn main:app --host 0.0.0.0 --port $PORT"]
