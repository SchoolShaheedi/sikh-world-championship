# 02_Events

One folder per event, for the **operational paperwork** — the things a volunteer or
venue needs, not the things the app renders.

The event *itself* is code-adjacent data, not a document: it lives in
`03_App/web/src/data/events/<slug>.ts`. Adding an event to the site means adding a file
there and registering it in `index.ts` — see `00_Docs/NEXT-STEPS.md`, "Adding a second
event". This folder is for everything around that.

Folder name = the event slug used in the app and the URL, so
`02_Events/sikh-fifa-26/` matches `/events/sikh-fifa-26`.

Suggested contents per event: `Rules/`, `Marketing/`, `Brackets/`, `Registrations/`,
plus venue contracts and the run-of-day sheet.

Note: `3_Sikh_Chess_Championship` is deliberately **not** an SWC event and does not
belong here — see the note at the top of the root `README.md`.
