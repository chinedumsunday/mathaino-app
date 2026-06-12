// ═══ PHASE / FEATURE FLAGS ═══
// Maps to the EdTain invoice phases. The `client/*` delivery branches flip
// unpaid phases to false so client builds only expose delivered work.
//
//   Phase 1 — Backend API, auth, user roles, database (always on)
//   Phase 2 — Core LMS: course builder, enrollment, app shell (always on)
//   Phase 3 — AI Chatbot, YouTube & Instagram integration
//   Phase 4 — Live lectures, focus mode, QA & Play Store

export const FEATURES = {
  // Phase 3
  AI_CHAT: false,
  SOCIAL_FEED: false,
  GOOGLE_LOGIN: true,
  // Phase 4
  LIVE_CLASSES: false,
  // Extras (delivered alongside phase 4)
  ANNOUNCEMENTS: false,
  PUSH: false,
};
