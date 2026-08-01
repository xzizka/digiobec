---
schema_version: 1
open_count: 2
waived_count: 0
fixed_count: 0
total_count: 2
last_updated: 2026-08-01T19:23:47.191Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | stub | apps/citizen-web/src/features/submission/components/AddressAutocomplete.tsx |  | RUIAN AddressAutocomplete built + unit-tested but not wired into a live form (no current form schema declares ui:widget: address) | open |  | 2026-08-01T19:23:47.019Z |  |
| 2 | 01 | deviation | apps/mobile/lib/features/submission/domain/form_field.dart |  | FormDefinition.fromJson casts json['schema'] directly to a Map, but the backend returns schema/uiSchema as JSON-encoded strings - likely throws at runtime against a live backend; discovered during Plan 07 live verification, not fixed (mobile out of scope) | open |  | 2026-08-01T19:23:47.191Z |  |

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
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-01T19:23:47.191Z",
    "resolved_at": null
  }
]
````
