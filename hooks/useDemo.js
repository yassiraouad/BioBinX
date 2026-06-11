import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'biobin-demo';
const CHANNEL_KEY = 'biobin-demo-sync';

export const DEMO_CREDENTIALS = {
  teacher: {
    role: 'teacher',
    email: 'teacher.demo@biobin.no',
    password: 'DemoTeacher123!',
  },
  student: {
    role: 'student',
    email: 'student.demo@biobin.no',
    password: 'DemoStudent123!',
  },
};

const demoSchool = {
  id: 'demo-school-1',
  name: 'Kurland skole',
};

const demoUsers = {
  teacher: {
    uid: 'demo-teacher-1',
    name: 'Ingrid Solheim',
    email: DEMO_CREDENTIALS.teacher.email,
    role: 'teacher',
    classId: 'class-6b',
    className: '6B',
    points: 760,
    ecoLevel: 'Gold',
    schoolId: demoSchool.id,
    schoolName: demoSchool.name,
  },
  student: {
    uid: 'demo-student-1',
    name: 'Sara Nilsen',
    email: DEMO_CREDENTIALS.student.email,
    role: 'student',
    classId: 'class-6b',
    className: '6B',
    points: 620,
    totalWaste: 14.8,
    schoolId: demoSchool.id,
    schoolName: demoSchool.name,
    badges: ['first_scan', 'weight_10', 'miljohelt', 'weekly_contributor'],
    groupId: 'group-matvoktere',
    groupName: 'Matvokterne',
  },
};

const baseClasses = [
  {
    id: 'class-6b',
    name: '6B',
    students: 24,
    weeklyStats: { weight: 18.4, empties: 9, streak: 6 },
    groups: ['Matvokterne', 'Resirkuleringsteam', 'Gronn patrulje'],
    code: 'KURL6B',
  },
  {
    id: 'class-6a',
    name: '6A',
    students: 23,
    weeklyStats: { weight: 16.9, empties: 8, streak: 4 },
    groups: ['Matreddere', 'Kompostlaget', 'Miljospeiderne'],
    code: 'KURL6A',
  },
  {
    id: 'class-5c',
    name: '5C',
    students: 21,
    weeklyStats: { weight: 13.8, empties: 7, streak: 3 },
    groups: ['Bioheltene', 'Gronne spirer', 'Naturdetektivene'],
    code: 'KURL5C',
  },
];

