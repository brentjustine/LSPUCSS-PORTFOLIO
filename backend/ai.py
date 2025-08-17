import os
import httpx
from dotenv import load_dotenv
from utils import extract_text_from_file_url
from typing import List, Dict

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

async def read_all_files(file_paths: List[Dict[str, str]]) -> str:
    """Extract text from all uploaded files"""
    content = ""
    for f in file_paths:
        url = f.get("url")
        if url:
            content += await extract_text_from_file_url(url) + "\n"
    return content.strip()


async def generate_ai_score(description: str, file_paths: List[Dict[str, str]] | None = None, grade: float | None = None) -> float:
    file_content = await read_all_files(file_paths) if file_paths else ""
    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {
                "role": "system",
                "content": "Given the project title, description, uploaded files, and grade, evaluate the quality and provide a score from 1 to 10. Output only the numeric score."
            },
            {
                "role": "user",
                "content": f"Project description: {description}\nFiles content:\n{file_content}\nGrade: {grade or 'N/A'}\nWhat is the score?"
            }
        ],
        "temperature": 0.7
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=HEADERS, json=payload)
        res.raise_for_status()
        score_text = res.json()["choices"][0]["message"]["content"].strip()
    
    try:
        return float(score_text)
    except ValueError:
        return 0.0


async def generate_suggestions(description: str, file_paths: List[Dict[str, str]] | None = None, grade: float | None = None) -> str:
    file_content = await read_all_files(file_paths) if file_paths else ""
    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {
                "role": "system",
                "content": "Given the project description, uploaded files, and grade, evaluate the project and provide detailed suggestions for improvement."
            },
            {
                "role": "user",
                "content": f"Project description: {description}\nFiles content:\n{file_content}\nGrade: {grade or 'N/A'}\nProvide suggestions to improve this project."
            }
        ],
        "temperature": 0.7
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=HEADERS, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()


async def suggest_learning_path(title: str, description: str = "", file_paths: List[Dict[str, str]] | None = None, grade: float | None = None) -> str:
    file_content = await read_all_files(file_paths) if file_paths else ""
    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {
                "role": "system",
                "content": "You are a learning path recommendation assistant for programming students. Consider the project files, description, and grade to recommend next steps."
            },
            {
                "role": "user",
                "content": f"Title: {title}\nDescription: {description}\nFiles content:\n{file_content}\nGrade: {grade or 'N/A'}\nWhat should the student learn next?"
            }
        ],
        "temperature": 0.7
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=HEADERS, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()


async def summarize_overall_insights(projects: list) -> str:
    """
    Summarizes the student's overall performance using all files and grades.
    Each project should have: 'title', 'description', 'ai_suggestions', 'file_paths', 'grade'
    """
    content = ""
    for p in projects:
        file_content = await read_all_files(p.get("file_paths", []))
        content += (
            f"Title: {p['title']}\n"
            f"Description: {p['description']}\n"
            f"Grade: {p.get('grade', 'N/A')}\n"
            f"Suggestions: {p.get('ai_suggestions', '')}\n"
            f"Files content:\n{file_content}\n\n"
        )

    prompt = f"""
You are an AI tutor evaluating a student's project portfolio. Below are several projects they submitted:

{content}

Summarize the student's overall strengths and weaknesses, correlate with grades, and provide recommendations on how they can improve.
    """

    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "system", "content": "You are a helpful AI tutor that summarizes student performance."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=HEADERS, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()
