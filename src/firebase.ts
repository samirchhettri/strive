import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Connection test as required by integration instructions
async function testConnection() {
  try {
    // We target a specific doc that is readable by signed-in users (or just check existence)
    const testDoc = doc(db, 'challenges', 'ping');
    await getDocFromServer(testDoc);
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('permission-denied')) {
       // This is expected if not signed in, which is fine for a boot test
       return;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    }
  }
}

testConnection();
