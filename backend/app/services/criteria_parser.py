import json
import uuid
from typing import Optional

from app.config import CLAUDE_MODEL
from app.models.schemas import Criterion, ParseCriteriaResponse
from app.services.claude_client import get_client

SYSTEM_PROMPT = """You are a clinical trial protocol analyst. You read raw clinical trial \
protocol text and extract the patient eligibility criteria as structured data.

Rules:
- Split criteria into "inclusion" and "exclusion" lists.
- Each criterion gets a short "category" (e.g. demographics, diagnosis, lab_value, \
medication, prior_therapy, performance_status, biomarker, comorbidity, consent).
- Each criterion gets a clear, self-contained "description" in plain English.
- Where the criterion has a quantifiable threshold, also fill "structured" with keys: \
field, operator (one of >=, <=, >, <, ==, !=, in, not_in), value, unit (nullable).
- If a criterion has no quantifiable threshold, omit "structured" or set it to null.
- Do not invent criteria that are not in the text. Do not skip any stated criteria.
- Respond using only the extract_eligibility_criteria tool call."""

TOOL_DEFINITION = {
    "name": "extract_eligibility_criteria",
    "description": "Record the structured inclusion and exclusion criteria extracted from a trial protocol.",
    "input_schema": {
        "type": "object",
        "properties": {
            "inclusion_criteria": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "category": {"type": "string"},
                        "description": {"type": "string"},
                        "structured": {
                            "type": ["object", "null"],
                            "properties": {
                                "field": {"type": "string"},
                                "operator": {"type": "string"},
                                "value": {},
                                "unit": {"type": ["string", "null"]},
                            },
                        },
                    },
                    "required": ["category", "description"],
                },
            },
            "exclusion_criteria": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "category": {"type": "string"},
                        "description": {"type": "string"},
                        "structured": {
                            "type": ["object", "null"],
                            "properties": {
                                "field": {"type": "string"},
                                "operator": {"type": "string"},
                                "value": {},
                                "unit": {"type": ["string", "null"]},
                            },
                        },
                    },
                    "required": ["category", "description"],
                },
            },
        },
        "required": ["inclusion_criteria", "exclusion_criteria"],
    },
}


def parse_criteria(protocol_text: str, trial_id: Optional[str]) -> ParseCriteriaResponse:
    client = get_client()
    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        tools=[TOOL_DEFINITION],
        tool_choice={"type": "tool", "name": "extract_eligibility_criteria"},
        messages=[
            {
                "role": "user",
                "content": f"Extract the eligibility criteria from this trial protocol:\n\n{protocol_text}",
            }
        ],
    )

    tool_use_block = next(block for block in message.content if block.type == "tool_use")
    payload = tool_use_block.input

    inclusion = [
        Criterion(id=f"inc-{i+1}-{uuid.uuid4().hex[:6]}", type="inclusion", **c)
        for i, c in enumerate(payload.get("inclusion_criteria", []))
    ]
    exclusion = [
        Criterion(id=f"exc-{i+1}-{uuid.uuid4().hex[:6]}", type="exclusion", **c)
        for i, c in enumerate(payload.get("exclusion_criteria", []))
    ]

    return ParseCriteriaResponse(
        trial_id=trial_id,
        inclusion_criteria=inclusion,
        exclusion_criteria=exclusion,
        raw_model_output=json.dumps(payload),
    )
