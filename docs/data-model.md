# Data Model

## Record shape
| Field | Type | Constraints |
|-------|------|-------------|
| id | string | format `rec_0001`, unique, auto-generated |
| description | string | required, 3–100 characters, no leading or trailing spaces |
| amount | number | required, ≥ 0, maximum 2 decimal places |
| category | string | required, letters, spaces, and hyphens only |
| date | string | required, format `YYYY-MM-DD` |
| createdAt | string | ISO 8601 timestamp, set when record is created |
| updatedAt | string | ISO 8601 timestamp, updated whenever record is edited |

> Note: `description` is additionally checked for duplicate consecutive words
> using the advanced back-reference regex `\b(\w+)\s+\1\b`. The full regex
> catalog lives in the README.

## Example record
```json
{
  "id": "rec_0001",
  "description": "Coffee at Cafe",
  "amount": 4.50,
  "category": "Food and Dining",
  "date": "2026-06-11",
  "createdAt": "2026-06-11T09:30:00Z",
  "updatedAt": "2026-06-11T09:30:00Z"
}
```

## Persistence
- Storage key: `finance-tracker-records`
- Stored as: Single JSON array of record objects in Local Storage
- Import validation:
  - File must be valid JSON
  - Must contain an array
  - Each record must include all required fields
  - IDs must be unique
  - Amount must be a valid non-negative number
  - Date must match `YYYY-MM-DD`
  - createdAt and updatedAt must be valid ISO timestamps