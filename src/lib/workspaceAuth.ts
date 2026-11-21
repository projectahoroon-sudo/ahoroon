import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
];

const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach(scope => provider.addScope(scope));

// In-memory token storage (DO NOT persist in localStorage / sessionStorage per security requirements)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let currentGoogleUser: User | null = null;

const listeners: Array<(token: string | null, user: User | null) => void> = [];

function notifyListeners() {
  listeners.forEach(fn => fn(cachedAccessToken, currentGoogleUser));
}

export function subscribeWorkspaceAuth(callback: (token: string | null, user: User | null) => void) {
  listeners.push(callback);
  callback(cachedAccessToken, currentGoogleUser);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

// Clear token on sign out
onAuthStateChanged(auth, (user) => {
  currentGoogleUser = user;
  if (!user) {
    cachedAccessToken = null;
  }
  notifyListeners();
});

export const signInWithGmail = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Workspace access token.');
    }

    cachedAccessToken = credential.accessToken;
    currentGoogleUser = result.user;
    notifyListeners();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Gmail OAuth sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGmailAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setGmailAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  notifyListeners();
};

export const disconnectGmail = async () => {
  cachedAccessToken = null;
  notifyListeners();
};
