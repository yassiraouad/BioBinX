import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  addDoc,
  serverTimestamp,
} from './firebase';

const MILESTONE_REWARDS = {
  3: 25,
  7: 75,
  14: 150,
  30: 400,
};

function toDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayDiff(fromDate, toDate = new Date()) {
  const from = dateKey(fromDate);
  const to = dateKey(toDate);
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

export async function updateStreak(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error('User not found');
  }

  const userData = userSnap.data();
  const now = new Date();
  const lastWasteDate = toDate(userData.lastWasteDate);
  const currentStreak = userData.currentStreak || 0;
  const longestStreak = userData.longestStreak || 0;

  let nextStreak = 1;

  if (lastWasteDate) {
    const diff = dayDiff(lastWasteDate, now);
    if (diff === 0) {
      nextStreak = currentStreak;
    } else if (diff === 1) {
      nextStreak = currentStreak + 1;
    } else {
      nextStreak = 1;
    }
  }

  const nextLongest = Math.max(longestStreak, nextStreak);
  const rewards = [];

  if (nextStreak !== currentStreak && MILESTONE_REWARDS[nextStreak]) {
    rewards.push({ streak: nextStreak, points: MILESTONE_REWARDS[nextStreak] });
  }

  const bonusPoints = rewards.reduce((sum, reward) => sum + reward.points, 0);

  await updateDoc(userRef, {
    currentStreak: nextStreak,
    longestStreak: nextLongest,
    lastWasteDate: now.toISOString(),
    ...(bonusPoints > 0 ? { points: (userData.points || 0) + bonusPoints } : {}),
  });

  if (rewards.length > 0) {
    await addDoc(collection(db, 'activityFeed'), {
      uid,
      type: 'streak_milestone',
      message: `Streak-mål nådd: ${nextStreak} dager (+${bonusPoints} EcoPoints)`,
      points: bonusPoints,
      timestamp: serverTimestamp(),
    });
  }

  return {
    currentStreak: nextStreak,
    longestStreak: nextLongest,
    milestoneRewards: rewards,
    bonusPoints,
  };
}

export async function getTopStreaksByClass(classId, max = 5) {
  if (!classId) return [];

  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('classId', '==', classId),
    where('role', '==', 'student'),
    orderBy('currentStreak', 'desc'),
    orderBy('points', 'desc'),
    limit(max)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap, index) => {
    const data = docSnap.data();
    return {
      rank: index + 1,
      uid: docSnap.id,
      name: data.name || 'Ukjent elev',
      currentStreak: data.currentStreak || 0,
      longestStreak: data.longestStreak || 0,
      points: data.points || 0,
    };
  });
}

export async function syncStreakDecay(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return { reset: false, currentStreak: 0 };

  const userData = userSnap.data();
  const lastWasteDate = toDate(userData.lastWasteDate);
  const currentStreak = userData.currentStreak || 0;

  if (!lastWasteDate || currentStreak === 0) {
    return { reset: false, currentStreak };
  }

  const diff = dayDiff(lastWasteDate, new Date());
  if (diff >= 2) {
    await updateDoc(userRef, { currentStreak: 0 });
    return { reset: true, currentStreak: 0 };
  }

  return { reset: false, currentStreak };
}
