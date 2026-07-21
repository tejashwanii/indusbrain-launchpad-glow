"""Pydantic models returned by the Compliance Center endpoint."""

from typing import Literal
from typing import Optional

from pydantic import BaseModel, Field


class ComplianceStandard(BaseModel):
    """Compliance assessment for a single industrial standard."""

    name: str = Field(..., min_length=1)
    score: Optional[int] = Field(None, ge=0, le=100)
    status: Literal["Compliant", "Needs Review", "Needs Improvement", "Not Evaluated"]
    reason: str = Field(..., min_length=1)


class ComplianceResponse(BaseModel):
    """Aggregated Compliance Center assessment."""

    overall: Optional[int] = Field(None, ge=0, le=100)
    standards: list[ComplianceStandard] = Field(default_factory=list)
    message: str | None = None
