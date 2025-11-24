"""
MinIO Storage Client
===================

S3-compatible object storage for generated documents and reports.
"""

import logging
from datetime import timedelta
from io import BytesIO
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin
from uuid import uuid4

from minio import Minio
from minio.error import S3Error

from backend.config import Config

logger = logging.getLogger(__name__)


class MinIOClient:
    """
    MinIO storage client for file operations.

    Handles upload, download, and URL generation for generated documents.
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        secure: Optional[bool] = None,
    ):
        """
        Initialize MinIO client.

        Args:
            endpoint: MinIO endpoint (default: from config)
            access_key: MinIO access key (default: from config)
            secret_key: MinIO secret key (default: from config)
            secure: Use HTTPS (default: from config)
        """
        self.endpoint = endpoint or Config.MINIO_ENDPOINT
        self.access_key = access_key or Config.MINIO_ACCESS_KEY
        self.secret_key = secret_key or Config.MINIO_SECRET_KEY
        self.secure = secure if secure is not None else Config.MINIO_SECURE

        self.client = Minio(
            endpoint=self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure,
        )

        logger.info(f"MinIO client initialized: {self.endpoint} (secure={self.secure})")

    def ensure_bucket(self, bucket_name: str) -> None:
        """
        Ensure bucket exists, create if not.

        Args:
            bucket_name: Bucket name to create/verify
        """
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                logger.info(f"Created bucket: {bucket_name}")
            else:
                logger.debug(f"Bucket exists: {bucket_name}")
        except S3Error as e:
            logger.error(f"Failed to ensure bucket {bucket_name}: {e}")
            raise

    def upload_file(
        self,
        file_path: str,
        bucket_name: Optional[str] = None,
        object_name: Optional[str] = None,
        content_type: str = "application/octet-stream",
    ) -> str:
        """
        Upload file to MinIO.

        Args:
            file_path: Local file path to upload
            bucket_name: Target bucket (default: cert-documents)
            object_name: Object name in bucket (default: generated UUID)
            content_type: MIME type of file

        Returns:
            Object name (key) in MinIO

        Example:
            >>> client = MinIOClient()
            >>> object_name = client.upload_file("/tmp/report.pdf")
            >>> print(f"Uploaded: {object_name}")
        """
        bucket = bucket_name or Config.MINIO_BUCKET
        self.ensure_bucket(bucket)

        # Generate object name if not provided
        if not object_name:
            extension = Path(file_path).suffix
            object_name = f"{uuid4()}{extension}"

        try:
            self.client.fput_object(
                bucket_name=bucket,
                object_name=object_name,
                file_path=file_path,
                content_type=content_type,
            )
            logger.info(f"Uploaded {file_path} → {bucket}/{object_name}")
            return object_name

        except S3Error as e:
            logger.error(f"Upload failed: {e}")
            raise

    def upload_bytes(
        self,
        data: bytes,
        bucket_name: Optional[str] = None,
        object_name: Optional[str] = None,
        content_type: str = "application/octet-stream",
    ) -> str:
        """
        Upload bytes data to MinIO.

        Args:
            data: Binary data to upload
            bucket_name: Target bucket (default: cert-documents)
            object_name: Object name in bucket (default: generated UUID)
            content_type: MIME type

        Returns:
            Object name in MinIO
        """
        bucket = bucket_name or Config.MINIO_BUCKET
        self.ensure_bucket(bucket)

        if not object_name:
            object_name = str(uuid4())

        try:
            data_stream = BytesIO(data)
            self.client.put_object(
                bucket_name=bucket,
                object_name=object_name,
                data=data_stream,
                length=len(data),
                content_type=content_type,
            )
            logger.info(f"Uploaded {len(data)} bytes → {bucket}/{object_name}")
            return object_name

        except S3Error as e:
            logger.error(f"Upload failed: {e}")
            raise

    def get_file_url(
        self, object_name: str, bucket_name: Optional[str] = None, expires: int = 3600
    ) -> str:
        """
        Get presigned URL for file download.

        Args:
            object_name: Object name in bucket
            bucket_name: Bucket name (default: cert-documents)
            expires: URL expiration in seconds (default: 1 hour)

        Returns:
            Presigned download URL
        """
        bucket = bucket_name or Config.MINIO_BUCKET

        try:
            url = self.client.presigned_get_object(
                bucket_name=bucket, object_name=object_name, expires=timedelta(seconds=expires)
            )
            logger.debug(f"Generated presigned URL for {bucket}/{object_name}")
            return url

        except S3Error as e:
            logger.error(f"Failed to generate URL: {e}")
            raise

    def get_public_url(self, object_name: str, bucket_name: Optional[str] = None) -> str:
        """
        Get public URL for file (if bucket has public read policy).

        Args:
            object_name: Object name in bucket
            bucket_name: Bucket name (default: cert-documents)

        Returns:
            Public download URL

        Note:
            This only works if the bucket has a public read policy.
            For private buckets, use get_file_url() for presigned URLs.
        """
        bucket = bucket_name or Config.MINIO_BUCKET
        protocol = "https" if self.secure else "http"
        base_url = f"{protocol}://{self.endpoint}"
        public_url = f"{base_url}/{bucket}/{object_name}"
        logger.debug(f"Generated public URL: {public_url}")
        return public_url

    def delete_file(self, object_name: str, bucket_name: Optional[str] = None) -> None:
        """
        Delete file from MinIO.

        Args:
            object_name: Object name to delete
            bucket_name: Bucket name (default: cert-documents)
        """
        bucket = bucket_name or Config.MINIO_BUCKET

        try:
            self.client.remove_object(bucket_name=bucket, object_name=object_name)
            logger.info(f"Deleted {bucket}/{object_name}")

        except S3Error as e:
            logger.error(f"Delete failed: {e}")
            raise

    def file_exists(self, object_name: str, bucket_name: Optional[str] = None) -> bool:
        """
        Check if file exists in MinIO.

        Args:
            object_name: Object name to check
            bucket_name: Bucket name (default: cert-documents)

        Returns:
            True if file exists, False otherwise
        """
        bucket = bucket_name or Config.MINIO_BUCKET

        try:
            self.client.stat_object(bucket_name=bucket, object_name=object_name)
            return True
        except S3Error:
            return False


# Global MinIO client instance
_minio_client: Optional[MinIOClient] = None


def get_minio_client() -> MinIOClient:
    """Get or create global MinIO client instance."""
    global _minio_client
    if _minio_client is None:
        _minio_client = MinIOClient()
    return _minio_client