const bins = [
  { id: 'bin-6b-1', classId: 'class-6b', name: 'BioBin 6B-1', status: 'active', lastEmptied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'bin-6b-2', classId: 'class-6b', name: 'BioBin 6B-2', status: 'active', lastEmptied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'bin-6b-3', classId: 'class-6b', name: 'BioBin 6B-3', status: 'active', lastEmptied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'bin-6a-1', classId: 'class-6a', name: 'BioBin 6A-1', status: 'active', lastEmptied: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'bin-6a-2', classId: 'class-6a', name: 'BioBin 6A-2', status: 'active', lastEmptied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'bin-6a-3', classId: 'class-6a', name: 'BioBin 6A-3', status: 'active', lastEmptied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'bin-5c-1', classId: 'class-5c', name: 'BioBin 5C-1', status: 'active', lastEmptied: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'bin-5c-2', classId: 'class-5c', name: 'BioBin 5C-2', status: 'active', lastEmptied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'bin-5c-3', classId: 'class-5c', name: 'BioBin 5C-3', status: 'active', lastEmptied: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
];

const seededWeeklyWaste = [
  { day: 'Man', weight: 1.8 },
  { day: 'Tir', weight: 2.4 },
  { day: 'Ons', weight: 1.9 },
  { day: 'Tor', weight: 2.7 },
  { day: 'Fre', weight: 3.1 },
  { day: 'Lør', weight: 1.2 },
  { day: 'Søn', weight: 1.7 },
];

const seededStudentLeaderboard = [
  { uid: 'student-amir', name: 'Amir Hassan', points: 680, totalWaste: 16.2 },
  { uid: 'demo-student-1', name: 'Sara Nilsen', points: 620, totalWaste: 14.8 },
  { uid: 'student-emma', name: 'Emma Johansen', points: 590, totalWaste: 14.1 },
  { uid: 'student-lucas', name: 'Lucas Berg', points: 540, totalWaste: 12.6 },
  { uid: 'student-maja', name: 'Maja Olsen', points: 500, totalWaste: 11.8 },
];

const seededClassRanking = [
  { classId: 'class-6b', className: '6B', score: 124 },
  { classId: 'class-6a', className: '6A', score: 118 },
  { classId: 'class-5c', className: '5C', score: 97 },
];

const seededClassStudentsByClass = {
  'class-6b': [
    { id: 'st-6b-1', name: 'Sara Nilsen', points: 620 },
    { id: 'st-6b-2', name: 'Amir Hassan', points: 680 },
    { id: 'st-6b-3', name: 'Emma Johansen', points: 590 },
    { id: 'st-6b-4', name: 'Lucas Berg', points: 540 },
  ],
  'class-6a': [
    { id: 'st-6a-1', name: 'Maja Olsen', points: 500 },
    { id: 'st-6a-2', name: 'Lea Hauge', points: 472 },
    { id: 'st-6a-3', name: 'Noah Borge', points: 445 },
  ],
  'class-5c': [
    { id: 'st-5c-1', name: 'Iben Moe', points: 418 },
    { id: 'st-5c-2', name: 'Jonas Lie', points: 404 },
    { id: 'st-5c-3', name: 'Mina Strand', points: 391 },
  ],
};

const seededRecentScans = [
  { id: 'seed-1', user: 'Sara', className: '6B', weight: 2.7, points: 27, timestamp: Date.now() - 4 * 60 * 1000 },
  { id: 'seed-2', user: 'Amir', className: '6B', weight: 2.1, points: 21, timestamp: Date.now() - 13 * 60 * 1000 },
  { id: 'seed-3', user: 'Emma', className: '6A', weight: 1.6, points: 16, timestamp: Date.now() - 27 * 60 * 1000 },
  { id: 'seed-4', user: 'Lucas', className: '5C', weight: 1.3, points: 13, timestamp: Date.now() - 52 * 60 * 1000 },
];

const initialLocalState = {
  scans: 8,
  totalWeight: 14.8,
  co2Saved: 22.4,
  points: 620,
  streak: 6,
  weeklyQuizScore: 0,
  completedChallenges: [],
  reactions: [],
  recentScans: seededRecentScans,
  lastCheckin: null,
  updatedAt: Date.now(),
};

function cloneInitialLocalState() {
  return {
    ...initialLocalState,
    recentScans: [...seededRecentScans],
    reactions: [],
    completedChallenges: [],
    updatedAt: Date.now(),
  };
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getComputedDemoData(localState, activeDemoUser) {
  const baseStudentWeight = 14.8;
  const weightDelta = localState.totalWeight - baseStudentWeight;
  const class6BWeight = 18.4 + weightDelta;
  const class6BEmpties = 9 + Math.max(localState.scans - 8, 0);

  const classesWithUpdates = baseClasses.map((cls) => {
    if (cls.id !== 'class-6b') return { ...cls };
    return {
      ...cls,
      weeklyStats: {
        ...cls.weeklyStats,
        weight: Number(class6BWeight.toFixed(1)),
        empties: class6BEmpties,
        streak: localState.streak,
      },
    };
  });

  const dashboard = {
    totalWasteKg: Number(localState.totalWeight.toFixed(1)),
    energyGeneratedKwh: Number((localState.totalWeight * (33.6 / 14.8)).toFixed(1)),
    co2SavedKg: Number((localState.totalWeight * (22.4 / 14.8)).toFixed(1)),
    ecoPoints: localState.points,
    weeklyGoalKg: 20,
    progressPercent: Math.min(100, Math.round((localState.totalWeight / 20) * 100)),
  };

  const classRanking = seededClassRanking
    .map((entry) => {
      if (entry.classId !== 'class-6b') return entry;
      const scoreDelta = Math.round(weightDelta * 2);
      return { ...entry, score: entry.score + scoreDelta };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const leaderboard = classRanking.map((entry) => {
    const matchingClass = classesWithUpdates.find((cls) => cls.id === entry.classId);
    return {
      classId: entry.classId,
      className: entry.className,
      score: entry.score,
      weight: matchingClass?.weeklyStats?.weight || 0,
      rank: entry.rank,
    };
  });

  const studentBadges = [
    { id: 'first_scan', name: 'Første kast', icon: '🌱', description: 'Registrer ditt første kast', earned: localState.scans > 0 },
    { id: 'weight_10', name: '10kg samlet', icon: '⚖️', description: 'Samle minst 10 kg matavfall', earned: localState.totalWeight >= 10 },
    { id: 'miljohelt', name: 'Miljøhelt', icon: '♻️', description: 'Nå 600 EcoPoints', earned: localState.points >= 600 },
    { id: 'weekly_contributor', name: 'Ukens bidragsyter', icon: '🏅', description: 'Vær blant topp 3 i klassen', earned: true },
  ];

  const targetWeight = 20;
  const challengeProgress = Math.min(localState.totalWeight / targetWeight, 1);

  return {
    school: demoSchool,
    dashboard,
    classes: classesWithUpdates,
    bins,
    weeklyWasteData: seededWeeklyWaste,
    studentLeaderboard: seededStudentLeaderboard,
    classRanking,
    classStudentsByClass: seededClassStudentsByClass,
    insight: '6B kaster mest mat på fredager. Reduserer dere dette med 20%, kan skolen spare ca. 1 200 kr per måned.',
    impact: {
      homesPowered: 2,
      phoneCharges: 420,
      mealsSaved: 35,
    },
    studentBadges,
    recentScans: localState.recentScans,
    challenges: [
      {
        id: 'challenge-1',
        title: 'Nå ukesmål på 20kg',
        description: 'Klassen samler 20kg matavfall denne uken',
        targetWeight,
        currentWeight: Number(localState.totalWeight.toFixed(1)),
        progress: challengeProgress,
        classId: 'class-6b',
        status: challengeProgress >= 1 ? 'completed' : 'active',
      },
      {
        id: 'challenge-2',
        title: 'Tøm bøtten 5 dager på rad',
        description: 'Tøm biobøtten hver dag i 5 dager',
        targetStreak: 5,
        currentStreak: localState.streak,
        progress: Math.min(localState.streak / 5, 1),
        classId: 'class-6b',
        status: localState.streak >= 5 ? 'completed' : 'active',
      },
    ],
    co2Prognose: {
      nextMonth: Number((dashboard.co2SavedKg * 4).toFixed(0)),
      nextYear: Number((dashboard.co2SavedKg * 48).toFixed(0)),
      aiSummary: '6B kaster mest mat på fredager. Reduserer dere dette med 20%, kan skolen spare ca. 1 200 kr per måned.',
    },
    leaderboard,
    demoUser: activeDemoUser,
  };
}

const DemoContext = createContext({});

export function DemoProvider({ children }) {
  const [isDemo, setIsDemo] = useState(false);
  const [demoUser, setDemoUser] = useState(null);
  const [localState, setLocalState] = useState(cloneInitialLocalState());
  const channelRef = useRef(null);
  const isDemoRef = useRef(false);
  const demoUserRef = useRef(null);

  useEffect(() => {
    isDemoRef.current = isDemo;
    demoUserRef.current = demoUser;
  }, [isDemo, demoUser]);

  const persistDemoState = (nextUser, nextLocalState, enabled = true) => {
    if (typeof window === 'undefined') return;

    if (!enabled || !nextUser) {
      localStorage.removeItem(STORAGE_KEY);
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'clear' });
      }
      return;
    }

    const payload = {
      isDemo: true,
      demoUser: nextUser,
      localState: { ...nextLocalState, updatedAt: Date.now() },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'update', payload });
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyPayload = (payload) => {
      if (!payload || !payload.isDemo || !payload.demoUser || !payload.localState) return;

      setIsDemo(true);
      setDemoUser(payload.demoUser);
      setLocalState((prev) => {
        const incomingTs = payload.localState.updatedAt || 0;
        const currentTs = prev.updatedAt || 0;
        return incomingTs >= currentTs ? payload.localState : prev;
      });
    };

    const stored = safeParse(localStorage.getItem(STORAGE_KEY));
    if (stored?.isDemo) {
      applyPayload(stored);
    }

    if (typeof window.BroadcastChannel !== 'undefined') {
      channelRef.current = new window.BroadcastChannel(CHANNEL_KEY);
      channelRef.current.onmessage = (event) => {
        const message = event.data;
        if (message?.type === 'clear') {
          setIsDemo(false);
          setDemoUser(null);
          setLocalState(cloneInitialLocalState());
          return;
        }
        if (message?.type === 'update') {
          applyPayload(message.payload);
        }
      };
    }

    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      if (!event.newValue) {
        setIsDemo(false);
        setDemoUser(null);
        setLocalState(cloneInitialLocalState());
        return;
      }

      const payload = safeParse(event.newValue);
      applyPayload(payload);
    };

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  const startDemo = (role = 'teacher') => {
    const selectedRole = role === 'student' ? 'student' : 'teacher';
    const selectedUser = demoUsers[selectedRole];
    const nextLocalState = cloneInitialLocalState();

    setIsDemo(true);
    setDemoUser(selectedUser);
    setLocalState(nextLocalState);
    persistDemoState(selectedUser, nextLocalState, true);
  };

  const startDemoWithCredentials = ({ email, password }) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const matched = Object.values(DEMO_CREDENTIALS).find(
      (cred) => cred.email.toLowerCase() === normalizedEmail && cred.password === password
    );

    if (!matched) return null;

    startDemo(matched.role);
    return matched.role;
  };

  const switchDemoRole = (role) => {
    if (!isDemoRef.current) return;
    const selectedRole = role === 'student' ? 'student' : 'teacher';
    const selectedUser = demoUsers[selectedRole];
    setDemoUser(selectedUser);
    persistDemoState(selectedUser, localState, true);
  };

  const exitDemo = () => {
    setIsDemo(false);
    setDemoUser(null);
    setLocalState(cloneInitialLocalState());
    persistDemoState(null, null, false);
  };

  const updateLocalState = (updates) => {
    setLocalState((prev) => {
      const patch = typeof updates === 'function' ? updates(prev) : updates;
      const next = {
        ...prev,
        ...patch,
        updatedAt: Date.now(),
      };

      if (isDemoRef.current && demoUserRef.current) {
        persistDemoState(demoUserRef.current, next, true);
      }

      return next;
    });
  };

  const addScan = (weight, metadata = {}) => {
    const numericWeight = Number(weight || 0);
    if (!numericWeight || numericWeight <= 0) return;

    const co2Saved = numericWeight * 0.68;
    const points = Math.round(numericWeight * 10);

    updateLocalState((prev) => ({
      scans: prev.scans + 1,
      totalWeight: Number((prev.totalWeight + numericWeight).toFixed(2)),
      co2Saved: Number((prev.co2Saved + co2Saved).toFixed(2)),
      points: prev.points + points,
      recentScans: [
        {
          id: `scan-${Date.now()}`,
          user: metadata.user || demoUserRef.current?.name?.split(' ')[0] || 'Demo',
          className: metadata.className || demoUserRef.current?.className || '6B',
          weight: Number(numericWeight.toFixed(1)),
          points,
          timestamp: Date.now(),
        },
        ...(prev.recentScans || []),
      ].slice(0, 20),
    }));
  };

  const addReaction = (type) => {
    updateLocalState((prev) => ({
      reactions: [...(prev.reactions || []), { type, timestamp: Date.now() }],
    }));
  };

  const completeChallenge = (challengeId) => {
    updateLocalState((prev) => {
      if ((prev.completedChallenges || []).includes(challengeId)) return prev;
      return {
        completedChallenges: [...(prev.completedChallenges || []), challengeId],
      };
    });
  };

  const demoData = useMemo(
    () => getComputedDemoData(localState, demoUser || demoUsers.teacher),
    [localState, demoUser]
  );

  const value = {
    isDemo,
    demoUser,
    demoData,
    localState,
    demoCredentials: DEMO_CREDENTIALS,
    startDemo,
    startDemoWithCredentials,
    switchDemoRole,
    exitDemo,
    updateLocalState,
    addScan,
    addReaction,
    completeChallenge,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export const useDemo = () => useContext(DemoContext);
