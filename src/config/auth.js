// ═══ GOOGLE SIGN-IN CONFIGURATION ═══
// Get these from Firebase Console → Authentication → Sign-in method → Google
// (enable the provider, then expand "Web SDK configuration" for the Web client ID).
// For installed Android builds, create an Android OAuth client in Google Cloud
// Console → Credentials, using package name com.mathaino.app + your SHA-1.

export const GOOGLE_WEB_CLIENT_ID = 'PASTE_WEB_CLIENT_ID.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = ''; // optional until you build the APK
export const GOOGLE_IOS_CLIENT_ID = '';     // optional until you build for iOS

export const isGoogleConfigured = () =>
  GOOGLE_WEB_CLIENT_ID.length > 0 && !GOOGLE_WEB_CLIENT_ID.startsWith('PASTE');
