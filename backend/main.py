from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router

app = FastAPI()  # ✅ FIRST define the app

# ✅ THEN add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lspucss-portfolio.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def ping():
    return {"status": "ok"}
app.include_router(router)
