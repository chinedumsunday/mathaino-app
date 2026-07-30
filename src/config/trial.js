// ═══ DEMO / TRIAL WINDOW ═══
// Only enabled on the `client/trial-demo` branch, which is what gets deployed
// to the public portal for client review. `main` keeps this disabled so APK
// builds and internal testing are never time-limited.
//
// To extend the demo: change ENDS_AT, rebuild, redeploy the portal.
// To hand over unrestricted access: set ENABLED = false (or deploy from main).
export const TRIAL = {
  ENABLED: true,

  // Absolute UTC deadline, baked into the build — clearing browser storage or
  // opening a private window does not reset it.
  ENDS_AT: '2026-08-01T06:12:31Z',

  // Shown on the lock screen so the reviewer knows who to contact.
  CONTACT: 'chinedumsunday5@gmail.com',
  OWNER: 'the developer',
};

export const trialEndsAtMs = () => new Date(TRIAL.ENDS_AT).getTime();
