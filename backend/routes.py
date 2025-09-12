from fastapi import APIRouter, HTTPException, Request
from schemas import ProjectIn, ProjectOut
from ai import (
    generate_ai_score,
    generate_suggestions,
    suggest_learning_path,
    summarize_overall_insights,
)
from database import supabase

router = APIRouter()


# 🔄 Return AI feedback only — frontend handles database insert
@router.post("/submit")
async def submit_project(project: ProjectIn):
    try:
        # Clear cached summary if it exists
        supabase.table("user_summaries").delete().eq("user_id", project.user_id).execute()

        # Generate AI feedback using the local model
        ai_score = await generate_ai_score(project.description, project.file_url)
        ai_suggestions = await generate_suggestions(project.description, project.file_url)

        return {
            "ai_score": ai_score,
            "ai_suggestions": ai_suggestions,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 📦 Return all projects, newest first
@router.get("/projects", response_model=list[ProjectOut])
async def get_projects():
    try:
        response = supabase.table("projects").select("*").order("created_at", desc=True).execute()
        data = response.data or []
        for item in data:
            item["student_name"] = item.get("student_name") or "Unnamed Student"
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 🧠 Return learning path suggestion using local AI
@router.get("/suggestion")
async def get_suggestion(title: str, description: str = "", file_url: str = None, grade: float = None):
    try:
        suggestion = await suggest_learning_path(title, description, file_paths=[{"url": file_url}] if file_url else None, grade=grade)
        return {"suggestion": suggestion}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 📊 Return AI-generated summary of all user projects (cached if available)
@router.get("/summary")
async def get_summary(request: Request):
    try:
        user_id = request.query_params.get("user_id")
        refresh = request.query_params.get("refresh", "false").lower() == "true"

        if not user_id:
            raise HTTPException(status_code=400, detail="Missing user_id")

        # Fetch projects
        response = supabase.table("projects").select("*").eq("user_id", user_id).execute()
        projects = response.data or []
        if not projects:
            raise HTTPException(status_code=404, detail="No projects found for summary.")

        # Return cached summary if available and refresh is false
        if not refresh:
            cached = supabase.table("user_summaries").select("*").eq("user_id", user_id).limit(1).execute()
            if cached.data and len(cached.data) > 0:
                return {"summary": cached.data[0]["summary"]}

        # Generate new summary with local AI
        summary = await summarize_overall_insights(projects)
        if not summary:
            raise HTTPException(status_code=500, detail="AI failed to generate summary")

        # Cache the summary
        supabase.table("user_summaries").upsert({
            "user_id": user_id,
            "summary": summary
        }).execute()

        return {"summary": summary}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
