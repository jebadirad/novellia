# RFC 003 — Pet management

## Directory

Heading: “Your companions”, descriptive text, Add pet action. Below it are a name/breed search and species filter, then pet cards.

Each card contains a species icon and initial, species tag, linked name, breed, calculated age, sex, record count, and earliest incomplete follow-up. There are no uploaded images or external image dependencies.

Ordering is name then ID, ascending. Twenty items per page. Unknown birth dates display “Age unknown”. No pets invites creation; no matches invites clearing filters.

## Add and edit

Form sections: name/species, breed, birth-date-known toggle and date, sex, notes. Only name/species are required. Sex defaults to unknown. Turning on “Birth date unknown” clears the date.

Saving creates or updates via the pet endpoint and navigates to the profile. Cancel returns to Pets for creation or the profile for editing. Validation, unsaved-change protection, and pending/error states follow RFC 002.

## Profile

```text
Pets / Luna
[Avatar] Luna                      [Edit pet] [Add record]
Dog · Golden Retriever · 4 years

[About Luna]        [Next follow-up]
 Species             Date, record link, completion action
 Breed              [Medical history]
 Birthday            Search, type, date bounds, sort
 Sex                 Chronological records
 Notes               Pagination
```

Desktop places About in a narrow left column and history in the main column. Mobile stacks the sections. Optional missing details show “Not recorded”. A pet with no records gets an “Add first medical record” call to action.

## Delete

The edit page contains a separate delete section. The confirmation names the pet and current record count and explains that records/follow-ups are also deleted. The database cascade is atomic; redirect to Pets after success.

## Endpoints

GET/POST /api/pets; GET/PATCH/DELETE /api/pets/:petId. GET directory includes counts and earliest open follow-up. Input and persistence definitions are in RFC 001.

## Acceptance

Names need not be unique. Unknown birth date is preserved. Search combines with species. Changes survive refresh. Deleting a pet leaves other pets and their records untouched.
