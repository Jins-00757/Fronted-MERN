/**
 * Client-side mirror of the elevated-role check the backend enforces in
 * middleware/rbac.js (authorize(['delete:all', 'manage:team'])) for
 * destructive/bulk Salesforce operations - see salesforce.routes.js.
 *
 * This is a UX layer only: it hides actions a 'user' role can no longer
 * perform so the app doesn't show a button that will 403, not a security
 * boundary - the backend route guard is what actually enforces it.
 */
const ELEVATED_ROLES = new Set(['admin', 'manager']);

export const isElevatedRole = (role) => ELEVATED_ROLES.has((role || '').toLowerCase());

export const canManageSalesforceRecords = (user) => isElevatedRole(user?.role);
