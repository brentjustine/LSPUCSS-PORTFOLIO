import os
import asyncio
import requests
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from utils import extract_text_from_file_url
from typing import List, Dict, Union
import zipfile
import traceback

# --- Dropbox model settings ---
MODEL_DIR = "./summarization_model"
MODEL_ZIP_PATH = os.path.join(MODEL_DIR, "model.zip")
DROPBOX_URL = "https://www.dropbox.com/scl/fo/btij12eqtunsokf08cug2/AIL7IPnAReQ-K3B__034R-g?rlkey=q4me3zk1esrli06d1m1uo5otu&st=pdy4ztkn&dl=1"

# --- Ensure model folder exists ---
os.makedirs(MODEL_DIR, exist_ok=True)

# --- Download & extract model safely ---
if not os.path.exists(MODEL_DIR) or not os.listdir(MODEL_DIR):
    print("📥 Downloading model...")
    try:
        with requests.get(DROPBOX_URL, stream=True) as r:
            r.raise_for_status()
            with open(MODEL_ZIP_PATH, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        print("✅ Download complete. Extracting...")
        with zipfile.ZipFile(MODEL_ZIP_PATH, "r") as zip_ref:
            zip_ref.extractall(MODEL_DIR)
        os.remove(MODEL_ZIP_PATH)
        print("✅ Model ready.")
    except Exception as e:
        raise RuntimeError(f"Failed to download or extract model: {e}")
else:
    print("✅ Model exists, skipping download.")

# --- Load model safely ---
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_DIR)
    summarizer = pipeline("summarization", model=model, tokenizer=tokenizer)
except Exception as e:
    raise RuntimeError(f"Failed to load model: {e}")

# --- Helper to read files ---
async def read_all_files(file_paths: List[Union[str, Dict[str, str]]]) -> str:
    content = ""
    for f in file_paths or []:
        try:
            if isinstance(f, str):
                f = {"url": f}
            url = f.get("url")
            if url:
                text = await extract_text_from_file_url(url)
                content += text + "\n"
        except Exception as e:
            print(f"⚠️ Failed to read file {f}: {e}")
            continue
    return content.strip() or "No files submitted."

# --- Safe summarization ---
def safe_summarize(text: str, max_length: int, min_length: int, do_sample: bool = False) -> str:
    if not text.strip():
        return "No content to summarize."
    try:
        summary = summarizer(text, max_length=max_length, min_length=min_length, do_sample=do_sample)
        return summary[0].get('summary_text', 'No summary generated.')
    except Exception:
        traceback.print_exc()
        return "Error generating summary."

# --- Scoring ---
async def generate_ai_score(description: str, file_paths: List[Union[str, Dict[str, str]]] = None, grade: float = None) -> float:
    file_content = await read_all_files(file_paths)
    text = f"Rate this project from 1-10:\nDescription: {description}\nFiles: {file_content}\nGrade: {grade or 'N/A'}"
    summary_text = safe_summarize(text, max_length=20, min_length=2, do_sample=False)
    try:
        score = float("".join(filter(lambda x: x.isdigit() or x==".", summary_text)))
        return max(0.0, min(score, 10.0))
    except Exception:
        return 0.0

# --- Suggestions ---
async def generate_suggestions(description: str, file_paths: List[Union[str, Dict[str, str]]] = None, grade: float = None) -> str:
    file_content = await read_all_files(file_paths)
    text = f"Provide actionable suggestions for this project:\nDescription: {description}\nFiles:\n{file_content}\nGrade: {grade or 'N/A'}"
    return safe_summarize(text, max_length=200, min_length=50, do_sample=True)

# --- Learning path ---
async def suggest_learning_path(title: str, description: str = "", file_paths: List[Union[str, Dict[str, str]]] = None, grade: float = None) -> str:
    file_content = await read_all_files(file_paths)
    text = f"Recommend next learning steps based on this project:\nTitle: {title}\nDescription: {description}\nFiles:\n{file_content}\nGrade: {grade or 'N/A'}"
    return safe_summarize(text, max_length=200, min_length=50, do_sample=True)

# --- Portfolio summary ---
async def summarize_overall_insights(projects: list) -> str:
    content = ""
    total_grade = 0
    grade_count = 0

    for p in projects or []:
        file_content = await read_all_files(p.get("file_paths", []))
        grade = p.get("grade")
        if grade is not None:
            total_grade += grade
            grade_count += 1
        content += f"Project Title: {p.get('title', 'N/A')}\nDescription: {p.get('description', 'N/A')}\nGrade: {grade or 'N/A'}\nFiles:\n{file_content}\n"

    avg_grade = total_grade / grade_count if grade_count else 0
    text = f"Summarize the student's overall performance (average grade: {avg_grade:.2f}):\n{content}"
    return safe_summarize(text, max_length=400, min_length=150, do_sample=True)
