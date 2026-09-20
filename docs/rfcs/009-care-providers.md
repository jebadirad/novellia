# RFC 009 — Reusable care providers

## Purpose

Select a saved vet or clinic instead of retyping its name on each record. This supersedes the free-text provider field in RFCs 001, 004, and 005. Providers belong to the shared demo workspace. Pets may visit multiple providers; there is no primary-provider field on a pet in this version.

## Data model

`CareProvider` has many `MedicalRecord` rows through nullable `providerId`.

| Field                 | Rule                                                            |
| --------------------- | --------------------------------------------------------------- |
| id                    | Server-generated UUID, immutable                                |
| name                  | Required, 1–120 characters; trim and collapse whitespace        |
| normalizedName        | Unique lowercase name with collapsed whitespace; server-managed |
| kind                  | `clinic` or `vet`, defaults to clinic                           |
| phone                 | Optional text, maximum 80 characters                            |
| address               | Optional text, maximum 500 characters                           |
| notes                 | Optional plain text, maximum 2,000 characters                   |
| archivedAt            | Nullable server timestamp                                       |
| createdAt / updatedAt | Server-managed timezone-aware timestamps                        |

MedicalRecord's providerId is indexed. Its foreign key uses **ON DELETE RESTRICT**, never cascade. Database protection also handles deletion racing with a new record link. Record assignment locks the provider row until commit, preventing assignment from racing with archive. An existing record may retain its archived provider while unrelated fields are edited, but a new link must select an active provider.

## Record form

Astryx Typeahead searches active provider names and shows choices on focus. The selected item is a provider ID, never free text. The optional selection can be cleared.

“Add new provider” opens an Astryx dialog with the search text prefilled. Saving creates the provider, selects it, and preserves every record field. Cancel leaves the record untouched; modified provider forms ask before discarding. Provider and record forms are DOM siblings because Astryx Dialog renders in place; nesting HTML forms would cause accidental native submission.

The dialog offers existing entries when names match exactly, ignoring case and extra spaces. The unique database constraint also rejects concurrent duplicates with HTTP 409. Related name fragments show possible matches without automatically merging them. Different locations should include the location in their name. An archived exact match offers an explicit “Restore and select” action.

## Provider management

- `/providers`: name search, Active/Archived selector, record counts, and Add provider. The small shared-demo directory is loaded server-side and filtered locally.
- `/providers/:providerId`: contact information, notes, linked-record count, Edit, Archive/Restore, and a link to provider-filtered records.
- Editing uses the same dialog and updates shared information across every linked record.
- Archiving asks for confirmation and preserves all linked records and historical names. Restore makes the provider selectable again.
- Permanent deletion is shown only at zero linked records, requires confirmation, and is enforced by the database even if the page becomes stale.
- Record details link to the provider and label archived entries. Record search matches the related provider name. `/records?providerId=...` filters by ID, so renaming does not break discovery.

Providers appear in desktop navigation and the five-item mobile navigation. Contact information is plain text; there is no external clinic directory, geocoding, or outbound communication.

## API

| Method | URL                                  | Behavior                                                        |
| ------ | ------------------------------------ | --------------------------------------------------------------- |
| GET    | `/api/providers?q=...&status=active` | Sorted list; status also accepts archived/all                   |
| POST   | `/api/providers`                     | Validate and create; 201                                        |
| GET    | `/api/providers/:id`                 | Provider and live record count                                  |
| PATCH  | `/api/providers/:id`                 | Update editable fields; timestamps and normalized name rejected |
| PATCH  | `/api/providers/:id/archive`         | Explicit `{ archived: boolean }`, idempotent                    |
| DELETE | `/api/providers/:id`                 | 204 if unused; 409 if linked                                    |

Record writes accept optional `providerId`; old free-text `provider` input is rejected. Record reads include providerId and related provider details. Invalid or newly archived selections receive a providerId field error (422). Malformed queries return 400 and missing IDs return 404.

## Migration and seed

The committed migrations group existing nonblank provider names by their normalized name, create providers, and link every record before removing the text column. Historical entries default to Clinic because free-text data cannot reliably identify an individual vet. The correction migration gives deterministic imported IDs valid custom UUID version/variant bits and cascades those ID updates to record links.

Apply all committed migrations before releasing the application. No seeding or resets run during the build. Local verification compares every record ID and normalized provider name before and after migration. The seed uses matching stable IDs, preserves edited provider names, and does not overwrite contact information. The explicit demo reset deletes records/pets before providers in one transaction.

## Verification and tradeoffs

Validation tests cover normalization, limits, managed fields, and record IDs. PostgreSQL tests cover duplicate protection, rename/search, archive/restore, historical edits, invalid assignment, restrictive foreign keys, and seed preservation. Browser tests cover inline creation, failed-save preservation, cancel/discard, keyboard selection, duplicate suggestions, mobile provider management, and deletion protection.

Exact normalized names are unique across active and archived entries. This intentionally favors reuse; branches need distinct names. Provider names are shared current data, not immutable clinical snapshots. The provider directory is unpaginated for the small demo dataset; larger workspaces should use paginated server search. Future authentication must scope providers and uniqueness to an owner/workspace, and enforce the same scope on every record assignment.
