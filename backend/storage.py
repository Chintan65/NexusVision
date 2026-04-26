import boto3
from botocore.exceptions import ClientError
import io

# Connect to our local MinIO Docker container (AWS S3 Clone)
s3_client = boto3.client(
    's3',
    endpoint_url='http://127.0.0.1:9000', 
    aws_access_key_id='minioadmin',
    aws_secret_access_key='minioadmin123',
    region_name='us-east-1'
)

BUCKET_NAME = "lama-images"

def upload_image_to_minio(file_bytes, object_name):
    try:
        s3_client.upload_fileobj(io.BytesIO(file_bytes), BUCKET_NAME, object_name)
        return True
    except ClientError as e:
        print(f"Error uploading to MinIO: {e}")
        return False

def download_image_from_minio(object_name, download_path):
    try:
        s3_client.download_file(BUCKET_NAME, object_name, download_path)
        return True
    except ClientError as e:
        print(f"Error downloading from MinIO: {e}")
        return False