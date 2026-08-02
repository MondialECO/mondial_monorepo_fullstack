import { API_ORIGIN } from '@/lib/api-config';
import type { WorkroomFile } from '@/types/workroom';

/**
 * `WorkroomFileStatus.Ready` — index 3 in
 * `backend/Models/DatabaseModels/Workroom.cs:14`
 * (Selected, Uploading, Scanning, Ready, Failed, Archived, Restricted).
 *
 * The numeric form is what actually arrives: `WorkroomDetailResponse.Files` is
 * `List<WorkroomFile>`, the raw BSON model, so its enum serialises as an integer rather
 * than a name. `status === 'Ready'` is therefore never true at runtime — the same defect
 * fixed for ContractTerms in 0fb0739. Both forms are accepted so this keeps working if
 * the wire format is corrected later.
 */
const READY_ORDINAL = 3;
const FILE_STATUS = [
  'Selected',
  'Uploading',
  'Scanning',
  'Ready',
  'Failed',
  'Archived',
  'Restricted',
] as const;

/** Display label for a file status, tolerating the integer the API actually sends. */
export function workroomFileStatusLabel(status: string | number): string {
  if (typeof status === 'number') return FILE_STATUS[status] ?? 'Unknown';
  const index = Number(status);
  if (status.length > 0 && Number.isInteger(index)) return FILE_STATUS[index] ?? 'Unknown';
  return status || 'Unknown';
}

/**
 * Only completed, scanned files are offered for download. Anything still uploading or
 * scanning is incomplete, and Failed/Restricted files are withheld deliberately.
 */
export function isFileDownloadable(
  file: Pick<WorkroomFile, 'status' | 'storagePath'>
): boolean {
  if (!file.storagePath) return false;
  return file.status === READY_ORDINAL || file.status === 'Ready';
}

/**
 * Direct link to the stored file.
 *
 * `storagePath` is a server-root-relative path such as
 * `/uploads/documents/{guid}.docx`, served by `app.UseStaticFiles()`
 * (`backend/Program.cs:660`). API_ORIGIN is API_BASE_URL without the trailing `/api`,
 * which api-config already designates for resolving relative media paths.
 *
 * SECURITY DEBT: this URL is unauthenticated. Anyone holding a storagePath can fetch the
 * file, including one marked providerPrivate. Deliberate Path A tradeoff — see the file
 * download security debt entry in canon §10.9.
 */
export function workroomFileDownloadUrl(file: Pick<WorkroomFile, 'storagePath'>): string {
  const path = file.storagePath.startsWith('/') ? file.storagePath : `/${file.storagePath}`;
  return `${API_ORIGIN}${path}`;
}
