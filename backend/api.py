from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
import uuid
from sqlalchemy.orm import Session

# Import our custom logic
from .database import SessionLocal, InferenceJob, User
from .storage import upload_image_to_minio
from worker.worker import process_inference_job

app = FastAPI(title="NexusVision API")

# Allow React (localhost:5173) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/process")
async def create_task(
    username: str = Form(...),
    model_name: str = Form("big-lama"),
    image: UploadFile = File(...),
    mask: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Ensure User exists in History
    user = db.query(User).filter(User.username == username).first()
    if not user:
        user = User(username=username)
        db.add(user)
        db.commit()

    # 2. Generate unique IDs for the job and files
    job_id = str(uuid.uuid4())
    img_name = f"{job_id}_raw.png"
    mask_name = f"{job_id}_mask.png"

    # 3. Upload raw files to MinIO
    img_bytes = await image.read()
    mask_bytes = await mask.read()
    upload_image_to_minio(img_bytes, img_name)
    upload_image_to_minio(mask_bytes, mask_name)

# 4. Save Job to Postgres History
    new_job = InferenceJob(
        job_id=job_id,
        user_id=user.id,
        model_name=model_name,
        status="PENDING",
        original_image_name=img_name,
        # Ensure we save the mask name too!
        mask_image_name=mask_name 
    )
    db.add(new_job)
    db.commit()

    # 5. Trigger the Background Worker
    process_inference_job.delay(job_id, img_name, mask_name, model_name)

    return {"job_id": job_id, "status": "PENDING"}

@app.get("/history/{username}")
def get_user_history(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return []
    return user.jobs

from fastapi.responses import Response
from .storage import s3_client, BUCKET_NAME

@app.get("/status/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(InferenceJob).filter(InferenceJob.job_id == job_id).first()
    if not job:
        return {"status": "NOT_FOUND"}
    return {"status": job.status, "result_image_name": job.result_image_name}

@app.get("/result/{job_id}")
def get_result_image(job_id: str, db: Session = Depends(get_db)):
    job = db.query(InferenceJob).filter(InferenceJob.job_id == job_id).first()
    if not job or not job.result_image_name:
        return {"error": "Result not ready"}
    
    # Fetch the actual image bytes from MinIO
    response = s3_client.get_object(Bucket=BUCKET_NAME, Key=job.result_image_name)
    return Response(content=response['Body'].read(), media_type="image/png")
@app.get("/original/{job_id}")
def get_original_image(job_id: str, db: Session = Depends(get_db)):
    job = db.query(InferenceJob).filter(InferenceJob.job_id == job_id).first()
    if not job or not job.original_image_name:
        return {"error": "Original not found"}
    
    response = s3_client.get_object(Bucket=BUCKET_NAME, Key=job.original_image_name)
    return Response(content=response['Body'].read(), media_type="image/png")

@app.get("/mask/{job_id}")
def get_mask_image(job_id: str, db: Session = Depends(get_db)):
    job = db.query(InferenceJob).filter(InferenceJob.job_id == job_id).first()
    if not job or not job.mask_image_name:
        return {"error": "Mask not found"}
    
    response = s3_client.get_object(Bucket=BUCKET_NAME, Key=job.mask_image_name)
    return Response(content=response['Body'].read(), media_type="image/png")