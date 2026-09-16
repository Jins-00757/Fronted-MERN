import api from '../services/api';

/**
 * Fetch any authenticated GET endpoint as a blob and save it to disk via a
 * throwaway <a download> click - the actual browser-download mechanics
 * shared by downloadFileFromLink below (single-use token links) and any
 * plain authenticated file endpoint (e.g. the Bulk Operations CSV import
 * template) that doesn't need the token/expiry dance at all.
 */
export const downloadFile = async (url, filename) => {
  const response = await api.get(url, { responseType: 'blob' });

  const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
};

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
export const downloadFileFromLink = ({ downloadUrl, filename }) => downloadFile(downloadUrl, filename);

export default { downloadFile, downloadFileFromLink };
