import { db, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, addDoc, serverTimestamp, app, runTransaction } from './config';
import { updateStreak } from '../lib/streak';
import { checkAndGrantAchievements } from '../lib/achievements';

function ensureFirebase() {
  if (!app || !db) {
    throw new Error('Firebase not configured');
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function logWaste({ userId, weight, imageUrl, classId, aiClassification }) {
  ensureFirebase();
  const usersRef = collection(db, 'users');
  const classesRef = collection(db, 'classes');
  const logsRef = collection(db, 'waste_logs');

  const weightNum = parseFloat(weight);
  
  if (isNaN(weightNum) || weightNum <= 0) {
    throw new Error('Ugyldig vekt');
  }
  if (weightNum > 100) {
    throw new Error('Vekten er for høy');
  }
  
  const points = Math.round(weightNum * 10);
  const energyKwh = weightNum * 0.5;
  const co2Saved = weightNum * 0.8;

  const logData = {
    userId,
    classId: classId || null,
    weight: weightNum,
    imageUrl: imageUrl || null,
    points,
    energyKwh,
    co2Saved,
    timestamp: new Date().toISOString(),
    aiClassification: aiClassification || null,
    verifiedOrganic: aiClassification?.isOrganic ?? null,
  };

  const docRef = await addDoc(logsRef, logData);

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await transaction.get(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      transaction.update(userRef, {
        points: (userData.points || 0) + points,
        totalWaste: (userData.totalWaste || 0) + weightNum,
      });
    }

    if (classId) {
      const classRef = doc(db, 'classes', classId);
      const classSnap = await transaction.get(classRef);
      if (classSnap.exists()) {
        const classData = classSnap.data();
        transaction.update(classRef, {
          totalWaste: (classData.totalWaste || 0) + weightNum,
          totalPoints: (classData.totalPoints || 0) + points,
        });
      }
    }
  });

  const goalResult = await checkAndAwardGoalPoints(userId, classId);
  let classGoalResult = null;
  if (classId) {
    classGoalResult = await checkAndAwardClassGoalPoints(classId);
  }

  const [streakResult, achievementResult] = await Promise.all([
    updateStreak(userId),
    checkAndGrantAchievements(userId),
  ]);
  
  return {
    logId: docRef.id,
    points,
    energyKwh,
    co2Saved,
    goalResult,
    classGoalResult,
    streakResult,
    achievementResult,
  };
}

export async function getUserLogs(userId) {
  const logsRef = collection(db, 'waste_logs');
  const q = query(logsRef, where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(20));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getClassLogs(classId) {
  const logsRef = collection(db, 'waste_logs');
  const q = query(logsRef, where('classId', '==', classId), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getStudentLeaderboard(classId = null) {
  const usersRef = collection(db, 'users');
  let q;
  if (classId) {
    q = query(usersRef, where('role', '==', 'student'), where('classId', '==', classId), orderBy('points', 'desc'), limit(20));
  } else {
    q = query(usersRef, where('role', '==', 'student'), orderBy('points', 'desc'), limit(20));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc, i) => {
    const data = doc.data();
    return { rank: i + 1, uid: doc.id, ...data };
  });
}

export async function getClassLeaderboard() {
  const classesRef = collection(db, 'classes');
  const q = query(classesRef, orderBy('totalPoints', 'desc'), limit(10));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc, i) => ({ rank: i + 1, id: doc.id, ...doc.data() }));
}

