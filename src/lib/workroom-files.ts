import api from '@/lib/axios';
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
 * Fetches a workroom file and hands it to the browser as a download.
 *
 * Goes through the shared axios instance so the Authorization header and the
 * token-refresh interceptor apply — the endpoint is authenticated, and a plain anchor
 * href cannot carry a bearer token. The server re-checks participation, the
 * ProviderPrivate flag and Ready status; isFileDownloadable() only decides whether to
 * offer the control.
 *
 * Throws on failure so each panel can surface it in its own idiom.
 */
export async function downloadWorkroomFile(
  file: Pick<WorkroomFile, 'id' | 'originalName'>
): Promise<void> {
  const response = await api.get<Blob>(`/workroom/files/${file.id}/download`, {
    responseType: 'blob',
  });

  // Object URLs are leaked if not revoked, so the anchor is created, clicked and torn
  // down synchronously rather than left in the document.
  const objectUrl = URL.createObjectURL(response.data);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = file.originalName || 'download';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
