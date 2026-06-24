from app.config import CLAUDE_MODEL
from app.models.schemas import PatientProfile
from app.services.claude_client import get_client

SYSTEM_PROMPT = """You are a patient intake assistant for a clinical trial search tool. \
A patient (or their caregiver) describes their condition in their own words. Extract a \
structured profile that will be used to search ClinicalTrials.gov and assess eligibility.

Rules:
- "condition_query" is a short, standard disease/condition phrase suitable as a search term \
on ClinicalTrials.gov (e.g. "non-small cell lung cancer", "type 2 diabetes"). Prefer the \
most specific condition mentioned.
- "location" is the city/state/country the patient mentions being able to travel to or being \
located in. Leave null if not mentioned.
- "age" and "sex" are extracted only if explicitly stated or clearly implied; otherwise null.
- "summary" is a 2-5 sentence normalized clinical summary (diagnosis, stage/severity, prior \
treatments, key labs/symptoms, demographics) written in third person, suitable for an AI \
eligibility screener to compare against trial criteria. Do not add information not present \
or reasonably implied in the patient's text.
- Respond using only the extract_patient_profile tool call."""

TOOL_DEFINITION = {
    "name": "extract_patient_profile",
    "description": "Record the structured patient profile extracted from free-text patient input.",
    "input_schema": {
        "type": "object",
        "properties": {
            "condition_query": {"type": "string"},
            "location": {"type": ["string", "null"]},
            "age": {"type": ["integer", "null"]},
            "sex": {"type": ["string", "null"], "enum": ["male", "female", "unspecified", None]},
            "summary": {"type": "string"},
        },
        "required": ["condition_query", "summary"],
    },
}


def extract_profile(patient_text: str) -> PatientProfile:
    client = get_client()
    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        tools=[TOOL_DEFINITION],
        tool_choice={"type": "tool", "name": "extract_patient_profile"},
        messages=[{"role": "user", "content": f"Patient description:\n\n{patient_text}"}],
    )

    tool_use_block = next(block for block in message.content if block.type == "tool_use")
    payload = tool_use_block.input
    return PatientProfile(**payload)
