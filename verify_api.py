import os
import time

import requests

BASE_URL = "http://localhost:8000"
TEST_FILES_DIR = "/home/uzzy/Kodzenie/Klauzule zakazane/dane_testowe"
FILES = ["draft umowy.pdf", "enea-1.pdf"]

def upload_document(file_path):
    print(f"Uploading {file_path}...")
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (os.path.basename(file_path), f, 'application/pdf')}
            # No auth needed for local dev currently
            response = requests.post(f"{BASE_URL}/api/v1/documents/upload", files=files)
            if response.status_code != 200:
                print(f"Upload failed: {response.text}")
                return None
            
            data = response.json()
            print(f"Upload success. Document ID: {data.get('document_id')}")
            return data.get('document_id')
    except Exception as e:
        print(f"Upload exception: {e}")
        return None

def poll_document_status(document_id):
    print(f"Polling document {document_id}...")
    url = f"{BASE_URL}/api/v1/documents/{document_id}"
    
    for _ in range(60):  # Poll for ~120 seconds
        try:
            response = requests.get(url)
            if response.status_code != 200:
                print(f"Poll failed: {response.status_code}")
                time.sleep(2)
                continue
                
            data = response.json()
            status = data.get('status')
            print(f"Status: {status}")
            
            if status == 'completed':
                print("Processing completed!")
                return data
            if status == 'failed':
                print("Processing failed.")
                return None
            
            time.sleep(2)
        except Exception as e:
            print(f"Polling error: {e}")
            break
    print("Timeout waiting for completion.")
    return None

def main():
    for filename in FILES:
        file_path = os.path.join(TEST_FILES_DIR, filename)
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue
            
        print(f"\n--- Processing {filename} ---")
        doc_id = upload_document(file_path)
        if doc_id:
            result = poll_document_status(doc_id)
            if result:
                print(f"Final Result for {filename}: Success")
                # Optionally fetch analysis result
                # analysis_url = f"{BASE_URL}/api/v1/analysis/document/{doc_id}"
                # logic to check analysis content
            else:
                print(f"Final Result for {filename}: Failure")
        else:
            print(f"Skipping {filename} due to upload failure.")
        print("--------------------------------")

if __name__ == "__main__":
    main()
