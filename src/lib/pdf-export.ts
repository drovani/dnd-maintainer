/**
 * PDF export pipeline: load a fillable template, write the semantic field values
 * produced by {@link buildFieldValues} into it, and trigger a browser download.
 *
 * Failure modes are surfaced loudly, never silently:
 *  - a missing/unfetchable template throws {@link PdfTemplateError};
 *  - any mapped field name absent from (or type-mismatched in) the template is
 *    collected and returned as `missingFields` so the caller can tell the user
 *    their template's field names don't match the binding map.
 */
import { PDFDocument } from 'pdf-lib';
import type { Character } from '@/types/database';
import type { ResolvedCharacter } from '@/types/resolved';
import type { SourceTag } from '@/types/sources';
import {
  buildFieldValues,
  characterDisplayName,
  CHECK_FIELD_NAMES,
  TEXT_FIELD_NAMES,
  type GamedataT,
} from '@/lib/pdf-field-map';

export class PdfTemplateError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'PdfTemplateError';
  }
}

export interface FillResult {
  readonly bytes: Uint8Array;
  /** PDF field names that were mapped but not present/fillable in the template. */
  readonly missingFields: readonly string[];
}

/**
 * Fill `templateBytes` with the character's values. Pure w.r.t. the DOM — returns
 * the filled PDF bytes plus the list of mapped fields the template lacked.
 */
export async function fillCharacterPdf(
  templateBytes: ArrayBuffer | Uint8Array,
  resolved: ResolvedCharacter,
  character: Character,
  t: GamedataT,
  featSources: ReadonlyMap<string, SourceTag>
): Promise<FillResult> {
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(templateBytes);
  } catch (err) {
    throw new PdfTemplateError('The supplied PDF could not be parsed as a fillable form.', err);
  }

  const form = pdfDoc.getForm();
  const existing = new Set(form.getFields().map((f) => f.getName()));
  const values = buildFieldValues(resolved, character, t, featSources);
  const missingFields: string[] = [];

  for (const [semanticKey, value] of Object.entries(values.text)) {
    const fieldName = TEXT_FIELD_NAMES[semanticKey];
    if (!fieldName) continue;
    if (!existing.has(fieldName)) {
      missingFields.push(fieldName);
      continue;
    }
    try {
      form.getTextField(fieldName).setText(value);
    } catch {
      missingFields.push(fieldName);
    }
  }

  for (const [semanticKey, checked] of Object.entries(values.checks)) {
    const fieldName = CHECK_FIELD_NAMES[semanticKey];
    if (!fieldName) continue;
    if (!existing.has(fieldName)) {
      missingFields.push(fieldName);
      continue;
    }
    try {
      const box = form.getCheckBox(fieldName);
      if (checked) box.check();
      else box.uncheck();
    } catch {
      missingFields.push(fieldName);
    }
  }

  const bytes = await pdfDoc.save();
  return { bytes, missingFields };
}

/** Trigger a browser download of `bytes` as `filename`. */
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export interface ExportOptions {
  /** URL of the fillable template. Defaults to the bundled asset path. */
  readonly templateUrl?: string;
  /** Override the download filename (without extension). Defaults to the character name. */
  readonly filename?: string;
}

const DEFAULT_TEMPLATE_URL = '/assets/character-sheet.pdf';

/**
 * Fetch the template, fill it, and download the result. Returns the list of mapped
 * fields the template lacked (empty = a clean fill). Throws {@link PdfTemplateError}
 * if the template can't be fetched (e.g. the user hasn't supplied one).
 */
export async function exportCharacterPdf(
  resolved: ResolvedCharacter,
  character: Character,
  t: GamedataT,
  featSources: ReadonlyMap<string, SourceTag>,
  opts: ExportOptions = {}
): Promise<{ missingFields: readonly string[] }> {
  const templateUrl = opts.templateUrl ?? DEFAULT_TEMPLATE_URL;

  let response: Response;
  try {
    response = await fetch(templateUrl);
  } catch (err) {
    throw new PdfTemplateError(`Could not load the PDF template from ${templateUrl}.`, err);
  }
  if (!response.ok) {
    throw new PdfTemplateError(`No PDF template found at ${templateUrl} (HTTP ${response.status}).`);
  }

  const templateBytes = await response.arrayBuffer();
  const { bytes, missingFields } = await fillCharacterPdf(templateBytes, resolved, character, t, featSources);
  downloadPdf(bytes, `${opts.filename ?? characterDisplayName(character)}.pdf`);
  return { missingFields };
}
