from app.config import CLAUDE_MODEL
from app.models.schemas import TrialCandidate, TrialKeyPoint, TrialMatchResult, TrialSearchFilters
from app.services.claude_client import get_client

SYSTEM_PROMPT = """You are a clinical trial eligibility screener helping a patient understand \
whether a specific trial might be right for them. You are given the patient's search \
criteria (and optionally some extra notes) and one trial's eligibility criteria text. Assess \
fit honestly and conservatively.

Rules:
- "eligibility" is "likely_eligible" only if the patient information gives clear evidence of \
meeting essentially all stated criteria. Use "likely_ineligible" if the patient clearly \
fails any stated criterion (especially exclusion criteria). Use "possibly_eligible" when \
the patient seems to fit the general profile but some criteria can't be confirmed. Use \
"insufficient_info" if the patient information is too sparse to judge against this trial at \
all (this will often be the case, since the patient only provided basic search criteria).
- "score" 0-100 reflects overall fit; weight clear criterion failures heavily negative.
- "explanation" is 1-3 plain-language sentences a patient (not a clinician) can understand, \
written supportively but honestly, avoiding unexplained medical jargon.
- "key_points" is a short list (2-5 items) of the most decision-relevant points: type \
"supporting" (patient appears to meet this), "conflicting" (patient appears to fail this), \
or "missing_info" (this matters but isn't covered by what the patient provided). Each \
"text" should be one short concrete sentence.
- Never state or imply a clinical diagnosis or medical advice beyond what's in the provided \
text. This is a screening aid, not a medical determination.
- Respond using only the assess_trial_fit tool call."""

TOOL_DEFINITION = {
    "name": "assess_trial_fit",
    "description": "Record the structured assessment of how well a patient fits one trial's eligibility criteria.",
    "input_schema": {
        "type": "object",
        "properties": {
            "eligibility": {
                "type": "string",
                "enum": ["likely_eligible", "possibly_eligible", "likely_ineligible", "insufficient_info"],
            },
            "score": {"type": "number", "minimum": 0, "maximum": 100},
            "explanation": {"type": "string"},
            "key_points": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string", "enum": ["supporting", "conflicting", "missing_info"]},
                        "text": {"type": "string"},
                    },
                    "required": ["type", "text"],
                },
            },
        },
        "required": ["eligibility", "score", "explanation", "key_points"],
    },
}


def _build_patient_context(filters: TrialSearchFilters) -> str:
    lines = []
    if filters.condition:
        lines.append(f"Condition of interest: {filters.condition}")
    if filters.other_terms:
        lines.append(f"Other relevant terms: {filters.other_terms}")
    if filters.intervention:
        lines.append(f"Interested in intervention/treatment: {filters.intervention}")
    if filters.sex != "all":
        lines.append(f"Sex: {filters.sex}")
    if filters.age_min is not None or filters.age_max is not None:
        lines.append(f"Age range: {filters.age_min or '?'}-{filters.age_max or '?'}")
    elif filters.age_groups:
        lines.append(f"Age group: {', '.join(filters.age_groups)}")
    if filters.accepts_healthy_volunteers:
        lines.append("Patient considers themselves a healthy volunteer (no qualifying condition required).")
    if filters.location:
        lines.append(f"Location: {filters.location}")
    if filters.additional_details:
        lines.append(f"Additional notes from patient: {filters.additional_details}")
    return "\n".join(lines) if lines else "No further patient details provided beyond the search criteria."


def assess_trial(filters: TrialSearchFilters, trial: TrialCandidate) -> TrialMatchResult:
    client = get_client()
    patient_context = _build_patient_context(filters)

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=1536,
        system=SYSTEM_PROMPT,
        tools=[TOOL_DEFINITION],
        tool_choice={"type": "tool", "name": "assess_trial_fit"},
        messages=[
            {
                "role": "user",
                "content": (
                    f"Patient information:\n{patient_context}\n\n"
                    f"Trial: {trial.title} ({trial.nct_id})\n"
                    f"Eligibility criteria:\n{trial.eligibility_criteria or 'Not specified.'}"
                ),
            }
        ],
    )

    tool_use_block = next(block for block in message.content if block.type == "tool_use")
    payload = tool_use_block.input

    return TrialMatchResult(
        nct_id=trial.nct_id,
        title=trial.title,
        status=trial.status,
        phase=trial.phase,
        locations=trial.locations,
        url=trial.url,
        eligibility=payload["eligibility"],
        score=payload["score"],
        explanation=payload["explanation"],
        key_points=[TrialKeyPoint(**p) for p in payload["key_points"]],
    )
