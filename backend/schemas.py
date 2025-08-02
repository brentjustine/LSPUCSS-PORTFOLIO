from pydantic import BaseModel
from typing import Optional

class ProjectIn(BaseModel):
    student_name: str
    title: str
    description: str
    file_url: Optional[str] = None

class ProjectOut(ProjectIn):
    id: int
    student_name: Optional[str]