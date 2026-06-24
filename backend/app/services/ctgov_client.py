import re
from typing import Optional

import httpx

from app.models.schemas import TrialCandidate, TrialSearchFilters

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

AGE_BUCKET_RANGES = {
    "child": (0, 17),
    "adult": (18, 64),
    "older_adult": (65, 130),
}

_AGE_VALUE_RE = re.compile(r"(\d+)\s*Year", re.IGNORECASE)


def _get(study: dict, *path: str):
    node = study
    for key in path:
        if not isinstance(node, dict):
            return None
        node = node.get(key)
    return node


def _parse_age_years(age_str: Optional[str]) -> Optional[int]:
    if not age_str:
        return None
    match = _AGE_VALUE_RE.search(age_str)
    return int(match.group(1)) if match else None


def _quote(value: str) -> str:
    escaped = value.replace('"', '\\"')
    return f'"{escaped}"'


def _build_advanced_filter(filters: TrialSearchFilters) -> Optional[str]:
    clauses: list[str] = []

    if filters.sex == "female":
        clauses.append("AREA[Sex](FEMALE OR ALL)")
    elif filters.sex == "male":
        clauses.append("AREA[Sex](MALE OR ALL)")

    if filters.accepts_healthy_volunteers:
        clauses.append("AREA[HealthyVolunteers]true")

    if filters.phases:
        phase_map = {
            "early_phase1": "EARLY_PHASE1",
            "phase1": "PHASE1",
            "phase2": "PHASE2",
            "phase3": "PHASE3",
            "phase4": "PHASE4",
            "na": "NA",
        }
        values = " OR ".join(phase_map[p] for p in filters.phases)
        clauses.append(f"AREA[Phase]({values})")

    if filters.study_types:
        sub_clauses = []
        if "interventional" in filters.study_types:
            sub_clauses.append("AREA[StudyType]INTERVENTIONAL")
        if "observational" in filters.study_types:
            sub_clauses.append("AREA[StudyType]OBSERVATIONAL")
        if "patient_registries" in filters.study_types:
            sub_clauses.append("AREA[PatientRegistry]true")
        if "expanded_access" in filters.study_types:
            expanded_clause = "AREA[StudyType]EXPANDED_ACCESS"
            subtype_map = {
                "individual": "AREA[ExpAccTypeIndividual]true",
                "intermediate": "AREA[ExpAccTypeIntermediate]true",
                "treatment": "AREA[ExpAccTypeTreatment]true",
            }
            subtypes = [subtype_map[t] for t in filters.expanded_access_types]
            if subtypes:
                expanded_clause += f" AND ({' OR '.join(subtypes)})"
            sub_clauses.append(expanded_clause)
        if sub_clauses:
            clauses.append(f"({' OR '.join(sub_clauses)})")

    if filters.has_results == "with":
        clauses.append("AREA[ResultsFirstPostDate]RANGE[MIN,MAX]")
    elif filters.has_results == "without":
        clauses.append("NOT AREA[ResultsFirstPostDate]RANGE[MIN,MAX]")

    if filters.study_documents:
        doc_map = {
            "protocols": "AREA[LargeDocHasProtocol]true",
            "saps": "AREA[LargeDocHasSAP]true",
            "icfs": "AREA[LargeDocHasICF]true",
        }
        sub_clauses = [doc_map[d] for d in filters.study_documents]
        clauses.append(f"({' OR '.join(sub_clauses)})")

    if filters.funder_types:
        funder_map = {
            "nih": ["NIH"],
            "fed": ["FED"],
            "industry": ["INDUSTRY"],
            "all_others": ["INDIV", "OTHER_GOV", "NETWORK", "AMBIG", "OTHER", "UNKNOWN"],
        }
        values: list[str] = []
        for f in filters.funder_types:
            values.extend(funder_map[f])
        clauses.append(f"AREA[LeadSponsorClass]({' OR '.join(values)})")

    if filters.title:
        clauses.append(f"(AREA[BriefTitle]{_quote(filters.title)} OR AREA[Acronym]{_quote(filters.title)})")

    date_fields = [
        ("StartDate", filters.study_start_from, filters.study_start_to),
        ("PrimaryCompletionDate", filters.primary_completion_from, filters.primary_completion_to),
        ("StudyFirstPostDate", filters.first_posted_from, filters.first_posted_to),
        ("ResultsFirstPostDate", filters.results_first_posted_from, filters.results_first_posted_to),
        ("LastUpdatePostDate", filters.last_update_posted_from, filters.last_update_posted_to),
        ("CompletionDate", filters.study_completion_from, filters.study_completion_to),
    ]
    for area, frm, to in date_fields:
        if frm or to:
            clauses.append(f"AREA[{area}]RANGE[{frm or 'MIN'},{to or 'MAX'}]")

    return " AND ".join(clauses) if clauses else None


def _age_filter_ranges(filters: TrialSearchFilters) -> list[tuple[int, int]]:
    if filters.age_min is not None or filters.age_max is not None:
        return [(filters.age_min or 0, filters.age_max or 130)]
    return [AGE_BUCKET_RANGES[g] for g in filters.age_groups]


def _passes_age_filter(trial: TrialCandidate, ranges: list[tuple[int, int]]) -> bool:
    if not ranges:
        return True
    trial_min = _parse_age_years(trial.minimum_age)
    trial_max = _parse_age_years(trial.maximum_age)
    trial_min = trial_min if trial_min is not None else 0
    trial_max = trial_max if trial_max is not None else 130
    return any(trial_min <= hi and trial_max >= lo for lo, hi in ranges)


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


def search_trials(filters: TrialSearchFilters, max_results: int = 10) -> list[TrialCandidate]:
    params: dict[str, str] = {
        "pageSize": str(max(max_results * 3, max_results)),
        "fields": ",".join(FIELDS),
    }
    if filters.condition:
        params["query.cond"] = filters.condition
    if filters.other_terms:
        params["query.term"] = filters.other_terms
    if filters.intervention:
        params["query.intr"] = filters.intervention
    if filters.location:
        params["query.locn"] = filters.location
    if filters.title:
        params["query.titles"] = filters.title

    if filters.study_status == "recruiting_not_yet":
        params["filter.overallStatus"] = "RECRUITING,NOT_YET_RECRUITING"

    advanced = _build_advanced_filter(filters)
    if advanced:
        params["filter.advanced"] = advanced

    response = httpx.get(CTGOV_BASE_URL, params=params, timeout=20.0)
    response.raise_for_status()
    data = response.json()

    candidates = [_to_candidate(study) for study in data.get("studies", [])]

    age_ranges = _age_filter_ranges(filters)
    candidates = [c for c in candidates if _passes_age_filter(c, age_ranges)]

    return candidates[:max_results]
