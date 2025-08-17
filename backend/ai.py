import os
import httpx
import json
from dotenv import load_dotenv
from utils import extract_text_from_file_url
from typing import List, Dict, Union

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

async def parse_file_paths(file_paths: List[Union[str, Dict[str, str]]]) -> List[Dict[str, str]]:
    """Convert JSON strings to dicts if needed."""
    parsed = []
    for f in file_paths:
        if isinstance(f, str):
            parsed.append(json.loads(f))
        elif isinstance(f, dict):
            parsed.append(f)
    return parsed

async def read_all_files(file_paths: List[Union[str, Dict[str, str]]]) -> str:
    """Extract text from all uploaded files."""
    file_paths = await parse_file_paths(file_paths)
    content = ""
    for f in file_paths:
        url = f.get("url")
        if url:
            text = await extract_text_from_file_url(url)
            content += text + "\n"
    return content.strip() or "No files submitted."

async def generate_ai_score(description: str, file_paths: List[Union[str, Dict[str, str]]] | None = None, grade: float | None = None) -> float:
    file_content = await read_all_files(file_paths) if file_paths else ""
    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {
                "role": "system",
                "content": "Evaluate the quality of a student's project given its description, uploaded files, and grade. Output only a numeric score from 1 to 10."
            },
            {
                "role": "user",
                "content": f"Description: {description}\nFiles content:\n{file_content}\nGrade: {grade or 'N/A'}\nWhat is the score?"
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

async def generate_suggestions(description: str, file_paths: List[Union[str, Dict[str, str]]] | None = None, grade: float | None = None) -> str:
    file_content = await read_all_files(file_paths) if file_paths else ""
    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an expert tutor. Given a project description, uploaded files, and grade, "
                    "provide detailed suggestions for improvement. Consider the grade: if low, prioritize fundamental issues; if high, suggest advanced enhancements."
                )
            },
            {
                "role": "user",
                "content": f"Description: {description}\nFiles content:\n{file_content}\nGrade: {grade or 'N/A'}\nProvide actionable suggestions."
            }
        ],
        "temperature": 0.7
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=HEADERS, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()

async def suggest_learning_path(title: str, description: str = "", file_paths: List[Union[str, Dict[str, str]]] | None = None, grade: float | None = None) -> str:
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
    Summarizes a student's overall performance across projects.
    Each project should include: 'title', 'description', 'ai_suggestions', 'file_paths', 'grade'
    """
    content = ""
    total_grade = 0
    grade_count = 0

    for p in projects:
        file_content = await read_all_files(p.get("file_paths", []))
        grade = p.get("grade")
        if grade is not None:
            total_grade += grade
            grade_count += 1

        content += (
            f"---\n"
            f"Title: {p['title']}\n"
            f"Description: {p['description']}\n"
            f"Grade: {grade if grade is not None else 'N/A'}\n"
            f"Suggestions: {p.get('ai_suggestions', 'None')}\n"
            f"Files content:\n{file_content}\n"
        )

    avg_grade = total_grade / grade_count if grade_count else 0

    prompt = f"""
You are an AI tutor evaluating a student's project portfolio. For each project, consider the description, files, grade, and suggestions.

1. Summarize the student's strengths and weaknesses.
2. Correlate performance with grades (average: {avg_grade:.2f}).
3. Highlight patterns in project quality.
4. Provide actionable recommendations for improvement.
    """

    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "system", "content": "You are an expert AI tutor that evaluates student performance using grades, suggestions, and submitted files."},
            {"role": "user", "content": content + "\n" + prompt}
        ],
        "temperature": 0.7
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=HEADERS, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()
