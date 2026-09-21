# RFC 002 — Visual system and navigation

## Design

An owner companion with warm off-white backgrounds, white cards, a deep green action color, dark green-gray text, and small species illustrations. Amber and red indicate urgency or deletion. Every status has a text label.

Astryx supplies buttons, badges, fields, selectors, dates, dialogs, toast announcements, and the sidebar container. The app uses a Next.js LinkProvider, a compiled Novellia theme, and Tailwind CSS v4 utilities for application layout and styling. This supersedes the original CSS Modules decision.

`src/theme/novellia.ts` extends Astryx's neutral theme and owns the brand values. Astryx's `tailwind-theme.css` bridge maps its tokens to utilities such as `bg-surface`, `text-primary`, `border-border`, and `rounded-lg`. The small `@theme inline` block in `globals.css` maps additional pet-avatar and decorative colors to the same theme source. Components retain Astryx's variants and behavior. Layout, responsive changes, state styling, and application decoration use literal Tailwind classes in JSX.

Run `npm run theme:build` after changing theme values during development. Installation, development startup, and production builds generate the SSR-ready theme automatically. Generated theme artifacts are ignored by Git. Global CSS contains imports, token mappings, and base accessibility rules; no component stylesheets or inline style objects are required.

## Shell and responsive layout

Desktop: fixed 224px sidebar; brand at top; Overview, Pets, Records, Follow-ups, Providers navigation; shared-demo notice at bottom. Main content has a quiet top line, page title, primary action, and footer.

Mobile below 768px: compact brand header, full-width content with 18px side gutters, and fixed five-item bottom navigation. Forms and detail columns stack. Cards use three/two/one columns as width decreases.

Full pages handle creation, editing, and record details. Alert dialogs handle delete/discard/type-change confirmation. A small dialog selects a pet when adding a record from a global screen. Provider creation and editing use a dialog that preserves the parent record form. Record overflow actions use an anchored Astryx DropdownMenu. All editable calendar dates use the shared Astryx picker with YYYY-MM-DD before, during, and after focus. Calendar-date summaries include the year. Astryx TimeInput uses 12-hour clinic time; appointment previews and saved displays pair browser-local and clinic times. Metadata timestamps use LocalTimestamp; compact completion labels currently omit the year.

## Screen map

| URL                                 | Content                                            |
| ----------------------------------- | -------------------------------------------------- |
| /                                   | Overview, attention items, pets, recent history    |
| /pets                               | Searchable pet-card directory                      |
| /pets/new                           | Add pet form                                       |
| /pets/:petId                        | Identity, profile details, next follow-up, history |
| /pets/:petId/edit                   | Profile form and delete section                    |
| /records                            | Global filtered records; desktop table/mobile list |
| /pets/:petId/records/new            | Typed record form                                  |
| /pets/:petId/records/:recordId      | Record details and follow-up                       |
| /pets/:petId/records/:recordId/edit | Edit the same record type                          |
| /follow-ups                         | Open/completed tasks, grouped by date              |

Provider management lives at `/providers` and `/providers/:providerId`; see RFC 009.

## Interaction contract

Labels remain associated with controls. Field errors appear beside fields; the first erroneous control receives focus. Saving disables repeated submission. Failed saves retain values and show a persistent error. Success produces an Astryx toast.

Dirty forms intercept ordinary same-origin application links and Cancel through an AlertDialog. Refresh/tab close uses beforeunload. Browser Back is not intercepted by a custom history system. Saved navigation bypasses the dirty guard.

Loading uses structural skeletons. Missing pages offer a route back to Pets. Failed page loads offer Retry. A skip link, visible keyboard focus, and semantic landmarks support keyboard navigation.

## Verification

Playwright exercises form validation/focus, dialogs, failed saves, and mobile navigation. Viewport checks cover 375px, 768px, and 1440px. axe checks WCAG A/AA rules; it supplements rather than replaces manual keyboard and visual review.
