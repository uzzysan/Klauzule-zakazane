import secrets
import base64

def generate_secrets():
    print("=== Generated Secrets ===")
    print("# Copy these values into your .env.production file")
    print(f"SECRET_KEY={secrets.token_urlsafe(32)}")
    print(f"JWT_SECRET_KEY={secrets.token_urlsafe(32)}")
    print(f"POSTGRES_PASSWORD={secrets.token_urlsafe(16)}")
    print(f"REDIS_PASSWORD={secrets.token_urlsafe(16)}")
    print(f"MINIO_ACCESS_KEY={secrets.token_urlsafe(12)}")
    print(f"MINIO_SECRET_KEY={secrets.token_urlsafe(24)}")
    print(f"MASTER_KEY={base64.b64encode(secrets.token_bytes(32)).decode()}")
    print(f"ENCRYPTION_SALT={base64.b64encode(secrets.token_bytes(16)).decode()}")
    print("\n=== End of Secrets ===")

if __name__ == "__main__":
    generate_secrets()
