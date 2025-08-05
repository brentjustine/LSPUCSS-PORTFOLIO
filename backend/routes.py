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
        # ❌ Delete old cached summary
        supabase.table("user_summaries").delete().eq("user_id", project.user_id).execute()

        # ✅ Generate AI feedback
        ai_score = await generate_ai_score()
        ai_suggestions = await generate_suggestions(project.description, project.file_url)
        ai_learning_path = await suggest_learning_path(
            project.title, project.description, project.file_url
        )

        return {
            "ai_score": ai_score,
            "ai_suggestions": ai_suggestions,
            "ai_learning_path": ai_learning_path,
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


# 🧠 Return learning path suggestion using AI
@router.get("/suggestion")
async def get_suggestion(title: str):
    try:
        suggestion = await suggest_learning_path(title)
        return {"suggestion": suggestion}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 📊 Return AI-generated summary of all user projects (cached if available)
@router.get("/summary")
async def get_summary(request: Request):
    try:
        user_id = request.query_params.get("user_id")
        if not user_id:
            raise HTTPException(status_code=400, detail="Missing user_id")

        print(f"🔍 Getting summary for user_id={user_id}")

        # 🧼 Check if user still has projects
        response = supabase.table("projects").select("*").eq("user_id", user_id).execute()
        projects = response.data or []
        if not projects:
            print("🚫 No projects found. Skipping summary.")
            raise HTTPException(status_code=404, detail="No projects found for summary.")

        # ✅ Use cached summary if available
        cached = supabase.table("user_summaries").select("*").eq("user_id", user_id).limit(1).execute()
        if cached.data and len(cached.data) > 0:
            print("✅ Using cached summary")
            return {"summary": cached.data[0]["summary"]}

        # ⏳ Generate new summary
        summary = await summarize_overall_insights(projects)
        if not summary:
            raise HTTPException(status_code=500, detail="AI failed to generate summary")

        # 💾 Cache it
        supabase.table("user_summaries").upsert({
            "user_id": user_id,
            "summary": summary
        }).execute()

        return {"summary": summary}

    except Exception as e:
        print("❌ Summary error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/summary")
async def delete_summary(request: Request):
    user_id = request.query_params.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")

    supabase.table("user_summaries").delete().eq("user_id", user_id).execute()
    return {"message": "Summary deleted"}
