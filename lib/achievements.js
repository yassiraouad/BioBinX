import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from './firebase';

const DAY_MS = 24 * 60 * 60 * 1000;

export const ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_waste', name: 'Første Kast', description: 'Registrer ditt første avfall', icon: '🌱', condition: { type: 'logs_count', threshold: 1 } },
  { id: 'streak_7', name: '7-dagers Streak', description: 'Kast avfall 7 dager på rad', icon: '🔥', condition: { type: 'current_streak', threshold: 7 } },
  { id: 'class_master', name: 'Klassemester', description: 'Bli nr. 1 på skolens leaderboard', icon: '🥇', condition: { type: 'school_rank', threshold: 1 } },
  { id: 'co2_100', name: '100kg CO2 spart', description: 'Klassen har spart 100 kg CO2', icon: '💨', condition: { type: 'class_co2_saved', threshold: 100 } },
  { id: 'perfectionist', name: 'Perfectionist', description: '0 feil-sorteringer en hel uke', icon: '✅', condition: { type: 'zero_missort_week', threshold: 1 } },
  { id: 'early_bird', name: 'Early Bird', description: 'Registrer avfall før kl. 09:00 fem ganger', icon: '🌅', condition: { type: 'early_logs', threshold: 5 } },
  { id: 'green_hero', name: 'Grønn Helt', description: '30 dager sammenhengende streak', icon: '🦸', condition: { type: 'current_streak', threshold: 30 } },
  { id: 'teamplayer', name: 'Teamplayer', description: 'Bidra til at klassen øker EcoPoints med 500 på én uke', icon: '🤝', condition: { type: 'class_week_points', threshold: 500 } },
  { id: 'waste_detective', name: 'Søppeldetektiv', description: 'Rapporter feil-sortert avfall 3 ganger', icon: '🕵️', condition: { type: 'reported_missort', threshold: 3 } },
  { id: 'eco_ambassador', name: 'Miljøambassadør', description: 'Del resultater med klassen 5 ganger', icon: '📣', condition: { type: 'shared_results', threshold: 5 } },
  { id: 'bin_master', name: 'Bøttemester', description: 'Tøm din tildelte bin 10 ganger', icon: '🗑️', condition: { type: 'bin_emptyings', threshold: 10 } },
  { id: 'record_breaker', name: 'Rekordbryter', description: 'Slå klassens forrige ukesrekord', icon: '🚀', condition: { type: 'beat_last_week_record', threshold: 1 } },
];

function getDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekStart(now = new Date()) {
  const d = startOfDay(now);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function toProgress(current, threshold) {
  if (!threshold || threshold <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / threshold) * 100)));
}

async function ensureAchievementsSeeded() {
  const writes = ACHIEVEMENT_DEFINITIONS.map((achievement) =>
    setDoc(
      doc(db, 'achievements', achievement.id),
      {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        condition: achievement.condition,
      },
      { merge: true }
    )
  );
  await Promise.all(writes);
}

async function getUserContext(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error('User not found');
  }

  const user = { uid: userSnap.id, ...userSnap.data() };
  const classRef = user.classId ? doc(db, 'classes', user.classId) : null;
  const classSnap = classRef ? await getDoc(classRef) : null;
  const classData = classSnap?.exists() ? { id: classSnap.id, ...classSnap.data() } : null;

  return { user, classData };
}

async function getLogs(uid, classId) {
  const logsByUserQ = query(collection(db, 'waste_logs'), where('userId', '==', uid));
  const userSnap = await getDocs(logsByUserQ);
  const userLogs = userSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

  if (!classId) {
    return { userLogs, classLogs: [] };
  }

  const logsByClassQ = query(collection(db, 'waste_logs'), where('classId', '==', classId));
  const classSnap = await getDocs(logsByClassQ);
  const classLogs = classSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  return { userLogs, classLogs };
}

