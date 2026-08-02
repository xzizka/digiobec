---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 3
total_count: 4
last_updated: 2026-08-02T05:58:46.122Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | stub | apps/citizen-web/src/features/submission/components/AddressAutocomplete.tsx |  | RUIAN AddressAutocomplete built + unit-tested but not wired into a live form (no current form schema declares ui:widget: address) | open |  | 2026-08-01T19:23:47.019Z |  |
| 2 | 01 | deviation | apps/mobile/lib/features/submission/domain/form_field.dart |  | FormDefinition.fromJson casts json['schema'] directly to a Map, but the backend returns schema/uiSchema as JSON-encoded strings - likely throws at runtime against a live backend; discovered during Plan 07 live verification, not fixed (mobile out of scope) | fixed |  | 2026-08-01T19:23:47.191Z | 2026-08-02T05:58:45.824Z |
| 3 | 01 | deviation | apps/mobile/lib/features/submission/domain/submission.dart | 27 | Submission.fromJson casts json['formData'] directly to a Map, but the backend SubmissionResponseDto declares formData as String - same wire-contract mismatch as item 2, throws a Dart TypeError at runtime. Confirmed independently during phase 01 verification; invisible to mobile tests because FakeSubmissionDatasource returns the wrong (Map) shape | fixed |  | 2026-08-01T21:55:00.000Z | 2026-08-02T05:58:45.973Z |
| 4 | 01 | deviation | apps/mobile/lib/features/submission/data/submission_remote_datasource.dart | 33 | submit() sent formData as a nested JSON object in the POST body, but SubmissionRequestDto.formData is a String column - Jackson would reject it (MismatchedInputException). Symmetric send-side counterpart to items 2/3 (receive-side). Discovered and fixed alongside them. | fixed |  | 2026-08-02T05:58:45.676Z | 2026-08-02T05:58:46.122Z |

````json
[
  {
    "id": 1,
    "kind": "stub",
    "phase": "01",
    "file": "apps/citizen-web/src/features/submission/components/AddressAutocomplete.tsx",
    "line": null,
    "description": "RUIAN AddressAutocomplete built + unit-tested but not wired into a live form (no current form schema declares ui:widget: address)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-01T19:23:47.019Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "01",
    "file": "apps/mobile/lib/features/submission/domain/form_field.dart",
    "line": null,
    "description": "FormDefinition.fromJson casts json['schema'] directly to a Map, but the backend returns schema/uiSchema as JSON-encoded strings - likely throws at runtime against a live backend; discovered during Plan 07 live verification, not fixed (mobile out of scope)",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-01T19:23:47.191Z",
    "resolved_at": "2026-08-02T05:58:45.824Z"
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "01",
    "file": "apps/mobile/lib/features/submission/domain/submission.dart",
    "line": 27,
    "description": "Submission.fromJson casts json['formData'] directly to a Map, but the backend SubmissionResponseDto declares formData as String - same wire-contract mismatch as item 2, throws a Dart TypeError at runtime. Confirmed independently during phase 01 verification; invisible to mobile tests because FakeSubmissionDatasource returns the wrong (Map) shape",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-01T21:55:00.000Z",
    "resolved_at": "2026-08-02T05:58:45.973Z"
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "01",
    "file": "apps/mobile/lib/features/submission/data/submission_remote_datasource.dart",
    "line": 33,
    "description": "submit() sent formData as a nested JSON object in the POST body, but SubmissionRequestDto.formData is a String column - Jackson would reject it (MismatchedInputException). Symmetric send-side counterpart to items 2/3 (receive-side). Discovered and fixed alongside them.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-02T05:58:45.676Z",
    "resolved_at": "2026-08-02T05:58:46.122Z"
  }
]
````
