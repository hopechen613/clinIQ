from typing import Optional

import httpx

from app.models.schemas import TrialCandidate

CTGOV_BASE_URL = "https://clinicaltrials.gov/api/v2/studies"

FIELDS = [
    "NCTId",
    "BriefTitle",
    "OverallStatus",
    "Phase",
    "Condition",
    "BriefSummary",
    "EligibilityCriteria",
    "Sex",
    "MinimumAge",
    "MaximumAge",
    "LocationCity",
    "LocationState",
    "LocationCountry",
]


def _get(study: dict, *path: str):
    node = study
    for key in path:
        if not isinstance(node, dict):
            return None
        node = node.get(key)
    return node


def _to_candidate(study: dict) -> TrialCandidate:
    protocol = study.get("protocolSection", {})
    nct_id = _get(protocol, "identificationModule", "nctId") or ""
    locations = protocol.get("contactsLocationsModule", {}).get("locations", []) or []
    location_strs = [
        ", ".join(filter(None, [loc.get("city"), loc.get("state"), loc.get("country")]))
        for loc in locations
    ]

    return TrialCandidate(
        nct_id=nct_id,
        title=_get(protocol, "identificationModule", "briefTitle") or "",
        status=_get(protocol, "statusModule", "overallStatus") or "UNKNOWN",
        phase=", ".join(_get(protocol, "designModule", "phases") or []) or None,
        conditions=_get(protocol, "conditionsModule", "conditions") or [],
        brief_summary=_get(protocol, "descriptionModule", "briefSummary") or "",
        eligibility_criteria=_get(protocol, "eligibilityModule", "eligibilityCriteria") or "",
        sex=_get(protocol, "eligibilityModule", "sex"),
        minimum_age=_get(protocol, "eligibilityModule", "minimumAge"),
        maximum_age=_get(protocol, "eligibilityModule", "maximumAge"),
        locations=location_strs[:5],
        url=f"https://clinicaltrials.gov/study/{nct_id}" if nct_id else "",
    )


def search_trials(
    condition: str,
    location: Optional[str] = None,
    max_results: int = 10,
) -> list[TrialCandidate]:
    params = {
        "query.cond": condition,
        "filter.overallStatus": "RECRUITING",
        "pageSize": str(max_results),
        "fields": ",".join(FIELDS),
    }
    if location:
        params["query.locn"] = location

    response = httpx.get(CTGOV_BASE_URL, params=params, timeout=20.0)
    response.raise_for_status()
    data = response.json()

    return [_to_candidate(study) for study in data.get("studies", [])]
