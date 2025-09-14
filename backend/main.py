from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router  # <-- adjust path if your file is named differently

app = FastAPI()

# 🔹 CORS setup (important for React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://lspucss-portfolio.vercel.app/"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 Include your router
app.include_router(router)
