// Shared option lists for anything that edits `jobTitle`/`territory` -
// originally defined only inside Signup.jsx's role/territory wizard steps.
// Pulled out here so the Profile page's edit form (EditProfileModal.jsx)
// offers the exact same choices instead of drifting into a second,
// slightly-different list over time.

// Job-function labels only - stored in the existing `jobTitle` field.
// Deliberately NOT an RBAC role: signup always assigns the 'user' role
// server-side regardless of what's picked here (see auth.controller.js) -
// letting someone self-select elevated access would be a real security
// hole, so this is display/profile metadata only.
export const JOB_FUNCTIONS = [
  { value: 'Sales Representative', description: 'Own individual deals and accounts' },
  { value: 'Account Executive', description: 'Close new business and manage key accounts' },
  { value: 'Sales Manager', description: 'Lead a team of reps and track their pipeline' },
  { value: 'Sales Director', description: 'Oversee multiple teams and territories' },
  { value: 'Other', description: "None of the above quite fit" },
];

export const TERRITORIES = ['North America', 'EMEA', 'APAC', 'LATAM', 'Other'];
