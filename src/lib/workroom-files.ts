import api from '@/lib/axios';
import type { WorkroomFile } from '@/types/workroom';

/**
 * Only completed, scanned files are offered for download. Anything still uploading or
 * scanning is incomplete, and Failed/Restricted files are withheld deliberately.
 *
 * The ordinal tolerance this used to carry is gone: WorkroomFileStatus serialises as its
 * name since f673521, so `status` is a real enum name and the numeric form can no longer
 * occur. This is a UI affordance check only — the download endpoint re-checks Ready
 * server-side, so bypassing the UI does not reach a Scanning or Restricted file.
 *
 * The storagePath test that used to accompany this is gone with the field, which is now
 * server-internal. Nothing is lost: UploadFileAsync assigns the path and Ready in the same
 * statement, so Ready never exists without one, and WorkroomFileAccess still rejects a
 * Ready record with a blank path server-side.
 */
export function isFileDownloadable(file: Pick<WorkroomFile, 'status'>): boolean {
  return file.status === 'Ready';
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
