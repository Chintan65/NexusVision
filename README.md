# NexusVision Engine

#### **A Distributed, High-Performance Asynchronous Pipeline for Generative Inpainting.**

NexusVision is a production-grade microservices architecture designed to solve the "blocking-inference" problem in Machine Learning web applications. By decoupling heavy PyTorch computations from the request-response cycle, the system maintains **sub-50ms API responsiveness** while handling compute-intensive 4K image transformations.

## 🚀 Key Engineering Achievements 

* **Asynchronous ML Orchestration:** Engineered an event-driven pipeline using  **FastAPI, Redis, and Celery** , ensuring the web gateway remains non-blocking during long-running GPU tasks.
* **Production-Grade Fault Tolerance:** Implemented **Late Acknowledgments (`acks_late`)** and exponential backoff retry logic to ensure zero task loss during worker crashes or Out-Of-Memory (OOM) events.
* **Scalable Hybrid Storage:** Architected a dual-persistence layer using **MinIO (S3-compatible)** for high-resolution blob storage and **PostgreSQL** for relational metadata, optimizing I/O performance.
* **State-Managed UI/UX:** Developed a custom **React.js + HTML5 Canvas** editor with a persistent polling state machine to deliver real-time AI results seamlessly to the client.

---

## 🏗️ System Architecture & Data Flow

1. **Frontend (React):** Captures user-drawn binary masks on high-res canvases and initiates multipart uploads.
2. **API Gateway (FastAPI):** Validates payloads, generates unique UUIDs for traceability, and delegates tasks to the broker.
3. **Message Broker (Redis):** Manages the distributed task queue and handles inter-process communication.
4. **Inference Worker (Celery/PyTorch):** An isolated compute environment that executes the **FFCResNet (Big-LaMa)** model to mathematically hallucinate missing pixels.
5. **Persistence Layer:** PostgreSQL tracks job states (`PENDING`, `PROCESSING`, `COMPLETED`), while MinIO stores the raw bytes.

---

## 📊 Performance Benchmarks

* **API Latency:** ~42ms (Ingestion to Queue)
* **Worker Throughput:** Scalable horizontally by adding more containerized Celery instances.
* **Memory Management:** Automated garbage collection via `shutil` ensures a zero-footprint worker environment post-inference.

---

## 🧠 Model Weights & Training

This engine is designed to be model-agnostic. To run it locally, you must provide the PyTorch checkpoints:

1. **Standard Weights:** Download the high-resolution `big-lama.pt` checkpoints from the [Official LaMa Repository](https://github.com/saic-mdal/lama).
2. **Custom Training:** Use the provided training scripts in `/worker/bin/train.py` and configurations in `/worker/configs` to train the model on your own dataset (e.g., Places2 or CelebA).
3. **Research Context:** During my research internship at  **ISRO** , this architecture was validated using weights trained on satellite imagery. Due to the sensitive nature of that data, those specific weights are withheld.

---

## 🛠️ Local Boot Sequence

Ensure Docker is running, then execute in separate terminals:

1. **Infrastructure:** `docker compose up -d`
2. **API:** `uvicorn backend.api:app --reload --port 8000`
3. **Worker:** `celery -A worker.worker.celery_app worker --loglevel=info`
4. **Frontend:** `cd frontend && npm run dev`

---

## 📜 Acknowledgements & Licensing

* **Infrastructure:** All backend orchestration, database schema design, and frontend development are original work.
* **ML Engine:** Core inference logic is based on the **LaMa (Large Mask Inpainting)** research by Samsung AI Center (SAIC-MDAL), used under the  **Apache License 2.0** .
