# RFC 009 — Reusable care providers

## Purpose

Select a saved vet or clinic instead of retyping its name on each record. This supersedes the free-text provider field in RFCs 001, 004, and 005. Providers belong to the shared demo workspace. Pets may visit multiple providers; there is no primary-provider field on a pet in this version.

## Data model

`CareProvider` has many `MedicalRecord` rows through nullable `providerId`.

| Field                       | Rule                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| id                          | Server-generated UUID, immutable                                                |
| name                        | Required, 1–120 characters; trim and collapse whitespace                        |
| normalizedName              | Unique lowercase name with collapsed whitespace; server-managed                 |
| kind                        | `clinic` or `vet`, defaults to clinic                                           |
| phone                       | Optional U.S. phone; area code required, normalized display, optional extension |
| addressLine1 / addressLine2 | Optional text, maximum 500 / 120 characters                                     |
| city / state / zip          | Optional city (100), U.S. state code, five-digit ZIP or ZIP+4                   |
| notes                       | Optional plain text, maximum 2,000 characters                                   |
| archivedAt                  | Nullable server timestamp                                                       |
| createdAt / updatedAt       | Server-managed timezone-aware timestamps                                        |

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

Providers appear in desktop navigation and the five-item mobile navigation. There is no external clinic directory or outbound communication. Address suggestions use Photon; contact fields remain owner-editable.

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

## U.S. contact validation and address suggestions

Phone is optional. When entered it needs a ten-digit U.S. shape, including area code; familiar punctuation, optional `+1`, and a one-to-six-digit extension are accepted. It normalizes on blur and save to `(480) 555-0100 ext. 23`. This checks shape, not whether a number is assigned. Legacy phone values remain readable; updating a provider requires correcting or clearing an invalid phone.

Address fields are individually optional so owners can record partial information. State comes from a U.S. state/territory/military-mail selector. ZIP accepts five digits or ZIP+4, retains leading zeros, and formats nine digits with a hyphen. Validation runs in the browser and again at the API boundary; errors appear by fields and focus remains inside the provider dialog.

The optional **Find a U.S. address** Typeahead uses [Photon's public demo API](https://github.com/komoot/photon#photon), which needs no signup or API key. Requests go through `/api/address-suggestions?q=...`, wait until four characters and 500ms idle, request at most five U.S. results, and cache upstream responses for 24 hours. The server uses a five-second timeout. Client cancellation and Astryx's search handling prevent stale suggestions from replacing a newer query.

Suggestions fill addressLine1, city, state, and ZIP. Suite/unit is always manual and is preserved. The adapter maps state names to codes, removes duplicate display addresses, excludes non-U.S. and non-street results, and leaves unavailable parts blank instead of guessing. The user reviews street numbers and fields before saving. Attribution links identify Photon and OpenStreetMap. A lookup failure or no results never blocks manual entry or saving.

The [Photon API documentation](https://github.com/komoot/photon/blob/master/docs/api-v1.md) specifies country filtering and structured response fields. Its shared server permits reasonable use but offers no availability guarantee and may throttle traffic. This is suitable for the small interview demo, not a promise of an unlimited production service; growing usage should move to a hosted or self-managed instance. The adapter keeps that future change independent of the database model.

Migration `20260920220000_structured_provider_addresses` renames the old address column to addressLine1 without altering its text and adds the remaining nullable columns. Existing free-text addresses are not heuristically split or sent to an external service. Record/provider relationships are unchanged.
