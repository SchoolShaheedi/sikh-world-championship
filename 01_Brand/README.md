# 01_Brand

Brand source material. The *authored* assets live here; the *shipped* copies live in
`03_App/web/public/brand/` because that is where the app serves them from.

What belongs here:

- Logo masters — the layered original (`.ai`, `.svg`, `.afdesign`), not just the export
- Colour palette and typography specification
- The 3D logo source (`.blend` / `.glb` working file) — the built `.glb` is already in
  `03_App/web/public/brand/swc-logo-3d.glb`
- Avatar illustration masters — see decision 18 in `DECISIONS.md`: ~12–16 Sikh-coded
  illustrated avatars, different dastaar colours and styles, patka for younger players

Outstanding brand work is tracked in `DECISIONS.md` rounds 20–21 ("Still needed",
"Outstanding on the artwork").

> Large binaries (layered masters, `.blend`, video) do not belong in git. Keep them in
> shared storage and note the link here. Only commit the small, final exports the app
> actually serves.
