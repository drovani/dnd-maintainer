# Character-sheet PDF template

The **Export PDF** button on a character sheet fills a fillable PDF and downloads it.
The blank template is **not bundled** with this project because the official Wizards of
the Coast character sheet is copyrighted and cannot be redistributed here.

## To enable PDF export

1. Obtain a **form-fillable** D&D character-sheet PDF (e.g. the official WotC fillable
   sheet, or a community form such as MorePurpleMoreBetter's).
2. Save it in this folder as:

   ```
   public/assets/character-sheet.pdf
   ```

   Vite serves it at `/assets/character-sheet.pdf`, which is the default the export
   pipeline fetches (`src/lib/pdf-export.ts`).

3. The field-name binding in `src/lib/pdf-field-map.ts` (`TEXT_FIELD_NAMES` /
   `CHECK_FIELD_NAMES`) targets the **2014 WotC fillable form** field names. No stable
   2024 fillable form with documented field names is publicly distributed, so the 2024
   concepts that the 2014 sheet has no field for (Heroic Inspiration, Exhaustion level,
   Weapon Mastery, Origin Feat) are folded into the **Features & Traits** text block.

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
