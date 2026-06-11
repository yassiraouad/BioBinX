import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, db, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, app } from './config';

export async function registerUser({ name, email, password, role, classCode }) {
  if (!app || !auth || !db) {
    throw new Error('Firebase not configured');
  }
  
  if (!name || name.trim().length < 2) {
    throw new Error('Navnet må være minst 2 tegn');
  }
  
  if (!email || !email.includes('@')) {
    throw new Error('Ugyldig e-postadresse');
  }
  
  if (!password || password.length < 6) {
    throw new Error('Passordet må være minst 6 tegn');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let classId = null;
    if (role === 'student' && classCode) {
      const classesRef = collection(db, 'classes');
      const q = query(classesRef, where('code', '==', classCode.toUpperCase()));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        classId = snapshot.docs[0].id;
      }
    }

    const userData = {
      name: name.trim().substring(0, 100),
      email,
      role: role || 'student',
      classId,
      points: 0,
      totalWaste: 0,
      badges: [],
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    if (classId) {
      const classRef = doc(db, 'classes', classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        await updateDoc(classRef, {
          studentCount: (classSnap.data().studentCount || 0) + 1
        });
      }
    }

    return { user: { uid: user.uid, ...userData }, classId };
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('E-posten er allerede i bruk');
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  if (!app || !auth || !db) {
    throw new Error('Firebase er ikke konfigurert. Sjekk miljøvariablene.');
  }
  
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  
  if (userDoc.exists()) {
    const userData = userDoc.data();
    
    if (userData.role === 'admin') {
      return { uid: userDoc.id, ...userData };
    }
    
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (adminDoc.exists()) {
      return { uid: userDoc.id, ...userData, role: 'admin' };
    }
    
    return { uid: userDoc.id, ...userData };
  }
  
  return { uid: user.uid, email: user.email };
}

export async function logoutUser() {
  if (!app || !auth) {
    return;
  }
  try {
    await auth.signOut();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }
}

export async function getUserData(uid) {
  if (!app || !auth || !db) {
    throw new Error('Firebase not configured');
  }
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return { uid: userDoc.id, ...userDoc.data() };
  }
  return null;
}

export function subscribeToAuth(callback) {
  if (!app || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function upgradeToAdmin(uid, email) {
  if (!db) return false;
  
  const adminRef = doc(db, 'admins', uid);
  await setDoc(adminRef, {
    email,
    role: 'admin',
    addedAt: new Date().toISOString(),
  }, { merge: true });
  
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { role: 'admin' });
  
  return true;
}
