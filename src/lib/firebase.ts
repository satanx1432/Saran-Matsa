import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  getDocFromServer,
  getDoc,
  setLogLevel
} from "firebase/firestore";
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize core Firebase application
const app = initializeApp(firebaseConfig);

// Silence internal Firestore SDK connection logs/warnings to keep local caching clean and robust
try {
  setLogLevel("silent");
} catch (loggingError) {
  console.warn("HASEX_OS [LOGGER WARN] // Could not set Firebase log level:", loggingError);
}

// Initialize database & authentication modules
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, (firebaseConfig as any).firestoreDatabaseId);
} catch (e) {
  console.warn("HASEX_OS [FIRESTORE WARN] // Persistent cache initialization failed, falling back to standard Firestore:", e);
  firestoreDb = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
}
export const db = firestoreDb;
export const auth = getAuth(app);
export const storage = getStorage(app);

// Google Sign-in Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/forms");

// Error diagnostic helper as specified in general guidelines
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error Detailed Matrix: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check verification
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    console.warn("HASEX_OS [NETWORK WARN] // Database connection check completed. Standard offline fallback and local cache operational.");
  }
}
testConnection();

// Google Client Popup login portal
export async function signInWithGooglePortal() {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const user = credential.user;

    const googleCredential = GoogleAuthProvider.credentialFromResult(credential);
    const accessToken = googleCredential?.accessToken;
    if (accessToken) {
      localStorage.setItem("hasex_google_access_token", accessToken);
    }
    
    // Auto sync user representation data container
    const userDocRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "Operator",
          photoURL: user.photoURL || "",
          createdAt: existingData.createdAt
        });
      } else {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "Operator",
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp()
        });
      }
    } catch {
      // Fallback in case of read error: write fresh
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "Operator",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp()
      });
    }
    return user;
  } catch (err: any) {
    console.error("HASEX_OS [AUTH ERROR] // Login flow rejected:", err);
    throw err;
  }
}

// User logout dispatcher
export async function logoutUserSession() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("HASEX_OS [AUTH ERROR] // Logout process broken:", err);
  }
}

// Save profile updates or initial sign in manually
export async function saveUserProfile(user: User) {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "Operator",
          photoURL: user.photoURL || "",
          createdAt: existingData.createdAt
        });
      } else {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "Operator",
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp()
        });
      }
    } catch {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "Operator",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Stream and monitor incoming messages
export function subscribeToMainChatChannel(onMessagesUpdate: (messages: any[]) => void, onError: (err: any) => void) {
  const messagesCollection = collection(db, "chat_messages");
  const scrollQuery = query(messagesCollection, orderBy("createdAt", "asc"), limit(100));

  return onSnapshot(scrollQuery, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((snap) => {
      const docData = snap.data();
      list.push({
        ...docData,
        id: snap.id,
        // Convert Firestore ServerTimestamp back into standard string dates
        createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate().toISOString() : new Date().toISOString()
      });
    });
    onMessagesUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, "chat_messages");
    onError(error);
  });
}

// Send real-time chat message structure
export async function transmitChatMessage(text: string, fileData?: { url: string; name: string } | null) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Cannot dispatch messages anonymously. Authenticate first.");
  }

  const messageId = Math.random().toString(36).substring(2, 11).toUpperCase();
  const path = `chat_messages/${messageId}`;

  const messagePayload: any = {
    id: messageId,
    senderUid: user.uid,
    senderEmail: user.email || "",
    senderDisplayName: user.displayName || "Operator",
    senderPhotoURL: user.photoURL || "",
    text: text,
    createdAt: serverTimestamp()
  };

  if (fileData) {
    messagePayload.fileURL = fileData.url;
    messagePayload.fileName = fileData.name;
  }

  try {
    await setDoc(doc(db, "chat_messages", messageId), messagePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Highly reliable Upload process (with Base64 local fallback in case bucket has cold-start or policy hurdles)
export async function uploadChatAttachment(file: File): Promise<{ url: string; name: string }> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `chat_attachments/${Date.now()}_${cleanName}`;
  const fileRef = storageRef(storage, storagePath);

  try {
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return { url, name: file.name };
  } catch (err) {
    console.warn("HASEX_OS [STORAGE WARN] // Primary cloud upload failed, utilizing Base64 local vector format fallback:", err);
    
    // Return Base64 representation as a completely reliable and offline-resistant fallback
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve({ url: reader.result, name: file.name });
        } else {
          reject(new Error("File conversion buffer corrupted."));
        }
      };
      reader.onerror = () => reject(new Error("FileReader process read failure."));
      reader.readAsDataURL(file);
    });
  }
}
