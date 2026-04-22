import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { generateDailyChallenges, Challenge } from './geminiService';

export interface UserStats {
  uid: string;
  displayName: string;
  photoURL: string;
  totalPoints: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
}

const getTodayStr = () => new Date().toISOString().split('T')[0];

export async function getChallengesForToday(): Promise<Challenge[]> {
  const today = getTodayStr();
  const challengeRef = doc(db, 'challenges', today);
  
  const snap = await getDoc(challengeRef);
  if (snap.exists()) {
    return snap.data().challenges;
  }

  // Generate once and cache for everyone
  const newChallenges = await generateDailyChallenges();
  await setDoc(challengeRef, {
    date: today,
    challenges: newChallenges
  });

  return newChallenges;
}

export async function completeChallenge(userId: string, challenge: Challenge, currentStats: UserStats) {
  const today = getTodayStr();
  const completionId = `${userId}_${challenge.id}`;
  const completionRef = doc(db, 'completions', completionId);
  
  // Check if already completed
  const snap = await getDoc(completionRef);
  if (snap.exists()) return;

  // Record completion
  await setDoc(completionRef, {
    userId,
    challengeId: challenge.id,
    points: challenge.points,
    date: today,
    timestamp: serverTimestamp()
  });

  // Update user stats
  const userRef = doc(db, 'users', userId);
  
  let newStreak = currentStats.streak;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (currentStats.lastActiveDate === yesterdayStr) {
    // If they were active yesterday, they might need to complete ALL 3 to increment?
    // Actually simplicity: First completion of the day increments streak? 
    // No, common pattern: Complete at least one task per day to keep streak.
    if (currentStats.lastActiveDate !== today) {
      newStreak += 1;
    }
  } else if (currentStats.lastActiveDate !== today) {
    // Streak reset if hasn't been active today and wasn't active yesterday
    newStreak = 1;
  }

  await updateDoc(userRef, {
    totalPoints: increment(challenge.points),
    streak: newStreak,
    lastActiveDate: today
  });
}

export function subscribeToLeaderboard(callback: (users: UserStats[]) => void) {
  const q = query(
    collection(db, 'users'),
    orderBy('totalPoints', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snap) => {
    const users = snap.docs.map(doc => doc.data() as UserStats);
    callback(users);
  });
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as UserStats;
  }
  return null;
}

export async function createUserProfile(user: any) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const freshStats: UserStats = {
      uid: user.uid,
      displayName: user.displayName || 'Hero',
      photoURL: user.photoURL || '',
      totalPoints: 0,
      streak: 0,
      lastActiveDate: ''
    };
    await setDoc(userRef, freshStats);
    return freshStats;
  }
  return snap.data() as UserStats;
}
