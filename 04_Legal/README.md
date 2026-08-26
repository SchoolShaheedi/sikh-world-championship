# 04_Legal

**Nothing in here yet, and that is the biggest gap in the project.**

The app already collects guardian contact details and children's medical notes, and
event 1 is open to ages 8+. Under UK GDPR, children's personal data is a special case
and the paperwork below is a legal requirement before the site takes a single real
registration — not a nice-to-have for later.

## Required before launch

- [ ] **Privacy notice** — what is collected, why, how long it is kept, who sees it.
      Must be written in language a child can read, not just a parent (ICO Children's
      Code, standard 4). This is the page the sign-up form has to link to.
- [ ] **DPIA** (Data Protection Impact Assessment) — mandatory when processing
      children's data at scale. Document it once, update it per event.
- [ ] **Retention and deletion policy** — how long registrations, guardian approvals,
      chat reports and moderation records are kept, and who deletes them.
      `00_Docs/DATA-LAYER.md` describes the store; this decides its lifespan.
- [ ] **Safeguarding policy** — the published version of what `/safeguarding` promises.
      That page currently names "TBC" as the safeguarding lead (`DECISIONS.md` round 22).
- [ ] **ICO registration** — the organisation likely needs to register as a data
      controller and pay the annual fee.
- [ ] **DBS checks** for the safeguarding lead, the named moderators and any volunteer
      with unsupervised access to children. These take weeks — `00_Docs/NEXT-STEPS.md`
      flags starting them early.
- [ ] **Public liability insurance** for the venue and the event day.
- [ ] **Terms of use** and the moderation/reporting policy the app links to.
- [ ] **Photography and filming consent** — separate from registration consent, and
      genuinely optional (decision 18 made the player photo optional for this reason).

## Why the code cannot wait for this

`/safeguarding` makes public promises — guardian notification, a 24h report response,
named moderators. `00_Docs/NEXT-STEPS.md` records that `src/lib/notify.ts` still only
logs, so the guardian-notification promise is not yet true in code. A published promise
the software does not keep is a safeguarding failure and a legal exposure at the same
time.
