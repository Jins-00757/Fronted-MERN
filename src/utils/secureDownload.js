import api from '../services/api';

/**
 * Redeem a secure, single-use download link returned by an endpoint like
 * GET /data/export/:format or POST /salesforce/bulk/:jobId/results/download-link
 * (see downloadTokenService.js on the backend) and save the file to disk.
 *
 * `linkData` is the `data` object from that endpoint's response:
 * { downloadUrl, filename, expiresAt, fileHash }. downloadUrl is relative
 * to the API base (e.g. "/export/download/<token>"), so it's fetched
 * through the same authenticated axios instance every other request uses -
 * the token alone isn't sufficient to redeem it (see exportController.js),
 * it must come from the user who originally requested the export.
 *
 * Single-use by design: calling this twice for the same linkData will
 * succeed once and then fail with "invalid, expired, or already used" - if
 * a caller needs the file again, it must request a fresh link.
 */
export const downloadFileFromLink = async ({ downloadUrl, filename }) => {
  const response = await api.get(downloadUrl, { responseType: 'blob' });

  const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default { downloadFileFromLink };
