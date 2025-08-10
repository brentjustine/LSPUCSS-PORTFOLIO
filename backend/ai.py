import os
import httpx
import uuid
from dotenv import load_dotenv
from utils import extract_text_from_file_url

load_dotenv()

# Groq settings (only for summary + suggestion)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json",
}

# Hugging Face settings (for score, suggestions, learning path)
HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL_URL = os.getenv("HF_MODEL_URL")
HF_HEADERS = {
    "Authorization": f"Bearer {HF_API_KEY}",
    "Content-Type": "application/json",
}


async def generate_ai_score(description: str = "", file_url: str | None = None) -> float:
    file_content = await extract_text_from_file_url(file_url) if file_url else ""
    input_text = (
        f"Rate this student project from 0 to 10.\n\n"
        f"Project description: {description}\n\nFile contents: {file_content}"
    )

    payload = {"inputs": input_text}

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(HF_MODEL_URL, headers=HF_HEADERS, json=payload)
        res.raise_for_status()
        data = res.json()

        try:
            if isinstance(data, list) and "score" in data[0]:
                score = float(data[0]["score"]) * 10
            elif isinstance(data, (float, int)):
                score = float(data)
            elif isinstance(data, str):
                score = float(data.strip())
            else:
                score = 0.0
        except Exception:
            score = 0.0

    return round(score, 2)


async def generate_suggestions(description: str, file_url: str | None = None) -> str:
    file_content = await extract_text_from_file_url(file_url) if file_url else ""
    input_text = (
        f"Give detailed suggestions to improve this student project.\n\n"
        f"Project description: {description}\n\nFile contents: {file_content}"
    )

    payload = {"inputs": input_text}

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(HF_MODEL_URL, headers=HF_HEADERS, json=payload)
        res.raise_for_status()
        data = res.json()

        if isinstance(data, str):
            return data.strip()
        elif isinstance(data, list) and "generated_text" in data[0]:
            return data[0]["generated_text"].strip()
        else:
            return str(data)


async def generate_learning_path_hf(title: str, description: str = "", file_url: str | None = None) -> str:
    file_content = await extract_text_from_file_url(file_url) if file_url else ""
    input_text = (
        f"Based on the following student project, suggest a detailed step-by-step learning path:\n\n"
        f"Title: {title}\nDescription: {description}\n\nFile contents: {file_content}"
    )

    payload = {"inputs": input_text}

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(HF_MODEL_URL, headers=HF_HEADERS, json=payload)
        res.raise_for_status()
        data = res.json()

        if isinstance(data, str):
            return data.strip()
        elif isinstance(data, list) and "generated_text" in data[0]:
            return data[0]["generated_text"].strip()
        else:
            return str(data)


async def suggest_learning_path(title: str) -> str:
    prompt = f"Suggest a detailed step-by-step learning path for the project titled: {title}"

    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "system", "content": "You are a helpful AI tutor."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=GROQ_HEADERS, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()


async def summarize_overall_insights(projects: list) -> str:
    content = "\n\n".join(
        [
            f"Title: {p['title']}\nDescription: {p['description']}\nSuggestions: {p.get('ai_suggestions', '')}"
            for p in projects
        ]
    )
    prompt = f"""
    You are an AI tutor evaluating a student's project portfolio. Below are several projects they submitted:

    {content}

    Summarize the student's overall strengths and weaknesses, and provide recommendations on how they can improve.
    """
    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "system", "content": "You are a helpful AI tutor that summarizes student performance."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=GROQ_HEADERS, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()
