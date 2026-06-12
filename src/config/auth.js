// ═══ GOOGLE SIGN-IN CONFIGURATION ═══
// Get these from Firebase Console → Authentication → Sign-in method → Google
// (enable the provider, then expand "Web SDK configuration" for the Web client ID).
// For installed Android builds, create an Android OAuth client in Google Cloud
// Console → Credentials, using package name com.mathaino.app + your SHA-1.

export const GOOGLE_WEB_CLIENT_ID = '222938171389-lnm05ov5ugdmo9eiiv3mjc10a78lihug.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = '222938171389-09vsana5ih48q20mtrdajuk31r16e1a0.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '';     // optional until you build for iOS

export const isGoogleConfigured = () =>
  GOOGLE_WEB_CLIENT_ID.length > 0 && !GOOGLE_WEB_CLIENT_ID.startsWith('PASTE');
