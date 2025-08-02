# utils.py
import os
import tempfile
import zipfile
import httpx
import mimetypes
from pathlib import Path
from docx import Document
from PyPDF2 import PdfReader

async def extract_text_from_file_url(file_url: str) -> str:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(file_url)
            response.raise_for_status()

            file_type = mimetypes.guess_type(file_url)[0] or ""
            ext = Path(file_url).suffix.lower()

            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                tmp.write(response.content)
                tmp_path = tmp.name

        if ext == ".zip":
            return extract_text_from_zip(tmp_path)
        elif ext == ".docx":
            return extract_text_from_docx(tmp_path)
        elif ext == ".pdf":
            return extract_text_from_pdf(tmp_path)
        elif ext in [".py", ".js", ".ts", ".java", ".html", ".css", ".txt", ".md"]:
            return extract_text_from_plain(tmp_path)
        else:
            return f"(Unsupported file type: {ext})"

    except Exception as e:
        return f"(Failed to extract file content: {str(e)})"

def extract_text_from_plain(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def extract_text_from_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join([para.text for para in doc.paragraphs])

def extract_text_from_pdf(path: str) -> str:
    reader = PdfReader(path)
    return "\n".join([page.extract_text() or "" for page in reader.pages])

def extract_text_from_zip(path: str) -> str:
    output = []
    with zipfile.ZipFile(path, "r") as zip_ref:
        for file_info in zip_ref.infolist():
            if file_info.filename.endswith((".txt", ".py", ".md", ".js", ".ts", ".html", ".css")):
                with zip_ref.open(file_info) as f:
                    try:
                        output.append(f"\n--- {file_info.filename} ---\n" + f.read().decode("utf-8", errors="ignore"))
                    except Exception:
                        continue
    return "\n".join(output)
