FROM python:3.12-slim
WORKDIR /service
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY pronunciation.py .
ENV HOST=0.0.0.0 PORT=8001
EXPOSE 8001
CMD ["python", "pronunciation.py"]
