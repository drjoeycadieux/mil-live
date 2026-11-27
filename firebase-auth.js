import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

export const firebaseConfigured = Object.values(firebaseConfig).every(value =>
  typeof value === 'string' && value.length > 0 && !value.startsWith('YOUR_')
);

let auth = null;
let db = null;

if (firebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

function assertConfigured() {
  if (!firebaseConfigured) {
    throw new Error('Firebase is not configured. Update firebase-config.js with your Firebase web app settings.');
  }
}

async function isApproved(user) {
  const profile = await getDoc(doc(db, 'userProfiles', user.uid));
  const data = profile.exists() ? profile.data() : null;
  return data?.approved === true &&
    typeof data.email === 'string' &&
    data.email.toLowerCase() === (user.email || '').toLowerCase();
}

export async function requestAccess({ name, email, organization, reason }) {
  assertConfigured();
  await addDoc(collection(db, 'accessRequests'), {
    name: String(name || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    organization: String(organization || '').trim(),
    reason: String(reason || '').trim(),
    status: 'pending',
    createdAt: serverTimestamp()
  });
}

export async function signInApprovedUser(email, password) {
  assertConfigured();
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  try {
    if (await isApproved(credential.user)) return credential.user;
  } catch (error) {
    await signOut(auth);
    throw error;
  }
  await signOut(auth);
  const error = new Error('This account has not been approved.');
  error.code = 'access/pending';
  throw error;
}

export async function requireApprovedUser() {
  assertConfigured();
  const user = await new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      unsubscribe();
      resolve(currentUser);
    }, error => {
      unsubscribe();
      reject(error);
    });
  });
  if (!user) return null;

  try {
    if (await isApproved(user)) return user;
  } catch (error) {
    await signOut(auth);
    throw error;
  }
  await signOut(auth);
  return null;
}

export async function resetPassword(email) {
  assertConfigured();
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutCurrentUser() {
  assertConfigured();
  await signOut(auth);
}
