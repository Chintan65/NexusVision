import os
import sys
import subprocess
import glob
import shutil
from celery import Celery

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.database import SessionLocal, InferenceJob
from backend.storage import download_image_from_minio, upload_image_to_minio

celery_app = Celery(
    'nexusvision_worker',
    broker='redis://127.0.0.1:6379/0',
    backend='redis://127.0.0.1:6379/0'
)
@celery_app.task(bind=True, name="process_inference_job", max_retries=3, acks_late=True)
def process_inference_job(self, job_id: str, original_image_name: str, mask_image_name: str, model_name: str):
    d = f"worker/temp_{job_id}"
    s = SessionLocal()
    j = s.query(InferenceJob).filter(InferenceJob.job_id == job_id).first()
    
    if not j:
        print(f"Err: {job_id}")
        return False

    try:
        j.status = "PROCESSING"
        s.commit()

        os.makedirs(d, exist_ok=True)
        
        download_image_from_minio(original_image_name, f"{d}/image.png")
        download_image_from_minio(mask_image_name, f"{d}/image_mask.png")

        c = [
            "python3", "worker/bin/predict.py",
            f"model.path={os.getcwd()}/worker/big-lama", 
            f"indir={os.path.abspath(d)}",
            f"outdir={os.path.abspath(d)}/output",
            "dataset.img_suffix=.png"
        ]
        
        print(f"[Job {job_id}] Booting PyTorch Engine...")
        
        r = subprocess.run(c)
        
        if r.returncode != 0:
            raise Exception("LaMA crashed!")

        f = glob.glob(f"{d}/output/*.png")
        if not f:
             raise Exception("No file")
             
        p = f[0] 
        n = f"result_{job_id}.png"
        
        with open(p, 'rb') as x:
            u = upload_image_to_minio(x.read(), n)
            
        if not u:
             raise Exception("Upload fail")

        j.result_image_name = n
        j.status = "COMPLETED"
        s.commit()
        print(f"SUCCESS: {n}")
        return True

    except Exception as e:
        print(f"FAILED: {str(e)}. Retrying...")
        try:

            self.retry(exc=e, countdown=2 ** self.request.retries)
        except self.MaxRetriesExceededError:
            j.status = "FAILED"
            s.commit()
            return False
    finally:
        s.close()
        shutil.rmtree(d, ignore_errors=True)