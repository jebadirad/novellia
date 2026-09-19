# RFC 005 — Search and filtering

## Surfaces

Pets: search name/breed and select species.

Global Records: search title/notes/provider, pet selector, record-type selector, inclusive from/to dates, newest/oldest ordering. Results use a semantic table on desktop and stacked record rows below 768px.

Pet history: the same record controls except pet is fixed by the route.

Follow-ups: pet selector and open/completed navigation; dashboard links can additionally scope overdue or due-within-30-days.

## URL contract

Pets supports q, species, page.
Records supports q, petId, type, from, to, sort, page.
Follow-ups supports petId, tab=open|completed, group=overdue|due.

Defaults: empty text, no selected filters, page 1, newest records, open follow-ups. Empty query values are removed. API query validation rejects invalid UUIDs, types, dates, page numbers, and reversed date intervals. Pages show errors before querying.

Text input debounces for 300ms and replaces history. Select/date changes push navigation. Changing a filter resets page. Browser reload/back restores controls from the URL. Clear filters returns to the bare route.

## Matching and ordering

Case-insensitive PostgreSQL contains searches. Filters combine with AND; text alternatives within one entity combine with OR. JSON details are deliberately excluded and placeholders name the supported fields.

Records order by event date, creation time, then stable ID. Pets order by name then ID. Pagination uses 20 records and returns total, page, and pageSize.

The client keeps an invalid date interval visible with an inline explanation but does not submit that interval. Direct malformed URLs show the same error class.

## Acceptance

Combined filters narrow correctly, date boundaries are inclusive, pages do not overlap, empty results are distinct from no data, and no pet-scoped query returns another pet's records.