function evaluateProgress(definition, context) {
  const { user, classData, userLogs, classLogs } = context;
  const now = new Date();
  const weekStartDate = weekStart(now);
  const prevWeekStart = new Date(weekStartDate.getTime() - 7 * DAY_MS);

  switch (definition.condition.type) {
    case 'logs_count': {
      const current = userLogs.length;
      const threshold = definition.condition.threshold;
      return { current, threshold, unlocked: current >= threshold };
    }
    case 'current_streak': {
      const current = user.currentStreak || 0;
      const threshold = definition.condition.threshold;
      return { current, threshold, unlocked: current >= threshold };
    }
    case 'school_rank': {
      if (!classData?.schoolId) return { current: 0, threshold: 1, unlocked: false };
      const current = user.schoolRank || 999;
      return { current: current === 999 ? 0 : 1, threshold: 1, unlocked: current === 1 };
    }
    case 'class_co2_saved': {
      const classWaste = classData?.totalWaste || classLogs.reduce((sum, log) => sum + (log.weight || 0), 0);
      const current = classWaste * 0.8;
      const threshold = definition.condition.threshold;
      return { current, threshold, unlocked: current >= threshold };
    }
    case 'zero_missort_week': {
      const weekLogs = userLogs.filter((log) => {
        const date = getDate(log.timestamp);
        return date && date >= weekStartDate;
      });
      const hasMissort = weekLogs.some((log) => log.verifiedOrganic === false);
      const current = weekLogs.length > 0 && !hasMissort ? 1 : 0;
      return { current, threshold: 1, unlocked: current === 1 };
    }
    case 'early_logs': {
      const earlyCount = userLogs.filter((log) => {
        const date = getDate(log.timestamp);
        return date && date.getHours() < 9;
      }).length;
      const threshold = definition.condition.threshold;
      return { current: earlyCount, threshold, unlocked: earlyCount >= threshold };
    }
    case 'class_week_points': {
      const weekPoints = classLogs
        .filter((log) => {
          const date = getDate(log.timestamp);
          return date && date >= weekStartDate;
        })
        .reduce((sum, log) => sum + (log.points || 0), 0);
      const threshold = definition.condition.threshold;
      return { current: weekPoints, threshold, unlocked: weekPoints >= threshold };
    }
    case 'reported_missort': {
      const current = user.reportedMisSortCount || 0;
      const threshold = definition.condition.threshold;
      return { current, threshold, unlocked: current >= threshold };
    }
    case 'shared_results': {
      const current = user.sharedResultsCount || 0;
      const threshold = definition.condition.threshold;
      return { current, threshold, unlocked: current >= threshold };
    }
    case 'bin_emptyings': {
      const empties = userLogs.filter((log) => Boolean(log.binId)).length;
      const threshold = definition.condition.threshold;
      return { current: empties, threshold, unlocked: empties >= threshold };
    }
    case 'beat_last_week_record': {
      const thisWeek = classLogs
        .filter((log) => {
          const date = getDate(log.timestamp);
          return date && date >= weekStartDate;
        })
        .reduce((sum, log) => sum + (log.weight || 0), 0);
      const prevWeek = classLogs
        .filter((log) => {
          const date = getDate(log.timestamp);
          return date && date >= prevWeekStart && date < weekStartDate;
        })
        .reduce((sum, log) => sum + (log.weight || 0), 0);
      return { current: thisWeek, threshold: Math.max(prevWeek, 0.01), unlocked: thisWeek > prevWeek && prevWeek > 0 };
    }
    default:
      return { current: 0, threshold: 1, unlocked: false };
  }
}

async function computeSchoolRank(user, classData) {
  if (!classData?.schoolId) return 999;
  const schoolClassesQ = query(collection(db, 'classes'), where('schoolId', '==', classData.schoolId));
  const schoolClassesSnap = await getDocs(schoolClassesQ);
  const classIds = schoolClassesSnap.docs.map((docSnap) => docSnap.id);
  if (!classIds.length) return 999;

  const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'), where('classId', 'in', classIds), orderBy('points', 'desc'), limit(100));
  const studentsSnap = await getDocs(studentsQ);
  const idx = studentsSnap.docs.findIndex((docSnap) => docSnap.id === user.uid);
  return idx >= 0 ? idx + 1 : 999;
}

export async function checkAndGrantAchievements(uid) {
  await ensureAchievementsSeeded();

  const { user, classData } = await getUserContext(uid);
  const { userLogs, classLogs } = await getLogs(uid, user.classId);
  const schoolRank = await computeSchoolRank(user, classData);

  const context = {
    user: { ...user, schoolRank },
    classData,
    userLogs,
    classLogs,
  };

  const unlockedNow = [];

  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    const progress = evaluateProgress(definition, context);
    const userAchievementRef = doc(db, 'users', uid, 'achievements', definition.id);
    const currentSnap = await getDoc(userAchievementRef);
    const alreadyUnlocked = currentSnap.exists() && Boolean(currentSnap.data().unlockedAt);

    if (progress.unlocked && !alreadyUnlocked) {
      await setDoc(
        userAchievementRef,
        {
          achievementId: definition.id,
          unlockedAt: serverTimestamp(),
          progress: {
            current: progress.current,
            threshold: progress.threshold,
            percent: 100,
          },
          icon: definition.icon,
          name: definition.name,
          description: definition.description,
        },
        { merge: true }
      );
      unlockedNow.push(definition.id);
    } else {
      await setDoc(
        userAchievementRef,
        {
          achievementId: definition.id,
          progress: {
            current: progress.current,
            threshold: progress.threshold,
            percent: toProgress(progress.current, progress.threshold),
          },
          icon: definition.icon,
          name: definition.name,
          description: definition.description,
        },
        { merge: true }
      );
    }
  }

  return { unlockedNow };
}

export async function getUserAchievementsProgress(uid) {
  await ensureAchievementsSeeded();

  const definitionsSnap = await getDocs(query(collection(db, 'achievements')));
  const definitions = definitionsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

  const userSnap = await getDocs(query(collection(db, 'users', uid, 'achievements')));
  const userMap = new Map(userSnap.docs.map((docSnap) => [docSnap.id, docSnap.data()]));

  return definitions
    .sort((a, b) => a.name.localeCompare(b.name, 'nb-NO'))
    .map((definition) => {
      const progressData = userMap.get(definition.id) || {};
      const unlockedAtDate = getDate(progressData.unlockedAt);
      return {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        icon: definition.icon,
        condition: definition.condition,
        unlockedAt: unlockedAtDate ? unlockedAtDate.toISOString() : null,
        unlocked: Boolean(progressData.unlockedAt),
        progress: {
          current: progressData.progress?.current || 0,
          threshold: progressData.progress?.threshold || definition.condition?.threshold || 1,
          percent: progressData.progress?.percent || 0,
        },
      };
    });
}
