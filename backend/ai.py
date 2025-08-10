import os
import httpx
from dotenv import load_dotenv
from utils import extract_text_from_file_url

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

MISTRAL_MODEL = "mistral-7b-instruct"

async def generate_ai_score() -> float:
    return 9.0

async def generate_suggestions(description: str, file_url: str | None = None) -> str:
    file_content = await extract_text_from_file_url(file_url) if file_url else ""
    payload = {
        "model": MISTRAL_MODEL,
        "messages": [
            {"role": "system", "content": "Given the project title and description, evaluate the quality, give recommendations and provide a score and feedback."},
            {"role": "user", "content": f"Project description: {description}\n\nFile contents: {file_content}\n\nWhat are some suggestions for improving this project?"}
        ],
        "temperature": 0.7
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=HEADERS, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()

async def suggest_learning_path(title: str, description: str = "", file_url: str | None = None) -> str:
    file_content = await extract_text_from_file_url(file_url) if file_url else ""
    payload = {
        "model": MISTRAL_MODEL,
        "messages": [
            {"role": "system", "content": "You are a learning path recommendation assistant for programming students."},
            {"role": "user", "content": f"Title: {title}\nDescription: {description}\n\nFile content: {file_content}\n\nWhat should I learn next?"}
        ],
        "temperature": 0.7
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(GROQ_API_URL, headers=HEADERS, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()

async def summarize_overall_insights(projects: list) -> str:
    content = "\n\n".join([f"Title: {p['title']}\nDescription: {p['description']}\nSuggestions: {p.get('ai_suggestions', '')}" for p in projects])
    prompt = f"""
    You are an AI tutor evaluating a student's project portfolio. Below are several projects they submitted:

    {content}

    Summarize the student's overall strengths and weaknesses, and provide recommendations on how they can improve.
    """

    payload = {
        "model": MISTRAL_MODEL,
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
