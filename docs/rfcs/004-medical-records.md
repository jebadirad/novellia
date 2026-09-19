# RFC 004 — Medical records and extension

## Purpose

Capture enough structured information to make history useful while keeping a new record type inexpensive to add during review.

## Initial types

| Type        | Required details        | Optional details                      |
| ----------- | ----------------------- | ------------------------------------- |
| vet_visit   | reason, max 500         | assessment, max 2,000                 |
| vaccination | vaccineName, max 120    | lotNumber, max 80                     |
| medication  | medicationName, max 120 | dose/frequency, max 120 each; endDate |

Medication dose and frequency are owner-entered text. No dosing interpretation is performed. endDate cannot precede occurredOn. Medication's date label is “Prescribed on”.

All types share the RFC 001 columns. JSON details use strict Zod objects. An unknown type or unexpected detail property is rejected.

## Form

```text
Pet / Add record
[Vet visit] [Vaccination] [Medication]

Record information
 Title
 Event date | Vet or clinic

Type-specific details
 Required and optional fields
 Additional notes

[ ] Add a follow-up
 Due date
 What needs to happen?

                         [Cancel] [Save record]
```

Pet identity is fixed from the route. Type choice switches explicit field components. If any type-specific value was entered, changing type requires confirmation; common fields remain. A saved record's type is fixed. Date defaults to the current app day. Optional follow-up controls appear when enabled, and enabling follow-up requires choosing a date.

## Detail

Breadcrumbs identify the pet and record. A type badge, title, event date, Edit action, and overflow delete disclosure appear at top. The main panel shows pet, provider, event date, and labeled type-specific details. Notes preserve line breaks. A side panel shows the follow-up and complete/reopen action, or a link to edit and add one. Mobile stacks panels.

Deletion names the record and removes its follow-up. Editing returns to detail; deletion returns to the pet profile.

## Interfaces

GET /api/records searches across pets. GET/POST /api/pets/:petId/records lists or creates within one pet. GET/PATCH/DELETE /api/pets/:petId/records/:recordId handles one record. Parent scope is checked before returning data.

DTOs include the parent pet for global lists. Dates are YYYY-MM-DD; metadata timestamps are ISO strings. Server-assigned IDs, timestamps, detailsVersion, and completion timestamps are not accepted as general form input.

## Extension mechanism

- Add a strict details schema and discriminated-union option in the domain schema module.
- Add metadata: label, date label, example title, description.
- Add an explicit field component and register it in the exhaustive field map.
- Add an explicit detail renderer and exhaustive switch case.
- Add the record-type icon and validation/integration examples.

The record type union and filter options derive from the validation union. Domain schemas never import React. The UI maps use satisfies to require coverage. Generic CRUD services do not switch on each record type; schema validation supplies the contract.

A new lab_result type normally needs no database migration. Changing the structure of an existing stored type is different: use detailsVersion and a deliberate data migration/reader change.

## Tradeoff and acceptance

JSON details support simple extension but are not globally searched or indexed for reporting. Important shared fields remain relational.

Verify all three types through create, view, edit, delete; preserve common fields on type changes; reject invalid details; reject cross-pet record IDs; preserve user input when a request fails.
