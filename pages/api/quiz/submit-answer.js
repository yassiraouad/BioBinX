import { NextResponse } from 'next/server';
import { db, doc, getDoc, updateDoc, serverTimestamp } from '../../../firebase/config';

const rateLimits = new Map();

function checkRateLimit(key, maxRequests = 30, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimits.get(key) || { count: 0, resetAt: now + windowMs };
  
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }
  
  record.count++;
  rateLimits.set(key, record);
  
  if (record.count > maxRequests) {
    return false;
  }
  return true;
}

export async function POST(request) {
  try {
    const { sessionId, uid, questionIndex, answerIndex } = await request.json();

    if (!sessionId || !uid || questionIndex === undefined || answerIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rateKey = `quiz_${uid}`;
    if (!checkRateLimit(rateKey, 60, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const sessionRef = doc(db, 'liveSessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionSnap.data();
    
    if (session.status !== 'question') {
      return NextResponse.json({ error: 'Quiz not in progress' }, { status: 400 });
    }

    if (session.currentQuestionIndex !== questionIndex) {
      return NextResponse.json({ error: 'Question already changed' }, { status: 400 });
    }

    const question = session.questions[questionIndex];
    if (!question) {
      return NextResponse.json({ error: 'Invalid question' }, { status: 400 });
    }

    const questionStartTime = session.questionStartedAt?.toMillis?.() || Date.now();
    const maxTime = question.timeLimit * 1000;
    const serverTime = Date.now();
    const timeMs = Math.min(serverTime - questionStartTime, maxTime);

    if (timeMs > maxTime) {
      return NextResponse.json({ error: 'Time expired' }, { status: 400 });
    }

    const correct = answerIndex === question.correctIndex;
    let pointsEarned = 0;
    
    if (correct) {
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

    return NextResponse.json({
      correct,
      pointsEarned,
      totalScore,
      serverTime
    });

  } catch (error) {
    console.error('Quiz answer error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
