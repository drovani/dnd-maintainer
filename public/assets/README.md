# Character-sheet PDF template

The **Export PDF** button on a character sheet fills a fillable PDF and downloads it.
The blank template is **not bundled** with this project because the official Wizards of
the Coast character sheet is copyrighted and cannot be redistributed here.

## To enable PDF export

1. Obtain the **official 2024 WotC form-fillable** character sheet (© 2024 Wizards of the
   Coast, the one distributed with the 2024 Player's Handbook).
2. Save it in this folder as:

   ```
   public/assets/character-sheet.pdf
   ```

   Vite serves it at `/assets/character-sheet.pdf`, which is the default the export
   pipeline fetches (`src/lib/pdf-export.ts`).

3. The field-name binding in `src/lib/pdf-field-map.ts` (`TEXT_FIELD_NAMES` /
   `CHECK_FIELD_NAMES`) targets the **official 2024 WotC sheet**. That sheet ships with
   auto-generated, semantically-opaque field names (`Text1`, `Check Box37`, …), so the
   binding values look meaningless on their own — each line carries a `// → label` comment
   recording which cell it fills. The map covers the page-1 statblock (identity, abilities,
   saves, skills, combat, attacks, class features / species traits / feats, proficiencies)
   and the page-2 header (spellcasting stats, appearance, backstory, languages, equipment,
   alignment). 2024 concepts with no dedicated field (Exhaustion, Weapon Mastery) are folded
   into the Class Features block.

> The map is keyed to the official 2024 sheet's exact field names. A _different_ fillable
> form (2014 WotC, MPMB, other community sheets) uses a different naming scheme and will not
> fill — see the next section.

## If the exported PDF comes out blank

Your template's field names differ from the binding map. Discover the real names and
adjust `TEXT_FIELD_NAMES` / `CHECK_FIELD_NAMES`:

```js
import { PDFDocument } from 'pdf-lib';
const doc = await PDFDocument.load(await fetch('/assets/character-sheet.pdf').then((r) => r.arrayBuffer()));
console.log(
  doc
    .getForm()
    .getFields()
    .map((f) => f.getName())
);
```

The export already reports (via a toast + console warning) any mapped field that is
absent from your template, so a mismatch never fails silently.

> **Note:** `*.pdf` in this folder is git-ignored so a copyrighted template you drop
> here is never committed.
