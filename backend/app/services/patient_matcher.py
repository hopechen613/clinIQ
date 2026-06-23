from typing import Optional

from app.config import CLAUDE_MODEL
from app.models.schemas import (
    CriterionAssessment,
    ParseCriteriaResponse,
    PatientMatchResult,
    PatientRecord,
)
from app.services.claude_client import get_client

SYSTEM_PROMPT = """You are a clinical trial patient-screening assistant. You are given a \
patient's de-identified record and a list of inclusion/exclusion criteria for a trial. \
For each criterion, decide whether the patient meets it based ONLY on evidence present in \
the record.

Rules:
- For every criterion provided, return exactly one assessment with status "met", \
"not_met", or "unclear" (use "unclear" when the record doesn't contain enough information).
- "evidence" must quote or closely paraphrase the specific part of the record that supports \
the status, or state "no information found in record" if unclear.
- "confidence" is your confidence in the status judgment, from 0 to 1.
- Overall eligibility is "ineligible" if any exclusion criterion is "met" or any inclusion \
criterion is "not_met". Otherwise "needs_review" if any criterion is "unclear", else \
"eligible".
- "score" is 0-100 reflecting overall fit: weight inclusion criteria met and exclusion \
criteria avoided positively, unclear criteria as partial credit, and failed criteria heavily \
negative.
- "summary" is 1-3 sentences a clinical research coordinator can scan quickly.
- Respond using only the submit_patient_assessment tool call."""

TOOL_DEFINITION = {
    "name": "submit_patient_assessment",
    "description": "Record the structured eligibility assessment for one patient against the trial criteria.",
    "input_schema": {
        "type": "object",
        "properties": {
            "eligibility": {"type": "string", "enum": ["eligible", "ineligible", "needs_review"]},
            "score": {"type": "number", "minimum": 0, "maximum": 100},
            "summary": {"type": "string"},
            "criterion_assessments": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "criterion_id": {"type": "string"},
                        "status": {"type": "string", "enum": ["met", "not_met", "unclear"]},
                        "evidence": {"type": "string"},
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    },
                    "required": ["criterion_id", "status", "evidence", "confidence"],
                },
            },
        },
        "required": ["eligibility", "score", "summary", "criterion_assessments"],
    },
}


def _format_criteria(criteria: ParseCriteriaResponse) -> str:
    lines = []
    for c in criteria.inclusion_criteria:
        lines.append(f"[{c.id}] (INCLUSION, {c.category}) {c.description}")
    for c in criteria.exclusion_criteria:
        lines.append(f"[{c.id}] (EXCLUSION, {c.category}) {c.description}")
    return "\n".join(lines)


def match_patient(criteria: ParseCriteriaResponse, patient: PatientRecord) -> PatientMatchResult:
    client = get_client()
    criteria_text = _format_criteria(criteria)
    by_id = {c.id: c for c in criteria.inclusion_criteria + criteria.exclusion_criteria}

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        tools=[TOOL_DEFINITION],
        tool_choice={"type": "tool", "name": "submit_patient_assessment"},
        messages=[
            {
                "role": "user",
                "content": (
                    f"Trial criteria:\n{criteria_text}\n\n"
                    f"Patient record (patient_id={patient.patient_id}):\n{patient.record_text}"
                ),
            }
        ],
    )

    tool_use_block = next(block for block in message.content if block.type == "tool_use")
    payload = tool_use_block.input

    assessments = []
    for a in payload.get("criterion_assessments", []):
        criterion = by_id.get(a["criterion_id"])
        if criterion is None:
            continue
        assessments.append(
            CriterionAssessment(
                criterion_id=criterion.id,
                description=criterion.description,
                type=criterion.type,
                status=a["status"],
                evidence=a["evidence"],
                confidence=a["confidence"],
            )
        )

    return PatientMatchResult(
        patient_id=patient.patient_id,
        eligibility=payload["eligibility"],
        score=payload["score"],
        summary=payload["summary"],
        criterion_assessments=assessments,
    )
