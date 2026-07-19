from pydantic import BaseModel, Field


class DiagnosticInsight(BaseModel):
    kind: str = Field(default="AI", min_length=1)
    category: str = Field(default="General", min_length=1)
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    timing: str = Field(..., min_length=1)
    severity: str = Field(default="low")
    actions: list[str] = Field(default_factory=list)


class DiagnosticResponse(BaseModel):
    insights: list[DiagnosticInsight]
    message: str | None = None
