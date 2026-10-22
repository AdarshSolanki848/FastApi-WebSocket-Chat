import os

import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

BUCKET_NAME = "chat-app-images"

storage = boto3.client(
    "s3",
    endpoint_url=os.environ["AWS_ENDPOINT_URL_S3"],
    aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    region_name=os.environ["AWS_REGION"],
    config=Config(
        signature_version="s3v4",
        s3={"addressing_style": "path"},
    ),
)