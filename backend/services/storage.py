"""File storage service using MinIO (S3-compatible)."""
import hashlib
import secrets
from datetime import datetime, timedelta
from pathlib import Path
from typing import BinaryIO, Optional

from minio import Minio
from minio.commonconfig import Filter
from minio.error import S3Error
from minio.lifecycleconfig import Expiration, LifecycleConfig, Rule

from config import settings


class StorageService:
    """Service for managing file storage with MinIO."""

    def __init__(self) -> None:
        """Initialize MinIO client."""
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key.get_secret_value(),
            secure=settings.minio_secure,
        )
        self.bucket_name = settings.minio_bucket_name
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        """Ensure bucket exists, create if not."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)

                # Set lifecycle policy for guest uploads
                lifecycle_config = LifecycleConfig(
                    [
                        Rule(
                            "Enabled",
                            rule_filter=Filter(prefix="guest/"),
                            rule_id="DeleteGuestUploadsAfter24h",
                            expiration=Expiration(days=1),
                        )
                    ]
                )
                self.client.set_bucket_lifecycle(self.bucket_name, lifecycle_config)
        except S3Error as e:
            print(f"Error ensuring bucket: {e}")

    def generate_secure_filename(
        self, original_filename: str, user_id: Optional[str] = None
    ) -> str:
        """Generate unpredictable filename to prevent enumeration."""
        # Random part for security
        random_part = secrets.token_urlsafe(16)

        # Namespace for organization
        if user_id:
            namespace = hashlib.sha256(
                f"{user_id}{int(datetime.utcnow().timestamp())}".encode()
            ).hexdigest()[:8]
        else:
            namespace = "guest"

        # Preserve extension
        extension = Path(original_filename).suffix.lower()

        return f"{namespace}/{random_part}{extension}"

    def upload_file(
        self,
        file_data: BinaryIO,
        original_filename: str,
        content_type: str,
        user_id: Optional[str] = None,
    ) -> tuple[str, str, int]:
        """
        Upload file to MinIO.

        Returns:
            Tuple of (object_name, checksum, file_size)
        """
        # Generate secure object name
        object_name = self.generate_secure_filename(original_filename, user_id)

        # Read file data
        file_data.seek(0)
        file_content = file_data.read()
        file_size = len(file_content)

        # Calculate checksum
        checksum = hashlib.sha256(file_content).hexdigest()

        # Upload to MinIO
        from io import BytesIO

        self.client.put_object(
            bucket_name=self.bucket_name,
            object_name=object_name,
            data=BytesIO(file_content),
            length=file_size,
            content_type=content_type,
            metadata={
                "original-filename": original_filename,
                "sha256": checksum,
                "uploaded-at": datetime.utcnow().isoformat(),
            },
        )

        return object_name, checksum, file_size

    def get_file_url(self, object_name: str, expires_in_hours: int = 24) -> str:
        """Generate presigned URL for file access."""
        try:
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                expires=timedelta(hours=expires_in_hours),
            )
            return url
        except S3Error as e:
            raise ValueError(f"Error generating URL: {e}")

    def download_file(self, object_name: str) -> bytes:
        """Download file from MinIO."""
        try:
            response = self.client.get_object(self.bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            raise ValueError(f"Error downloading file: {e}")

    def delete_file(self, object_name: str) -> None:
        """Delete file from MinIO."""
        try:
            self.client.remove_object(self.bucket_name, object_name)
        except S3Error as e:
            print(f"Error deleting file: {e}")

    def validate_file_integrity(self, object_name: str, expected_checksum: str) -> bool:
        """Verify file integrity using checksum."""
        file_data = self.download_file(object_name)
        actual_checksum = hashlib.sha256(file_data).hexdigest()
        return actual_checksum == expected_checksum


# Singleton instance
storage_service = StorageService()
