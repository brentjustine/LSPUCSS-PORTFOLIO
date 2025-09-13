import asyncio
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from utils import extract_text_from_file_url
from typing import List, Dict, Union

# --- Hugging Face model settings ---
MODEL_ID = "menudongbibe/summarizationmodel"  # your uploaded model repo

# --- Load model once ---
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_ID)
summarizer = pipeline("summarization", model=model, tokenizer=tokenizer)

# --- Helpers ---
async def read_all_files(file_paths: List[Union[str, Dict[str, str]]]) -> str:
    content = ""
    for f in file_paths:
        if isinstance(f, str):
            f = {"url": f}
        url = f.get("url")
        if url:
            text = await extract_text_from_file_url(url)
            content += text + "\n"
    return content.strip() or "No files submitted."

# --- Scoring ---
async def generate_ai_score(description: str, file_paths: List[Union[str, Dict[str, str]]] | None = None, grade: float | None = None) -> float:
    file_content = await read_all_files(file_paths) if file_paths else ""
    text = f"Rate this project from 1-10:\nDescription: {description}\nFiles: {file_content}\nGrade: {grade or 'N/A'}"
    
    summary = summarizer(text, max_length=20, min_length=2, do_sample=False)
    try:
        score = float("".join(filter(lambda x: x.isdigit() or x == ".", summary[0]['summary_text'])))
        return max(0.0, min(score, 10.0))
    except:
        return 0.0

# --- Suggestions ---
async def generate_suggestions(description: str, file_paths: List[Union[str, Dict[str, str]]] | None = None, grade: float | None = None) -> str:
    file_content = await read_all_files(file_paths) if file_paths else ""
    text = f"Provide actionable suggestions for this project:\nDescription: {description}\nFiles:\n{file_content}\nGrade: {grade or 'N/A'}"
    
    summary = summarizer(text, max_length=200, min_length=50, do_sample=True)
    return summary[0]['summary_text']

# --- Learning path ---
async def suggest_learning_path(title: str, description: str = "", file_paths: List[Union[str, Dict[str, str]]] | None = None, grade: float | None = None) -> str:
    file_content = await read_all_files(file_paths) if file_paths else ""
    text = f"Recommend next learning steps based on this project:\nTitle: {title}\nDescription: {description}\nFiles:\n{file_content}\nGrade: {grade or 'N/A'}"
    
    summary = summarizer(text, max_length=200, min_length=50, do_sample=True)
    return summary[0]['summary_text']

# --- Portfolio summary ---
async def summarize_overall_insights(projects: list) -> str:
    content = ""
    total_grade = 0
    grade_count = 0

    for p in projects:
        file_content = await read_all_files(p.get("file_paths", []))
        grade = p.get("grade")
        if grade is not None:
            total_grade += grade
            grade_count += 1
        content += f"Project Title: {p['title']}\nDescription: {p['description']}\nGrade: {grade or 'N/A'}\nFiles:\n{file_content}\n"

    avg_grade = total_grade / grade_count if grade_count else 0
    text = f"Summarize the student's overall performance (average grade: {avg_grade:.2f}):\n{content}"
    
    summary = summarizer(text, max_length=400, min_length=150, do_sample=True)
    return summary[0]['summary_text']