export async function createClass({ name, teacherId, schoolId, groupId }) {
  const classesRef = collection(db, 'classes');
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const classData = {
    name,
    teacherId,
    schoolId,
    groupId,
    code,
    totalWaste: 0,
    totalPoints: 0,
    studentCount: 0,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(classesRef, classData);
  return { id: docRef.id, code };
}

export async function getTeacherClasses(teacherId) {
  const classesRef = collection(db, 'classes');
  const q = query(classesRef, where('teacherId', '==', teacherId));
  const snapshot = await getDocs(q);
  const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const schoolIds = [...new Set(classes.filter(c => c.schoolId).map(c => c.schoolId))];
  const groupIds = [...new Set(classes.filter(c => c.groupId).map(c => c.groupId))];
  
  const schoolDocs = await Promise.all(schoolIds.map(id => getDoc(doc(db, 'schools', id))));
  const schoolMap = {};
  schoolDocs.forEach((doc, i) => {
    if (doc.exists()) {
      schoolMap[schoolIds[i]] = doc.data().name;
    }
  });
  
  const groupDocs = await Promise.all(groupIds.map(id => getDoc(doc(db, 'groups', id))));
  const groupMap = {};
  groupDocs.forEach((doc, i) => {
    if (doc.exists()) {
      groupMap[groupIds[i]] = doc.data().name;
    }
  });
  
  return classes.map(cls => ({
    ...cls,
    schoolName: cls.schoolId ? schoolMap[cls.schoolId] : null,
    groupName: cls.groupId ? groupMap[cls.groupId] : null,
  }));
}

export async function getClassStudents(classId) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('classId', '==', classId), where('role', '==', 'student'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
}

export async function getClassData(classId) {
  const classDoc = await getDoc(doc(db, 'classes', classId));
  if (classDoc.exists()) {
    return { id: classDoc.id, ...classDoc.data() };
  }
  return null;
}

export async function getClassByCode(code) {
  const classesRef = collection(db, 'classes');
  const q = query(classesRef, where('code', '==', code.toUpperCase()), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const classDoc = snapshot.docs[0];
  return { id: classDoc.id, ...classDoc.data() };
}

export async function getClassesByIds(classIds = []) {
  if (!classIds.length) return [];
  const uniqueIds = [...new Set(classIds.filter(Boolean))];
  const refs = uniqueIds.map((classId) => getDoc(doc(db, 'classes', classId)));
  const docs = await Promise.all(refs);
  return docs.filter((docSnap) => docSnap.exists()).map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

const BADGE_THRESHOLDS = [
  { id: 'first_log', name: 'Første kast!', icon: '🌱', description: 'Registrerte første matavfall', threshold: 0, type: 'count' },
  { id: 'waste_10kg', name: '10 kg Helt', icon: '💪', description: '10 kg matavfall registrert', threshold: 10, type: 'weight' },
  { id: 'waste_50kg', name: '50 kg Mester', icon: '🏆', description: '50 kg matavfall registrert', threshold: 50, type: 'weight' },
  { id: 'waste_100kg', name: '100 kg Legende', icon: '👑', description: '100 kg matavfall registrert', threshold: 100, type: 'weight' },
];

export async function checkBadges(userId, totalWaste, currentBadges) {
  const logsRef = collection(db, 'waste_logs');
  const q = query(logsRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const logCount = snapshot.size;

  const newBadges = [...currentBadges];
  let updated = false;

  for (const badge of BADGE_THRESHOLDS) {
    if (currentBadges.includes(badge.id)) continue;

    if (badge.type === 'weight' && totalWaste >= badge.threshold) {
      newBadges.push(badge.id);
      updated = true;
    } else if (badge.type === 'count' && logCount > 0 && badge.type === 'count') {
      newBadges.push(badge.id);
      updated = true;
    }
  }

  if (updated) {
    await updateDoc(doc(db, 'users', userId), { badges: newBadges });
  }

  return newBadges;
}

export const ALL_BADGES = BADGE_THRESHOLDS;

export async function getGlobalStats() {
  const logsRef = collection(db, 'waste_logs');
  const snapshot = await getDocs(logsRef);
  const logs = snapshot.docs.map(doc => doc.data());

  const totalWaste = logs.reduce((sum, l) => sum + (l.weight || 0), 0);
  const totalEnergy = logs.reduce((sum, l) => sum + (l.energyKwh || 0), 0);
  const totalCO2 = logs.reduce((sum, l) => sum + (l.co2Saved || 0), 0);

  return { totalWaste, totalEnergy, totalCO2, totalLogs: logs.length };
}

export async function getAllUsers() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
}

export async function getAllClasses() {
  const classesRef = collection(db, 'classes');
  const snapshot = await getDocs(classesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAllWasteLogs() {
  const logsRef = collection(db, 'waste_logs');
  const q = query(logsRef, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAdminStats() {
  const [users, classes, logs] = await Promise.all([
    getAllUsers(),
    getAllClasses(),
    getAllWasteLogs()
  ]);

  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');
  const totalWaste = logs.reduce((sum, l) => sum + (l.weight || 0), 0);
  const totalEnergy = logs.reduce((sum, l) => sum + (l.energyKwh || 0), 0);
  const totalCO2 = logs.reduce((sum, l) => sum + (l.co2Saved || 0), 0);

  return {
    totalUsers: users.length,
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalClasses: classes.length,
    totalLogs: logs.length,
    totalWaste,
    totalEnergy,
    totalCO2,
    students,
    teachers,
    classes,
    logs
  };
}

export async function deleteUser(uid) {
  await deleteDoc(doc(db, 'users', uid));
}

export async function deleteClass(classId) {
  await deleteDoc(doc(db, 'classes', classId));
}

export async function deleteWasteLog(logId) {
  await deleteDoc(doc(db, 'waste_logs', logId));
}

export async function updateUser(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function updateClass(classId, data) {
  await updateDoc(doc(db, 'classes', classId), data);
}

export async function createSchool({ name }) {
  const schoolsRef = collection(db, 'schools');
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();
  const schoolData = {
    name,
    code,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(schoolsRef, schoolData);
  return { id: docRef.id, code };
}

export async function getSchoolByCode(code) {
  const schoolsRef = collection(db, 'schools');
  const q = query(schoolsRef, where('code', '==', code.toUpperCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getAllSchools() {
  const schoolsRef = collection(db, 'schools');
  const snapshot = await getDocs(schoolsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createGroup({ name, schoolId }) {
  const groupsRef = collection(db, 'groups');
  const groupData = {
    name,
    schoolId,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(groupsRef, groupData);
  return { id: docRef.id };
}

export async function getSchoolGroups(schoolId) {
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where('schoolId', '==', schoolId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAllGroups() {
  const groupsRef = collection(db, 'groups');
  const snapshot = await getDocs(groupsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function deleteGroup(groupId) {
  await deleteDoc(doc(db, 'groups', groupId));
}

export async function getSchool(schoolId) {
  const schoolDoc = await getDoc(doc(db, 'schools', schoolId));
  if (schoolDoc.exists()) {
    return { id: schoolDoc.id, ...schoolDoc.data() };
  }
  return null;
}

export async function deleteSchool(schoolId) {
  await deleteDoc(doc(db, 'schools', schoolId));
}

export async function getSchoolClasses(schoolId) {
  const classesRef = collection(db, 'classes');
  const q = query(classesRef, where('schoolId', '==', schoolId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getSchoolLeaderboard(schoolId) {
  const classesRef = collection(db, 'classes');
  const q = query(classesRef, where('schoolId', '==', schoolId), orderBy('totalPoints', 'desc'), limit(10));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc, i) => ({ rank: i + 1, id: doc.id, ...doc.data() }));
}

export async function getSchoolStudentLeaderboard(schoolId) {
  const classes = await getSchoolClasses(schoolId);
  const classIds = classes.map(c => c.id);
  
  if (classIds.length === 0) return [];
  
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('classId', 'in', classIds), orderBy('points', 'desc'), limit(20));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc, i) => ({ rank: i + 1, uid: doc.id, ...doc.data() }));
}

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function setUserWeeklyGoal(userId, goalWeight) {
  const weekStart = getWeekStart();
  await updateDoc(doc(db, 'users', userId), {
    weeklyGoal: goalWeight,
    weeklyGoalWeekStart: weekStart.toISOString(),
    weeklyGoalCompleted: false,
  });
}

export async function setClassWeeklyGoal(classId, goalWeight) {
  const weekStart = getWeekStart();
  await updateDoc(doc(db, 'classes', classId), {
    weeklyGoal: goalWeight,
    weeklyGoalWeekStart: weekStart.toISOString(),
    weeklyGoalCompleted: false,
  });
}

export async function getWeeklyWaste(userId, classId = null) {
  const logsRef = collection(db, 'waste_logs');
  const weekStart = getWeekStart();
  const weekStartStr = weekStart.toISOString();
  
  let q;
  if (classId) {
    q = query(logsRef, where('classId', '==', classId), where('timestamp', '>=', weekStartStr));
  } else {
    q = query(logsRef, where('userId', '==', userId), where('timestamp', '>=', weekStartStr));
  }
  
  const snapshot = await getDocs(q);
  const logs = snapshot.docs.map(doc => doc.data());
  return logs.reduce((sum, l) => sum + (l.weight || 0), 0);
}

export async function checkAndAwardGoalPoints(userId, classId = null) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  
  const userData = userSnap.data();
  const weekStart = getWeekStart();
  const storedWeekStart = userData.weeklyGoalWeekStart;
  
  const storedWeek = storedWeekStart ? new Date(storedWeekStart) : null;
  const isNewWeek = !storedWeek || storedWeek < weekStart;
  
  const goalWeight = userData.weeklyGoal;
  if (!goalWeight || goalWeight <= 0) return null;
  if (!isNewWeek && userData.weeklyGoalCompleted) return null;
  
  const weeklyWaste = await getWeeklyWaste(userId, classId);
  
  if (weeklyWaste >= goalWeight && (isNewWeek || !userData.weeklyGoalCompleted)) {
    await updateDoc(userRef, {
      points: (userData.points || 0) + 200,
      weeklyGoalCompleted: true,
    });
    return { awarded: true, points: 200 };
  }
  
  return null;
}

export async function checkAndAwardClassGoalPoints(classId) {
  const classRef = doc(db, 'classes', classId);
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) return null;
  
  const classData = classSnap.data();
  const weekStart = getWeekStart();
  const storedWeekStart = classData.weeklyGoalWeekStart;
  
  const storedWeek = storedWeekStart ? new Date(storedWeekStart) : null;
  const isNewWeek = !storedWeek || storedWeek < weekStart;
  
  const goalWeight = classData.weeklyGoal;
  if (!goalWeight || goalWeight <= 0) return null;
  if (!isNewWeek && classData.weeklyGoalCompleted) return null;
  
  const weeklyWaste = await getWeeklyWaste(null, classId);
  
  if (weeklyWaste >= goalWeight && (isNewWeek || !classData.weeklyGoalCompleted)) {
    const students = await getClassStudents(classId);
    for (const student of students) {
      const studentRef = doc(db, 'users', student.uid);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        await updateDoc(studentRef, {
          points: (studentData.points || 0) + 200,
        });
      }
    }
    await updateDoc(classRef, { weeklyGoalCompleted: true });
    return { awarded: true, points: 200, studentCount: students.length };
  }
  
  return null;
}

export async function addBin({ binId, classId, className, teacherId }) {
  ensureFirebase();
  const binsRef = collection(db, 'bins');
  
  const existingBin = await getDoc(doc(db, 'bins', binId));
  if (existingBin.exists()) {
    throw new Error('BIN_ALREADY_EXISTS');
  }

  const binData = {
    binId,
    classId,
    className,
    addedBy: teacherId,
    createdAt: serverTimestamp(),
    status: 'active',
  };

  await setDoc(doc(db, 'bins', binId), binData);
  return { binId, ...binData };
}

export async function getBinsByTeacher(teacherId) {
  const binsRef = collection(db, 'bins');
  const q = query(binsRef, where('addedBy', '==', teacherId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function checkBinExists(binId) {
  const binDoc = await getDoc(doc(db, 'bins', binId));
  return binDoc.exists();
}

export async function createClassGroup({ groupName, classId, className, createdBy }) {
  ensureFirebase();
  const groupData = {
    groupId: generateId(),
    groupName,
    classId,
    className,
    createdBy,
    createdAt: serverTimestamp(),
    memberCount: 0,
    binCount: 0,
  };
  const docRef = await addDoc(collection(db, 'groups'), groupData);
  return { id: docRef.id, ...groupData };
}

export async function updateClassGroup(groupId, { groupName }) {
  ensureFirebase();
  await updateDoc(doc(db, 'groups', groupId), { groupName });
  const groupDoc = await getDoc(doc(db, 'groups', groupId));
  return groupDoc.exists() ? { id: groupDoc.id, ...groupDoc.data() } : null;
}

export async function deleteClassGroup(groupId) {
  ensureFirebase();
  const groupDoc = await getDoc(doc(db, 'groups', groupId));
  if (!groupDoc.exists()) return;
  
  const groupData = groupDoc.data();
  
  const membersQuery = query(collection(db, 'users'), where('groupId', '==', groupId));
  const membersSnap = await getDocs(membersQuery);
  for (const memberDoc of membersSnap.docs) {
    await updateDoc(doc(db, 'users', memberDoc.id), {
      groupId: null,
      groupName: null,
    });
  }
  
  const binsQuery = query(collection(db, 'bins'), where('groupId', '==', groupId));
  const binsSnap = await getDocs(binsQuery);
  for (const binDoc of binsSnap.docs) {
    await updateDoc(doc(db, 'bins', binDoc.id), {
      groupId: null,
      groupName: null,
    });
  }
  
  await deleteDoc(doc(db, 'groups', groupId));
}

export async function getGroupsByClass(classId) {
  ensureFirebase();
  const q = query(collection(db, 'groups'), where('classId', '==', classId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getGroupsByTeacher(teacherId) {
  ensureFirebase();
  const classes = await getTeacherClasses(teacherId);
  const classIds = classes.map(c => c.id);
  if (classIds.length === 0) return [];
  
  const q = query(collection(db, 'groups'), where('classId', 'in', classIds));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getGroupById(groupId) {
  ensureFirebase();
  const groupDoc = await getDoc(doc(db, 'groups', groupId));
  return groupDoc.exists() ? { id: groupDoc.id, ...groupDoc.data() } : null;
}

export async function assignUserToGroup(userId, groupId, groupName) {
  ensureFirebase();
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  
  const oldGroupId = userSnap.data().groupId;
  
  await updateDoc(userRef, { groupId, groupName });
  
  if (oldGroupId && oldGroupId !== groupId) {
    const oldGroupDoc = await getDoc(doc(db, 'groups', oldGroupId));
    if (oldGroupDoc.exists()) {
      const oldData = oldGroupDoc.data();
      await updateDoc(doc(db, 'groups', oldGroupId), {
        memberCount: Math.max(0, (oldData.memberCount || 1) - 1),
      });
    }
  }
  
  if (groupId) {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (groupDoc.exists()) {
      const groupData = groupDoc.data();
      await updateDoc(doc(db, 'groups', groupId), {
        memberCount: (groupData.memberCount || 0) + 1,
      });
    }
  }
}

export async function assignBinToGroup(binId, groupId, groupName) {
  ensureFirebase();
  const binRef = doc(db, 'bins', binId);
  const binSnap = await getDoc(binRef);
  if (!binSnap.exists()) return;
  
  const oldGroupId = binSnap.data().groupId;
  
  await updateDoc(binRef, { groupId: groupId || null, groupName: groupName || null });
  
  if (oldGroupId && oldGroupId !== groupId) {
    const oldGroupDoc = await getDoc(doc(db, 'groups', oldGroupId));
    if (oldGroupDoc.exists()) {
      const oldData = oldGroupDoc.data();
      await updateDoc(doc(db, 'groups', oldGroupId), {
        binCount: Math.max(0, (oldData.binCount || 1) - 1),
      });
    }
  }
  
  if (groupId) {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (groupDoc.exists()) {
      const groupData = groupDoc.data();
      await updateDoc(doc(db, 'groups', groupId), {
        binCount: (groupData.binCount || 0) + 1,
      });
    }
  }
}

export async function getGroupStats(groupId) {
  ensureFirebase();
  const groupDoc = await getDoc(doc(db, 'groups', groupId));
  if (!groupDoc.exists()) return null;
  
  const groupData = groupDoc.data();
  const classId = groupData.classId;
  
  const membersQuery = query(collection(db, 'users'), where('groupId', '==', groupId));
  const membersSnap = await getDocs(membersQuery);
  const memberIds = membersSnap.docs.map(d => d.id);
  
  const binsQuery = query(collection(db, 'bins'), where('groupId', '==', groupId));
  const binsSnap = await getDocs(binsQuery);
  const binIds = binsSnap.docs.map(d => d.id);
  
  let totalWaste = 0;
  let totalEvents = 0;
  
  if (memberIds.length > 0) {
    const logsQuery = query(collection(db, 'waste_logs'), where('userId', 'in', memberIds));
    const logsSnap = await getDocs(logsQuery);
    logsSnap.docs.forEach(logDoc => {
      const data = logDoc.data();
      totalWaste += data.weight || 0;
      totalEvents++;
    });
  }
  
  const co2Saved = totalWaste * 0.8;
  const energyKwh = totalWaste * 0.5;
  
  const allGroupsQuery = query(collection(db, 'groups'), where('classId', '==', classId));
  const allGroupsSnap = await getDocs(allGroupsQuery);
  const allGroups = allGroupsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const comparison = [];
  for (const g of allGroups) {
    if (g.id === groupId) {
      comparison.push({ id: g.id, groupName: g.groupName, totalWaste, isCurrent: true });
      continue;
    }
    let gWaste = 0;
    const gMembersQuery = query(collection(db, 'users'), where('groupId', '==', g.id));
    const gMembersSnap = await getDocs(gMembersQuery);
    const gMemberIds = gMembersSnap.docs.map(d => d.id);
    if (gMemberIds.length > 0) {
      const gLogsQuery = query(collection(db, 'waste_logs'), where('userId', 'in', gMemberIds));
      const gLogsSnap = await getDocs(gLogsQuery);
      gLogsSnap.docs.forEach(logDoc => {
        gWaste += logDoc.data().weight || 0;
      });
    }
    comparison.push({ id: g.id, groupName: g.groupName, totalWaste: gWaste, isCurrent: false });
  }
  
  comparison.sort((a, b) => b.totalWaste - a.totalWaste);
  
  return {
    groupId,
    groupName: groupData.groupName,
    classId,
    className: groupData.className,
    memberCount: membersSnap.size,
    binCount: binsSnap.size,
    totalWaste,
    totalEvents,
    co2Saved,
    energyKwh,
    comparison,
  };
}

export function getEcoLevel(points) {
  if (points >= 700) return { level: 'BioBin Elite', icon: '👑', color: '#f59e0b', nextLevel: null, nextThreshold: null };
  if (points >= 300) return { level: 'Gull', icon: '🥇', color: '#fbbf24', nextLevel: 'BioBin Elite', nextThreshold: 700 };
  if (points >= 100) return { level: 'Silver', icon: '🥈', color: '#9ca3af', nextLevel: 'Gull', nextThreshold: 300 };
  return { level: 'Bronse', icon: '🥉', color: '#b45309', nextLevel: 'Silver', nextThreshold: 100 };
}

export function getEcoLevelProgress(points) {
  const eco = getEcoLevel(points);
  if (!eco.nextThreshold) return 100;
  const currentThreshold = eco.level === 'BioBin Elite' ? 700 : eco.level === 'Gull' ? 300 : eco.level === 'Silver' ? 100 : 0;
  const progress = ((points - currentThreshold) / (eco.nextThreshold - currentThreshold)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

export async function addClassEcoPoints(classId, points) {
  const classRef = doc(db, 'classes', classId);
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) return;
  
  const currentPoints = classSnap.data().ecoPoints || 0;
  await updateDoc(classRef, { ecoPoints: currentPoints + points });
}

export async function getClassLeaderboardWithStreak() {
  const classesRef = collection(db, 'classes');
  const snapshot = await getDocs(classesRef);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  
  const classes = [];
  for (const classDoc of snapshot.docs) {
    const data = classDoc.data();
    const logsQuery = query(collection(db, 'waste_logs'), where('classId', '==', classDoc.id), where('timestamp', '>=', weekStart.toISOString()));
    const logsSnap = await getDocs(logsQuery);
    const weekLogs = logsSnap.docs.map(d => d.data());
    const weekTotal = weekLogs.reduce((s, l) => s + (l.weight || 0), 0);
    
    const daysWithLogs = new Set();
    weekLogs.forEach(log => {
      if (log.timestamp) {
        const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        daysWithLogs.add(logDate.toDateString());
      }
    });
    const streak = daysWithLogs.size >= 7;
    
    const eco = getEcoLevel(data.ecoPoints || 0);
    classes.push({
      id: classDoc.id,
      name: data.name,
      weeklyKg: parseFloat(weekTotal.toFixed(1)),
      streak,
      ecoLevel: eco.level,
      ecoIcon: eco.icon,
      studentCount: data.studentCount || 0,
    });
  }
  
  classes.sort((a, b) => b.weeklyKg - a.weeklyKg);
  return classes.map((c, i) => ({ ...c, rank: i + 1 }));
}

export async function getChallenges(weekStart = null) {
  const startDate = weekStart || getWeekStart();
  const challengesRef = collection(db, 'challenges');
  const q = query(challengesRef, where('weekStart', '==', startDate.toISOString()));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createChallenge({ title, description, targetKg, targetStreak, weekStart }) {
  const startDate = weekStart || getWeekStart();
  const challengeData = {
    challengeId: generateId(),
    title,
    description,
    targetKg: targetKg || null,
    targetStreak: targetStreak || null,
    weekStart: startDate.toISOString(),
    completedBy: [],
  };
  const docRef = await addDoc(collection(db, 'challenges'), challengeData);
  return { id: docRef.id, ...challengeData };
}

export async function checkChallengeCompletion(classId) {
  const weekStart = getWeekStart();
  const challenges = await getChallenges(weekStart);
  
  const logsQuery = query(collection(db, 'waste_logs'), where('classId', '==', classId), where('timestamp', '>=', weekStart.toISOString()));
  const logsSnap = await getDocs(logsQuery);
  const logs = logsSnap.docs.map(d => d.data());
  
  const totalKg = logs.reduce((s, l) => s + (l.weight || 0), 0);
  
  const daysWithLogs = new Set();
  logs.forEach(log => {
    if (log.timestamp) {
      const logDate = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      daysWithLogs.add(logDate.toDateString());
    }
  });
  const streak = daysWithLogs.size;
  
  for (const challenge of challenges) {
    if (challenge.completedBy?.includes(classId)) continue;
    
    let completed = false;
    if (challenge.targetKg && totalKg >= challenge.targetKg) completed = true;
    if (challenge.targetStreak && streak >= challenge.targetStreak) completed = true;
    
    if (completed) {
      const challengeRef = doc(db, 'challenges', challenge.id);
      const currentCompleted = challenge.completedBy || [];
      await updateDoc(challengeRef, { completedBy: [...currentCompleted, classId] });
      
      const classRef = doc(db, 'classes', classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        const trophies = classSnap.data().trophies || [];
        const newTrophy = { name: challenge.title, week: weekStart.toISOString() };
        await updateDoc(classRef, { trophies: [...trophies, newTrophy] });
      }
    }
  }
}

export async function getClassTrophies(classId) {
  const classDoc = await getDoc(doc(db, 'classes', classId));
  if (!classDoc.exists()) return [];
  return classDoc.data().trophies || [];
}

export async function seedWeeklyChallenges() {
  const weekStart = getWeekStart();
  const existing = await getChallenges(weekStart);
  if (existing.length > 0) return;
  
  await createChallenge({
    title: '10 kg-utfordringen',
    description: 'Kast minst 10 kg matavfall denne uken',
    targetKg: 10,
    weekStart,
  });
  
  await createChallenge({
    title: '5-dagers streak',
    description: 'Log matavfall minst 5 dager denne uken',
    targetStreak: 5,
    weekStart,
  });
  
  await createChallenge({
    title: 'Hele klassen aktiv',
    description: 'Alle elever i klassen logger minst én gang denne uken',
    targetKg: null,
    targetStreak: null,
    weekStart,
  });
}

export async function getWeeklyInsight() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const logsQuery = query(collection(db, 'waste_logs'), where('timestamp', '>=', thirtyDaysAgo.toISOString()));
  const snapshot = await getDocs(logsQuery);
  const logs = snapshot.docs.map(doc => doc.data());
  
  const byDayOfWeek = {};
  const byClass = {};
  const byHour = {};
  
  logs.forEach(log => {
    if (!log.timestamp) return;
    const date = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
    
    const dayNames = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
    const dayName = dayNames[date.getDay()];
    byDayOfWeek[dayName] = (byDayOfWeek[dayName] || 0) + (log.weight || 0);
    
    if (log.classId) {
      byClass[log.classId] = (byClass[log.classId] || 0) + (log.weight || 0);
    }
    
    const hour = date.getHours();
    const hourKey = `${hour}:00`;
    byHour[hourKey] = (byHour[hourKey] || 0) + (log.weight || 0);
  });
  
  const summary = {
    totalKg: logs.reduce((s, l) => s + (l.weight || 0), 0).toFixed(1),
    byDayOfWeek,
    byClass,
    byHour,
    logCount: logs.length,
  };
  
  return summary;
}

export async function getCO2Prognosis() {
  const cacheDoc = await getDoc(doc(db, 'meta', 'co2forecast'));
  if (cacheDoc.exists()) {
    const data = cacheDoc.data();
    const cacheDate = new Date(data.generatedAt);
    const now = new Date();
    if ((now - cacheDate) / (1000 * 60 * 60 * 24) < 7) {
      return data;
    }
  }
  
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const logsQuery = query(collection(db, 'waste_logs'), where('timestamp', '>=', ninetyDaysAgo.toISOString()));
  const snapshot = await getDocs(logsQuery);
  const logs = snapshot.docs.map(doc => doc.data());
  
  const totalKg = logs.reduce((s, l) => s + (l.weight || 0), 0);
  const avgKgPerWeek = totalKg / 13;
  
  const nextMonthKg = avgKgPerWeek * 4;
  const nextYearKg = avgKgPerWeek * 52;
  
  const co2Month = nextMonthKg * 0.6;
  const co2Year = nextYearKg * 0.6;
  
  const prognosis = {
    nextMonthKg: Math.round(nextMonthKg),
    nextYearKg: Math.round(nextYearKg),
    co2MonthKg: Math.round(co2Month),
    co2YearKg: Math.round(co2Year),
    generatedAt: new Date().toISOString(),
    basedOnKg: Math.round(totalKg),
  };
  
  await setDoc(doc(db, 'meta', 'co2forecast'), prognosis);
  return prognosis;
}

export async function dailyCheckIn(userId, classId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  
  const userData = userSnap.data();
  const today = new Date().toDateString();
  const lastCheckin = userData.lastCheckin ? new Date(userData.lastCheckin).toDateString() : null;
  
  if (lastCheckin === today) {
    return { alreadyCheckedIn: true };
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  
  let newStreak = 1;
  if (lastCheckin === yesterdayStr) {
    newStreak = (userData.currentStreak || 0) + 1;
  }
  
  const longestStreak = Math.max(newStreak, userData.longestStreak || 0);
  
  await updateDoc(userRef, {
    lastCheckin: new Date().toISOString(),
    currentStreak: newStreak,
    longestStreak: longestStreak,
    ecoPoints: (userData.ecoPoints || 0) + 10,
  });
  
  const logRef = collection(db, 'waste_logs');
  await addDoc(logRef, {
    userId,
    classId,
    weight: 0,
    points: 0,
    timestamp: new Date().toISOString(),
    type: 'checkin',
  });
  
  return { streak: newStreak, ecoPointsEarned: 10 };
}

export async function getQuizForWeek(weekStart = null) {
  const startDate = weekStart || getWeekStart();
  const weekId = `week-${startDate.toISOString().substring(0, 10)}`;
  
  const quizDoc = await getDoc(doc(db, 'quizzes', weekId));
  if (quizDoc.exists()) {
    return { id: quizDoc.id, ...quizDoc.data() };
  }
  
  const defaultQuestions = [
    { question: 'Hvor mange kg matavfall kaster en gjennomsnittlig nordmann per år?', options: ['50 kg', '80 kg', '120 kg', '150 kg'], correctIndex: 1 },
    { question: 'Hva er den beste måten å redusere matavfall på?', options: ['Kaste mer', 'Planlegge måltider', 'Kjøpe mer', 'Ikke tenke på det'], correctIndex: 1 },
    { question: 'Hva blir matavfall til i biogassanlegget?', options: ['Plast', 'Gjødsel og biogas', 'Papir', 'Metal'], correctIndex: 1 },
    { question: 'Hvor mye CO₂ spares ved å kompostere 1 kg matavfall?', options: ['0.2 kg', '0.5 kg', '0.8 kg', '1.1 kg'], correctIndex: 2 },
    { question: 'Hva betyr "restavfall"?', options: ['Mat', 'Alt som ikke kan resirkuleres', 'Plast', 'Glass'], correctIndex: 1 },
  ];
  
  await setDoc(doc(db, 'quizzes', weekId), {
    weekId,
    questions: defaultQuestions,
    completedBy: {},
  });
  
  return { weekId, questions: defaultQuestions, completedBy: {} };
}

export async function submitQuizAnswer(userId, weekId, questionIndex, answerIndex, score) {
  const quizRef = doc(db, 'quizzes', weekId);
  const quizSnap = await getDoc(quizRef);
  if (!quizSnap.exists()) return null;
  
  const quizData = quizSnap.data();
  const completedBy = quizData.completedBy || {};
  const existingScore = completedBy[userId]?.score || 0;
  const newScore = existingScore + score;
  
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    await updateDoc(userRef, {
      ecoPoints: (userData.ecoPoints || 0) + score,
    });
  }
  
  await updateDoc(quizRef, {
    [`completedBy.${userId}`]: {
      score: newScore,
      lastAnswer: questionIndex,
      timestamp: new Date().toISOString(),
    },
  });
  
  return { score: newScore };
}

export async function createReminder({ classId, createdBy, triggerType, thresholdDays, message }) {
  const reminderData = {
    classId,
    createdBy,
    triggerType,
    thresholdDays: thresholdDays || 3,
    message: message || 'Påminnelse om å registrere matavfall',
    active: true,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'reminders'), reminderData);
  return { id: docRef.id, ...reminderData };
}

export async function getRemindersByClass(classId) {
  const q = query(collection(db, 'reminders'), where('classId', '==', classId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function toggleReminder(reminderId, active) {
  await updateDoc(doc(db, 'reminders', reminderId), { active });
}

export async function deleteReminder(reminderId) {
  await deleteDoc(doc(db, 'reminders', reminderId));
}

export async function createNotification(userId, { message, type, relatedId }) {
  const notifData = {
    userId,
    message,
    type: type || 'info',
    relatedId: relatedId || null,
    read: false,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, `notifications/${userId}/items`), notifData);
  return { id: docRef.id, ...notifData };
}

export async function getNotifications(userId, limit = 20) {
  const q = query(collection(db, `notifications/${userId}/items`), orderBy('createdAt', 'desc'), limit(limit));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUnreadCount(userId) {
  const q = query(collection(db, `notifications/${userId}/items`), where('read', '==', false));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export async function markNotificationRead(userId, notifId) {
  await updateDoc(doc(db, `notifications/${userId}/items`, notifId), { read: true });
}

export async function markAllNotificationsRead(userId) {
  const notifs = await getNotifications(userId, 100);
  for (const notif of notifs) {
    if (!notif.read) {
      await updateDoc(doc(db, `notifications/${userId}/items`, notif.id), { read: true });
    }
  }
}

export async function checkInactivityReminders(teacherId) {
  const classes = await getTeacherClasses(teacherId);
  const now = new Date();
  
  for (const cls of classes) {
    const reminders = await getRemindersByClass(cls.id);
    const inactiveReminders = reminders.filter(r => r.active && r.triggerType === 'inactivity_days');
    
    if (inactiveReminders.length === 0) continue;
    
    const logsQuery = query(collection(db, 'waste_logs'), where('classId', '==', cls.id), orderBy('timestamp', 'desc'), limit(1));
    const logsSnap = await getDocs(logsQuery);
    
    if (logsSnap.empty) continue;
    
    const lastLog = logsSnap.docs[0].data();
    const lastDate = lastLog.timestamp?.toDate ? lastLog.timestamp.toDate() : new Date(lastLog.timestamp);
    const daysInactive = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    
    for (const reminder of inactiveReminders) {
      if (daysInactive >= reminder.thresholdDays) {
        await createNotification(teacherId, {
          message: `${cls.name} har ikke logget på ${daysInactive} dager`,
          type: 'inactivity',
          relatedId: cls.id,
        });
      }
    }
  }
}

export async function addReaction(eventId, userId, emoji) {
  const eventRef = doc(db, 'waste_logs', eventId);
  const eventSnap = await getDoc(eventRef);
  if (!eventSnap.exists()) return null;
  
  const eventData = eventSnap.data();
  const reactions = eventData.reactions || {};
  const emojiReactions = reactions[emoji] || [];
  
  let newReactions;
  if (emojiReactions.includes(userId)) {
    newReactions = {
      ...reactions,
      [emoji]: emojiReactions.filter(id => id !== userId),
    };
  } else {
    newReactions = {
      ...reactions,
      [emoji]: [...emojiReactions, userId],
    };
  }
  
  await updateDoc(eventRef, { reactions: newReactions });
  return newReactions;
}

export async function createGroupMessage(groupId, userId, displayName, text) {
  const messagesRef = collection(db, `groups/${groupId}/messages`);
  
  const countSnap = await getDocs(messagesRef);
  if (countSnap.size >= 100) {
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(10));
    const oldDocs = await getDocs(q);
    for (const oldDoc of oldDocs.docs) {
      await deleteDoc(oldDoc.ref);
    }
  }
  
  const messageData = {
    uid: userId,
    displayName,
    text,
    timestamp: serverTimestamp(),
  };
  
  const docRef = await addDoc(messagesRef, messageData);
  return { id: docRef.id, ...messageData };
}

export async function getGroupMessages(groupId, limit = 50) {
  const q = query(collection(db, `groups/${groupId}/messages`), orderBy('timestamp', 'desc'), limit(limit));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
}

export async function deleteGroupMessage(groupId, messageId) {
  await deleteDoc(doc(db, `groups/${groupId}/messages`, messageId));
}

export async function getAllSchoolLeaderboard() {
  const classesSnap = await getDocs(collection(db, 'classes'));
  const classes = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const schoolData = {};
  for (const cls of classes) {
    if (!cls.schoolId) continue;
    
    const schoolDoc = await getDoc(doc(db, 'schools', cls.schoolId));
    const schoolName = schoolDoc.exists() ? schoolDoc.data().name : 'Ukjent skole';
    
    const logsQuery = query(collection(db, 'waste_logs'), where('classId', '==', cls.id));
    const logsSnap = await getDocs(logsQuery);
    const weekKg = logsSnap.docs.reduce((sum, doc) => sum + (doc.data().weight || 0), 0);
    
    if (!schoolData[cls.schoolId]) {
      schoolData[cls.schoolId] = { schoolId: cls.schoolId, schoolName, weeklyKg: 0, classCount: 0 };
    }
    schoolData[cls.schoolId].weeklyKg += weekKg;
    schoolData[cls.schoolId].classCount += 1;
  }
  
  const schools = Object.values(schoolData).sort((a, b) => b.weeklyKg - a.weeklyKg);
  return schools.map((s, i) => ({ ...s, rank: i + 1 }));
}

export async function setClassWeeklyGoalKg(classId, goalKg) {
  await updateDoc(doc(db, 'classes', classId), { weeklyGoalKg: goalKg });
}

export async function getUserProfile(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  
  const userData = userDoc.data();
  const logs = await getUserLogs(uid);
  const badges = userData.badges || [];
  const eco = getEcoLevel(userData.ecoPoints || 0);
  
  return {
    ...userData,
    ecoLevel: eco.level,
    ecoIcon: eco.icon,
    recentLogs: logs.slice(0, 10),
    totalCo2Saved: (userData.totalWaste || 0) * 0.8,
  };
}

export async function linkChildToParent(parentUid, childUid) {
  const parentRef = doc(db, 'users', parentUid);
  await updateDoc(parentRef, { linkedChildUid: childUid });
}

export async function getParentChildData(parentUid) {
  const parentDoc = await getDoc(doc(db, 'users', parentUid));
  if (!parentDoc.exists()) return null;
  
  const childUid = parentDoc.data().linkedChildUid;
  if (!childUid) return null;
  
  return await getUserProfile(childUid);
}

export async function setUserLanguage(uid, language) {
  await updateDoc(doc(db, 'users', uid), { language });
}

export async function manualWeightEntry({ userId, binId, classId, weight, note }) {
  const logData = {
    userId,
    binId: binId || null,
    classId,
    weight: parseFloat(weight),
    type: 'manual',
    note: note || null,
    timestamp: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, 'waste_logs'), logData);
  
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    await updateDoc(userRef, {
      totalWaste: (userData.totalWaste || 0) + parseFloat(weight),
    });
  }

  await Promise.all([updateStreak(userId), checkAndGrantAchievements(userId)]);
  
  return { id: docRef.id, ...logData };
}

export async function getBinHistory(binId, maxItems = 50) {
  const q = query(collection(db, 'waste_logs'), where('binId', '==', binId), orderBy('timestamp', 'desc'), limit(maxItems));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateBinHealthStatus(binId) {
  const logsQuery = query(collection(db, 'waste_logs'), where('binId', '==', binId), orderBy('timestamp', 'desc'), limit(1));
  const logsSnap = await getDocs(logsQuery);
  
  let healthStatus = 'offline';
  if (!logsSnap.empty) {
    const lastLog = logsSnap.docs[0].data();
    const lastDate = lastLog.timestamp?.toDate ? lastLog.timestamp.toDate() : new Date(lastLog.timestamp);
    const hoursSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSince < 24) healthStatus = 'ok';
    else if (hoursSince < 72) healthStatus = 'inactive';
    else healthStatus = 'offline';
  }
  
  await updateDoc(doc(db, 'bins', binId), { healthStatus });
  return healthStatus;
}

export async function getAllBinsHealth() {
  const binsRef = collection(db, 'bins');
  const snapshot = await getDocs(binsRef);
  const bins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  for (const bin of bins) {
    await updateBinHealthStatus(bin.id);
  }
  
  return bins;
}

export async function setUserThemePreference(uid, preference) {
  await updateDoc(doc(db, 'users', uid), { themePreference: preference });
}

export async function getUserThemePreference(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return { mode: 'dark' };
  return userDoc.data().themePreference || { mode: 'dark' };
}

export async function addActivityEvent({ classId, message, type, uid }) {
  const eventData = {
    classId,
    message,
    type,
    uid,
    timestamp: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'activityFeed'), eventData);
  return { id: docRef.id, ...eventData };
}

export async function getActivityFeed(classId, maxItems = 20) {
  const q = query(collection(db, 'activityFeed'), where('classId', '==', classId), orderBy('timestamp', 'desc'), limit(maxItems));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function setUserFavorites(uid, favorites) {
  await updateDoc(doc(db, 'users', uid), { favorites: favorites.slice(0, 5) });
}

export async function getUserFavorites(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return [];
  return userDoc.data().favorites || [];
}

export async function getBinStats(binId) {
  const logsQuery = query(collection(db, 'waste_logs'), where('binId', '==', binId));
  const logsSnap = await getDocs(logsQuery);
  const logs = logsSnap.docs.map(doc => doc.data());
  
  const totalKg = logs.reduce((sum, l) => sum + (l.weight || 0), 0);
  const emptyingCount = logs.length;
  const avgKg = emptyingCount > 0 ? totalKg / emptyingCount : 0;
  
  let lastActive = null;
  const sortedLogs = logs.sort((a, b) => {
    const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
    const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
    return dateB - dateA;
  });
  if (sortedLogs.length > 0) {
    lastActive = sortedLogs[0].timestamp;
  }
  
  return { totalKg, emptyingCount, avgKg, lastActive };
}

export async function getAllBinsStats() {
  const binsRef = collection(db, 'bins');
  const snapshot = await getDocs(binsRef);
  const bins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const stats = await Promise.all(bins.map(async (bin) => {
    const binStats = await getBinStats(bin.id);
    return { ...bin, ...binStats };
  }));
  
  return stats.sort((a, b) => b.totalKg - a.totalKg);
}

export async function searchData(query, role, userId, classIds = []) {
  const results = { users: [], classes: [], bins: [], groups: [] };
  
  if (role === 'admin') {
    const usersQ = query(collection(db, 'users'), where('name', '>=', query), where('name', '<=', query + '\uf8ff'), limit(10));
    const usersSnap = await getDocs(usersQ);
    results.users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const classesQ = query(collection(db, 'classes'), where('name', '>=', query), where('name', '<=', query + '\uf8ff'), limit(10));
    const classesSnap = await getDocs(classesQ);
    results.classes = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const binsQ = query(collection(db, 'bins'), where('binId', '>=', query), where('binId', '<=', query + '\uf8ff'), limit(10));
    const binsSnap = await getDocs(binsQ);
    results.bins = binsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else if (role === 'teacher') {
    const classesQ = query(collection(db, 'classes'), where('teacherId', '==', userId));
    const classesSnap = await getDocs(classesQ);
    const teacherClassIds = classesSnap.docs.map(d => d.id);
    
    if (teacherClassIds.length > 0) {
      const usersQ = query(collection(db, 'users'), where('classId', 'in', teacherClassIds));
      const usersSnap = await getDocs(usersQ);
      results.users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.name?.toLowerCase().includes(query.toLowerCase()));
    }
  }
  
  return results;
}

function createConversationId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export async function createDirectMessage(senderUid, receiverUid, text) {
  const conversationId = createConversationId(senderUid, receiverUid);
  const messageData = {
    senderUid,
    receiverUid,
    text,
    read: false,
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, `directMessages/${conversationId}/messages`), messageData);
  
  const metaRef = doc(db, 'directMessages', conversationId);
  const metaSnap = await getDoc(metaRef);
  
  if (metaSnap.exists()) {
    const metaData = metaSnap.data();
    const unreadCounts = metaData.unreadCount || {};
    const senderKey = senderUid < receiverUid ? senderUid : receiverUid;
    const receiverKey = receiverUid < senderUid ? receiverUid : senderUid;
    await updateDoc(metaRef, {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      [`unreadCount.${receiverKey}`]: (unreadCounts[receiverKey] || 0) + 1,
    });
  } else {
    await setDoc(metaRef, {
      participants: [senderUid, receiverUid],
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      unreadCount: { [receiverUid]: 1 },
    });
  }
  
  return { id: docRef.id, conversationId, ...messageData };
}

export async function getConversations(uid) {
  const q = query(collection(db, 'directMessages'), where('participants', 'array-contains', uid), orderBy('lastMessageAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getDirectMessages(conversationId, uid, limit = 50) {
  const q = query(collection(db, `directMessages/${conversationId}/messages`), orderBy('createdAt', 'desc'), limit(limit));
  const snapshot = await getDocs(q);
  
  const metaRef = doc(db, 'directMessages', conversationId);
  const metaSnap = await getDoc(metaRef);
  if (metaSnap.exists()) {
    const metaData = metaSnap.data();
    const unreadCounts = metaData.unreadCount || {};
    const uidKey = Object.keys(unreadCounts).find(k => k === uid);
    if (uidKey && unreadCounts[uidKey] > 0) {
      await updateDoc(metaRef, { [`unreadCount.${uidKey}`]: 0 });
    }
  }
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
}

export async function getTotalUnreadMessages(uid) {
  const conversations = await getConversations(uid);
  let total = 0;
  for (const conv of conversations) {
    const uidKey = conv.participants?.find(p => p === uid);
    if (uidKey && conv.unreadCount) {
      total += conv.unreadCount[uidKey] || 0;
    }
  }
  return total;
}

export async function getOrCreateConversation(uid1, uid2) {
  const conversationId = createConversationId(uid1, uid2);
  const metaRef = doc(db, 'directMessages', conversationId);
  const metaSnap = await getDoc(metaRef);
  
  if (!metaSnap.exists()) {
    await setDoc(metaRef, {
      participants: [uid1, uid2],
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      unreadCount: {},
    });
  }
  
  return conversationId;
}

export async function createAnnouncement({ classId, authorUid, authorName, title, body, scheduledAt }) {
  const status = scheduledAt ? 'scheduled' : 'published';
  const announcementData = {
    classId,
    authorUid,
    authorName,
    title,
    body,
    scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
    publishedAt: scheduledAt ? null : serverTimestamp(),
    status,
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, 'announcements'), announcementData);
  return { id: docRef.id, ...announcementData };
}

export async function getAnnouncementsByClass(classId) {
  const q = query(collection(db, 'announcements'), where('classId', '==', classId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getActiveAnnouncement(classId) {
  const q = query(collection(db, 'announcements'), where('classId', '==', classId), where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function updateAnnouncement(announcementId, data) {
  await updateDoc(doc(db, 'announcements', announcementId), data);
}

export async function deleteAnnouncement(announcementId) {
  await deleteDoc(doc(db, 'announcements', announcementId));
}

export async function dismissAnnouncement(userId, announcementId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  
  const dismissed = userSnap.data().dismissedAnnouncements || [];
  await updateDoc(userRef, {
    dismissedAnnouncements: [...dismissed, announcementId],
  });
}

export async function getContentBlocks() {
  const snapshot = await getDocs(collection(db, 'content'));
  const blocks = {};
  snapshot.forEach(doc => {
    blocks[doc.id] = doc.data();
  });
  return blocks;
}

export async function updateContentBlock(contentId, value, updatedBy) {
  await setDoc(doc(db, 'content', contentId), {
    value,
    updatedBy,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getAllChallenges() {
  const snapshot = await getDocs(collection(db, 'challenges'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateChallenge(challengeId, data) {
  await updateDoc(doc(db, 'challenges', challengeId), data);
}

export async function createQuiz(weekId, questions) {
  const quizData = {
    weekId,
    questions,
    completedBy: {},
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'quizzes'), quizData);
  return { id: docRef.id, ...quizData };
}

export async function getAllQuizzes() {
  const snapshot = await getDocs(collection(db, 'quizzes'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateQuiz(quizId, questions) {
  await updateDoc(doc(db, 'quizzes', quizId), { questions });
}

export async function deleteQuiz(quizId) {
  await deleteDoc(doc(db, 'quizzes', quizId));
}

export async function updateSchoolWelcomeMessage(schoolId, message, updatedBy) {
  await updateDoc(doc(db, 'schools', schoolId), {
    welcomeMessage: message,
    welcomeMessageUpdatedBy: updatedBy,
    welcomeMessageUpdatedAt: serverTimestamp(),
  });
}

export async function dismissSchoolMessage(userId, schoolId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  
  const dismissed = userSnap.data().dismissedSchoolMessages || [];
  await updateDoc(userRef, {
    dismissedSchoolMessages: [...dismissed, schoolId],
  });
}

export async function getSchoolStats(schoolId) {
  const classesQ = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
  const classesSnap = await getDocs(classesQ);
  const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  let totalKgAllTime = 0;
  let totalKgWeek = 0;
  let totalEcoPoints = 0;
  let totalStudents = 0;
  const weekStart = getWeekStart();
  
  for (const cls of classes) {
    totalKgAllTime += cls.totalWaste || 0;
    totalEcoPoints += cls.totalPoints || 0;
    totalStudents += cls.studentCount || 0;
    
    const logsQ = query(collection(db, 'waste_logs'), where('classId', '==', cls.id), where('timestamp', '>=', weekStart.toISOString()));
    const logsSnap = await getDocs(logsQ);
    const weekLogs = logsSnap.docs.map(d => d.data());
    totalKgWeek += weekLogs.reduce((s, l) => s + (l.weight || 0), 0);
  }
  
  const binsQ = query(collection(db, 'bins'));
  const binsSnap = await getDocs(binsQ);
  const allBins = binsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const schoolBins = allBins.filter(b => classes.some(c => c.id === b.classId));
  
  let activeBins = 0, inactiveBins = 0, offlineBins = 0;
  for (const bin of schoolBins) {
    if (bin.healthStatus === 'ok') activeBins++;
    else if (bin.healthStatus === 'inactive') inactiveBins++;
    else offlineBins++;
  }
  
  const classStats = await Promise.all(classes.map(async (cls) => {
    const logsQ = query(collection(db, 'waste_logs'), where('classId', '==', cls.id), where('timestamp', '>=', weekStart.toISOString()));
    const logsSnap = await getDocs(logsQ);
    const weekKg = logsSnap.docs.reduce((s, d) => s + (d.data().weight || 0), 0);
    return { ...cls, weeklyKg: weekKg };
  }));
  
  return {
    schoolId,
    totalKgAllTime,
    totalKgWeek: parseFloat(totalKgWeek.toFixed(1)),
    totalEcoPoints,
    totalStudents,
    totalBins: schoolBins.length,
    activeBins,
    inactiveBins,
    offlineBins,
    classes: classStats.sort((a, b) => b.weeklyKg - a.weeklyKg),
  };
}

export async function getSeasonalChallenges() {
  const now = new Date();
  const q = query(collection(db, 'challenges'), where('seasonal', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => {
    const from = c.activeFrom ? new Date(c.activeFrom) : null;
    const to = c.activeTo ? new Date(c.activeTo) : null;
    if (from && now < from) return false;
    if (to && now > to) return false;
    return true;
  });
}

export async function getActiveCampaign() {
  const now = new Date();
  const q = query(collection(db, 'campaigns'), where('active', '==', true));
  const snapshot = await getDocs(q);
  const campaigns = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return campaigns.find(c => {
    const from = c.activeFrom ? new Date(c.activeFrom) : null;
    const to = c.activeTo ? new Date(c.activeTo) : null;
    if (from && now < from) return false;
    if (to && now > to) return false;
    return true;
  }) || null;
}

export async function createCampaign({ title, description, multiplier, activeFrom, activeTo, createdBy }) {
  const campaignData = {
    title,
    description,
    multiplier,
    activeFrom: activeFrom?.toISOString() || null,
    activeTo: activeTo?.toISOString() || null,
    createdBy,
    active: true,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'campaigns'), campaignData);
  return { id: docRef.id, ...campaignData };
}

export async function getAllCampaigns() {
  const snapshot = await getDocs(collection(db, 'campaigns'));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function toggleCampaign(campaignId, active) {
  await updateDoc(doc(db, 'campaigns', campaignId), { active });
}

export async function getWeeklyHero(classId) {
  const weekStart = getWeekStart();
  const studentsQ = query(collection(db, 'users'), where('classId', '==', classId), where('role', '==', 'student'));
  const studentsSnap = await getDocs(studentsQ);
  const students = studentsSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
  
  let bestStudent = null;
  let bestScore = -1;
  
  for (const student of students) {
    const logsQ = query(collection(db, 'waste_logs'), where('userId', '==', student.uid), where('timestamp', '>=', weekStart.toISOString()));
    const logsSnap = await getDocs(logsQ);
    const logs = logsSnap.docs.map(d => d.data());
    
    const weekPoints = logs.reduce((s, l) => s + (l.points || 0), 0);
    const checkIns = logs.filter(l => l.type === 'checkin').length;
    const streak = student.currentStreak || 0;
    
    const score = weekPoints * 0.5 + checkIns * 10 + streak * 2;
    
    if (score > bestScore) {
      bestScore = score;
      bestStudent = { ...student, score, weekPoints, checkIns, streak };
    }
  }
  
  return bestStudent;
}

export async function setWeeklyHero(classId, hero) {
  await updateDoc(doc(db, 'classes', classId), {
    weeklyHero: hero,
    weeklyHeroWeekStart: getWeekStart().toISOString(),
  });
}

export async function addMilestone(userId, milestoneId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  
  const milestones = userSnap.data().milestones || [];
  if (milestones.some(m => m.milestoneId === milestoneId)) return;
  
  await updateDoc(userRef, {
    milestones: [...milestones, { milestoneId, reachedAt: serverTimestamp() }],
  });
}

export async function checkMilestones(userId, totalWaste, streak, challengesCompleted) {
  const milestones = [];
  
  if (totalWaste >= 10 && totalWaste < 50) milestones.push('10kg');
  else if (totalWaste >= 50 && totalWaste < 100) milestones.push('50kg');
  else if (totalWaste >= 100) milestones.push('100kg');
  
  if (streak >= 7) milestones.push('7dayStreak');
  if (streak >= 30) milestones.push('30dayStreak');
  if (streak >= 100) milestones.push('100dayStreak');
  
  if (challengesCompleted >= 10) milestones.push('10challenges');
  
  const CO2_THRESHOLD = 18;
  if (totalWaste * 0.8 >= CO2_THRESHOLD) milestones.push('co2Tree');
  
  for (const m of milestones) {
    await addMilestone(userId, m);
  }
  
  return milestones;
}

export async function isEnvironmentDay() {
  const today = new Date();
  return today.getMonth() === 5 && today.getDate() === 5;
}

export async function updateEnvironmentDayStats() {
  const isToday = await isEnvironmentDay();
  if (!isToday) return null;
  
  const statsRef = doc(db, 'globalStats', 'environmentDay');
  const statsSnap = await getDoc(statsRef);
  
  const logsQ = query(collection(db, 'waste_logs'));
  const logsSnap = await getDocs(logsQ);
  const today = new Date().toDateString();
  const todayLogs = logsSnap.docs.filter(d => {
    const ts = d.data().timestamp;
    if (!ts) return false;
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toDateString() === today;
  });
  
  const totalKgToday = todayLogs.reduce((s, d) => s + (d.data().weight || 0), 0);
  
  const schoolsQ = query(collection(db, 'schools'));
  const schoolsSnap = await getDocs(schoolsQ);
  
  await setDoc(statsRef, {
    totalKgToday: parseFloat(totalKgToday.toFixed(1)),
    participatingSchools: schoolsSnap.size,
    updatedAt: serverTimestamp(),
  });
  
  return { totalKgToday, participatingSchools: schoolsSnap.size };
}

export async function isSkolestartMonth() {
  const today = new Date();
  return today.getMonth() === 7;
}

export async function getSeasonalBadges() {
  const snapshot = await getDocs(collection(db, 'badges'));
  const now = new Date();
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => {
    if (!b.seasonal) return false;
    const from = b.availableFrom ? new Date(b.availableFrom) : null;
    const to = b.availableTo ? new Date(b.availableTo) : null;
    if (from && now < from) return false;
    if (to && now > to) return false;
    return true;
  });
}

export async function awardSeasonalBadge(userId, badgeId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  
  const badges = userSnap.data().badges || [];
  if (badges.includes(badgeId)) return;
  
  await updateDoc(userRef, { badges: [...badges, badgeId] });
}

async function generateUniquePIN(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionsRef = collection(db, 'liveSessions');
    const q = query(sessionsRef, where('pin', '==', pin), where('status', 'in', ['lobby', 'question', 'results']));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return pin;
    }
  }
  throw new Error('Kunne ikke generere unik PIN');
}

export async function createLiveSession({ teacherUid, classId, questions, prizes, timeLimit }) {
  ensureFirebase();
  const pin = await generateUniquePIN();
  
  const sessionData = {
    classId,
    teacherUid,
    pin,
    status: 'lobby',
    currentQuestionIndex: -1,
    questions: questions.map((q, i) => ({
      ...q,
      timeLimit: timeLimit || 20,
    })),
    prizes: prizes || { first: 100, second: 75, third: 50 },
    createdAt: serverTimestamp(),
    startedAt: null,
    finishedAt: null,
    questionStartedAt: null,
  };
  
  const docRef = await addDoc(collection(db, 'liveSessions'), sessionData);
  return { sessionId: docRef.id, pin };
}

export async function getLiveSessionByPIN(pin) {
  ensureFirebase();
  const sessionsRef = collection(db, 'liveSessions');
  const q = query(sessionsRef, where('pin', '==', pin), where('status', 'in', ['lobby', 'question', 'results']));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function getLiveSession(sessionId) {
  ensureFirebase();
  const sessionDoc = await getDoc(doc(db, 'liveSessions', sessionId));
  if (!sessionDoc.exists()) return null;
  return { id: sessionDoc.id, ...sessionDoc.data() };
}

export async function joinLiveSession({ sessionId, uid, displayName }) {
  ensureFirebase();
  const playerRef = doc(db, 'liveSessions', sessionId, 'players', uid);
  const playerSnap = await getDoc(playerRef);
  
  const playerData = {
    uid,
    displayName,
    totalScore: playerSnap.exists() ? playerSnap.data().totalScore : 0,
    answers: playerSnap.exists() ? playerSnap.data().answers : [],
    joinedAt: serverTimestamp(),
  };
  
  await setDoc(playerRef, playerData, { merge: true });
  return playerData;
}

export async function submitAnswer({ sessionId, uid, questionIndex, answerIndex, timeMs }) {
  ensureFirebase();
  const session = await getLiveSession(sessionId);
  if (!session) throw new Error('Session not found');
  
  const question = session.questions[questionIndex];
  const correct = answerIndex === question.correctIndex;
  
  let pointsEarned = 0;
  if (correct) {
    const maxTime = question.timeLimit * 1000;
    const timeBonus = Math.max(0, 1 - (timeMs / maxTime));
    pointsEarned = Math.round(500 + (500 * timeBonus));
  }
  
  const playerRef = doc(db, 'liveSessions', sessionId, 'players', uid);
  const playerSnap = await getDoc(playerRef);
  const playerData = playerSnap.exists() ? playerSnap.data() : { answers: [], totalScore: 0 };
  
  const existingAnswerIdx = playerData.answers.findIndex(a => a.questionIndex === questionIndex);
  const newAnswers = [...playerData.answers];
  
  if (existingAnswerIdx >= 0) {
    if (pointsEarned > (newAnswers[existingAnswerIdx].pointsEarned || 0)) {
      newAnswers[existingAnswerIdx] = { questionIndex, answerIndex, correct, timeMs, pointsEarned };
    }
  } else {
    newAnswers.push({ questionIndex, answerIndex, correct, timeMs, pointsEarned });
  }
  
  const totalScore = newAnswers.reduce((s, a) => s + (a.pointsEarned || 0), 0);
  
  await updateDoc(playerRef, { answers: newAnswers, totalScore });
  
  return { correct, pointsEarned, totalScore };
}

export async function getSessionPlayers(sessionId) {
  ensureFirebase();
  const playersRef = collection(db, 'liveSessions', sessionId, 'players');
  const snapshot = await getDocs(playersRef);
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export async function updateSessionStatus(sessionId, status, additionalData = {}) {
  ensureFirebase();
  const updateData = { status, ...additionalData };
  if (status === 'question' && !additionalData.startedAt) {
    updateData.startedAt = serverTimestamp();
  }
  if (status === 'finished') {
    updateData.finishedAt = serverTimestamp();
  }
  await updateDoc(doc(db, 'liveSessions', sessionId), updateData);
}

export async function startQuestion(sessionId, questionIndex) {
  ensureFirebase();
  await updateDoc(doc(db, 'liveSessions', sessionId), {
    status: 'question',
    currentQuestionIndex: questionIndex,
    questionStartedAt: serverTimestamp(),
  });
}

export async function showResults(sessionId) {
  ensureFirebase();
  await updateDoc(doc(db, 'liveSessions', sessionId), { status: 'results' });
}

export async function endQuiz(sessionId) {
  ensureFirebase();
  const session = await getLiveSession(sessionId);
  if (!session) return;
  
  const players = await getSessionPlayers(sessionId);
  const sortedPlayers = players.sort((a, b) => b.totalScore - a.totalScore);
  
  const top3 = sortedPlayers.slice(0, 3);
  
  for (let i = 0; i < top3.length; i++) {
    const player = top3[i];
    const prizeAmount = i === 0 ? session.prizes.first : i === 1 ? session.prizes.second : session.prizes.third;
    
    if (prizeAmount > 0) {
      const userRef = doc(db, 'users', player.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentEcoPoints = userSnap.data().ecoPoints || 0;
        await updateDoc(userRef, { ecoPoints: currentEcoPoints + prizeAmount });
      }
    }
  }
  
  await updateDoc(doc(db, 'liveSessions', sessionId), {
    status: 'finished',
    finishedAt: serverTimestamp(),
    finalRankings: sortedPlayers.slice(0, 10).map((p, i) => ({
      rank: i + 1,
      uid: p.uid,
      displayName: p.displayName,
      totalScore: p.totalScore,
      prize: i < 3 ? (i === 0 ? session.prizes.first : i === 1 ? session.prizes.second : session.prizes.third) : 0,
    })),
  });
  
  return top3;
}

export async function getLeaderboardRank(userId, classId = null) {
  ensureFirebase();
  const usersRef = collection(db, 'users');
  let q;
  if (classId) {
    q = query(usersRef, where('role', '==', 'student'), where('classId', '==', classId), orderBy('ecoPoints', 'desc'));
  } else {
    q = query(usersRef, where('role', '==', 'student'), orderBy('ecoPoints', 'desc'));
  }
  const snapshot = await getDocs(q);
  const users = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
  const rank = users.findIndex(u => u.uid === userId) + 1;
  return { rank, total: users.length };
}

export async function createQuizNotification({ classId, teacherUid, teacherName, sessionId, pin }) {
  ensureFirebase();
  const students = await getClassStudents(classId);
  
  for (const student of students) {
    await addDoc(collection(db, 'notifications'), {
      userId: student.uid,
      message: `🎮 ${teacherName} har startet en live quiz! PIN: ${pin}`,
      type: 'quiz_invite',
      sessionId,
      pin,
      read: false,
      createdAt: serverTimestamp(),
    });
  }
}

export async function getQuizQuestionTemplates() {
  ensureFirebase();
  const questionsRef = collection(db, 'quizTemplates');
  const snapshot = await getDocs(questionsRef);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveQuizTemplate(teacherUid, questions) {
  ensureFirebase();
  const docRef = await addDoc(collection(db, 'quizTemplates'), {
    teacherUid,
    questions,
    createdAt: serverTimestamp(),
    usedCount: 0,
  });
  return docRef.id;
}

export async function addEcoPoints(userId, amount) {
  ensureFirebase();
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  
  const currentPoints = userSnap.data().ecoPoints || 0;
  await updateDoc(userRef, { ecoPoints: currentPoints + amount });
  
  return currentPoints + amount;
}

export async function addActivityFeedEntry(userId, message, type = 'quiz_win', points = 0) {
  ensureFirebase();
  await addDoc(collection(db, 'activityFeed'), {
    userId,
    message,
    type,
    points,
    createdAt: serverTimestamp(),
  });
}

export async function getAdmins() {
  ensureFirebase();
  const adminsRef = collection(db, 'admins');
  const snapshot = await getDocs(adminsRef);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function isAdmin(uid) {
  ensureFirebase();
  const adminDoc = await getDoc(doc(db, 'admins', uid));
  return adminDoc.exists();
}

export async function addAdmin(uid, email, name) {
  ensureFirebase();
  await setDoc(doc(db, 'admins', uid), {
    email,
    name: name || 'Administrator',
    addedAt: serverTimestamp(),
    addedBy: null,
  });
}

export async function removeAdmin(uid) {
  ensureFirebase();
  await deleteDoc(doc(db, 'admins', uid));
}

export async function getAllAdminUsers() {
  ensureFirebase();
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'admin'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export async function getQuizHistory(teacherUid = null, limitCount = 50) {
  ensureFirebase();
  const sessionsRef = collection(db, 'liveSessions');
  let q;
  if (teacherUid) {
    q = query(sessionsRef, where('teacherUid', '==', teacherUid), where('status', '==', 'finished'), orderBy('finishedAt', 'desc'), limit(limitCount));
  } else {
    q = query(sessionsRef, where('status', '==', 'finished'), orderBy('finishedAt', 'desc'), limit(limitCount));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      classId: data.classId,
      teacherUid: data.teacherUid,
      pin: data.pin,
      questionsCount: data.questions?.length || 0,
      prizes: data.prizes,
      createdAt: data.createdAt,
      startedAt: data.startedAt,
      finishedAt: data.finishedAt,
      finalRankings: data.finalRankings || [],
    };
  });
}

export async function getQuizHistoryForClass(classId) {
  ensureFirebase();
  const sessionsRef = collection(db, 'liveSessions');
  const q = query(
    sessionsRef, 
    where('classId', '==', classId), 
    where('status', '==', 'finished'), 
    orderBy('finishedAt', 'desc'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      questionsCount: data.questions?.length || 0,
      prizes: data.prizes,
      finishedAt: data.finishedAt,
      finalRankings: data.finalRankings || [],
      winner: data.finalRankings?.[0] || null,
    };
  });
}

export async function getQuizHistoryForStudent(studentUid) {
  ensureFirebase();
  const sessionsRef = collection(db, 'liveSessions');
  const q = query(
    sessionsRef, 
    where('status', '==', 'finished'), 
    orderBy('finishedAt', 'desc'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  const history = [];
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const playerRef = doc(db, 'liveSessions', docSnap.id, 'players', studentUid);
    const playerSnap = await getDoc(playerRef);
    
    if (playerSnap.exists()) {
      const playerData = playerSnap.data();
      const rankings = data.finalRankings || [];
      const myRank = rankings.findIndex(r => r.uid === studentUid) + 1;
      
      history.push({
        id: docSnap.id,
        questionsCount: data.questions?.length || 0,
        prizes: data.prizes,
        finishedAt: data.finishedAt,
        myScore: playerData.totalScore || 0,
        myRank: myRank || null,
        participated: true,
      });
    }
  }
  
  return history;
}

export async function addBonusPointsToUser(userId, points, reason) {
  ensureFirebase();
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error('User not found');
  }
  
  const currentPoints = userSnap.data().points || 0;
  await updateDoc(userRef, { points: currentPoints + points });
  
  await addDoc(collection(db, 'activityFeed'), {
    userId,
    message: `+${points} bonpoeng: ${reason}`,
    type: 'admin_bonus',
    points,
    timestamp: new Date().toISOString(),
  });
}

export async function addBonusPointsToClass(classId, points, reason) {
  ensureFirebase();
  const studentsRef = collection(db, 'users');
  const q = query(studentsRef, where('classId', '==', classId));
  const snapshot = await getDocs(q);
  
  const promises = [];
  for (const studentDoc of snapshot.docs) {
    promises.push(addBonusPointsToUser(studentDoc.id, points, reason));
  }
  
  await Promise.all(promises);
  return snapshot.size;
}

export async function resetUserPoints(userId) {
  ensureFirebase();
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { points: 0 });
}

export async function resetClassPoints(classId) {
  ensureFirebase();
  const studentsRef = collection(db, 'users');
  const q = query(studentsRef, where('classId', '==', classId));
  const snapshot = await getDocs(q);
  
  const promises = [];
  for (const studentDoc of snapshot.docs) {
    promises.push(resetUserPoints(studentDoc.id));
  }
  
  await Promise.all(promises);
  return snapshot.size;
}

export async function resetAllPoints() {
  ensureFirebase();
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'student'));
  const snapshot = await getDocs(q);
  
  const promises = [];
  for (const userDoc of snapshot.docs) {
    promises.push(resetUserPoints(userDoc.id));
  }
  
  await Promise.all(promises);
  return snapshot.size;
}

export async function resetAllWaste() {
  ensureFirebase();
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  const promises = [];
  for (const userDoc of snapshot.docs) {
    if (userDoc.data().role === 'student') {
      promises.push(updateDoc(doc(db, 'users', userDoc.id), { totalWaste: 0, points: 0 }));
    }
  }
  
  const logsRef = collection(db, 'waste_logs');
  const logsSnapshot = await getDocs(logsRef);
  for (const logDoc of logsSnapshot.docs) {
    promises.push(deleteDoc(doc(db, 'waste_logs', logDoc.id)));
  }
  
  await Promise.all(promises);
  return { usersReset: snapshot.docs.length, logsDeleted: logsSnapshot.size };
}

export async function deleteAllUsers() {
  ensureFirebase();
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  const promises = [];
  for (const userDoc of snapshot.docs) {
    if (userDoc.data().role !== 'admin') {
      promises.push(deleteDoc(doc(db, 'users', userDoc.id)));
    }
  }
  
  await Promise.all(promises);
  return snapshot.docs.length - 1;
}

export async function deleteAllClasses() {
  ensureFirebase();
  const classesRef = collection(db, 'classes');
  const snapshot = await getDocs(classesRef);
  
  const promises = [];
  for (const classDoc of snapshot.docs) {
    promises.push(deleteDoc(doc(db, 'classes', classDoc.id)));
  }
  
  await Promise.all(promises);
  return snapshot.size;
}
