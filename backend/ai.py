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

# --- Score ---
async def generate_ai_score(description: str, file_paths: List[Union[str, Dict[str, str]]] | None = None, grade: float | None = None) -> float:
    file_content = await read_all_files(file_paths) if file_paths else ""
    
    # Ensure grade is numeric
    grade_text = str(grade) if grade is not None else "Grade not provided"

    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {
                "role": "system",
                "content": "Given the project description, uploaded files, and numeric grade, evaluate the project quality from 1 to 10. Output only the numeric score."
            },
            {
                "role": "user",
                "content": f"Description: {description}\nFiles content:\n{file_content}\nGrade: {grade_text}\nScore?"
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

# --- Suggestions ---
async def generate_suggestions(description: str, file_paths: List[Union[str, Dict[str, str]]] | None = None, grade: float | None = None) -> str:
    # Read all file contents just like in read_all_files
    file_content = await read_all_files(file_paths) if file_paths else ""

    # Use the grade provided during upload
    grade_value = grade if grade is not None else "No grade provided"

    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an expert tutor. Evaluate the student's project using the project description, uploaded files, AND the numeric grade. "
                    "The numeric grade must influence your suggestions. "
                    "If the grade is low, focus on fundamental issues; if high, suggest advanced enhancements. "
                    "Include reasoning referencing the grade, and output actionable suggestions only."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Project Description: {description}\n"
                    f"Files content:\n{file_content}\n"
                    f"Numeric Grade: {grade_value}\n"
                    "Provide actionable suggestions based on the project and the numeric grade."
                )
            }
        ],
        "temperature": 0.7
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=HEADERS, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()


# --- Learning Path ---
async def suggest_learning_path(title: str, description: str = "", file_paths: List[Union[str, Dict[str, str]]] | None = None, grade: float | None = None) -> str:
    file_content = await read_all_files(file_paths) if file_paths else ""
    grade_text = str(grade) if grade is not None else "Grade not provided"

    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {
                "role": "system",
                "content": "You are a learning path assistant for programming students. Use the project description, files, and numeric grade to recommend next steps."
            },
            {
                "role": "user",
                "content": f"Title: {title}\nDescription: {description}\nFiles content:\n{file_content}\nGrade: {grade_text}\nWhat should the student learn next?"
            }
        ],
        "temperature": 0.7
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=HEADERS, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()

# --- Summary ---
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
        grade_text = str(grade) if grade is not None else "Grade not provided"

        content += (
            f"---\n"
            f"Title: {p['title']}\n"
            f"Description: {p['description']}\n"
            f"Grade: {grade_text}\n"
            f"Suggestions: {p.get('ai_suggestions', 'None')}\n"
            f"Files content:\n{file_content}\n"
        )

    avg_grade = total_grade / grade_count if grade_count else 0

    prompt = f"""
You are an AI tutor evaluating a student's project portfolio. For each project, consider the description, files, numeric grade, and suggestions.

1. Summarize strengths and weaknesses.
2. Correlate performance with grades (average: {avg_grade:.2f}).
3. Highlight patterns in project quality.
4. Provide actionable recommendations for improvement.
"""

    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "system", "content": "You are an expert AI tutor that evaluates student performance using numeric grades, suggestions, and submitted files."},
            {"role": "user", "content": content + "\n" + prompt}
        ],
        "temperature": 0.7
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=HEADERS, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()
