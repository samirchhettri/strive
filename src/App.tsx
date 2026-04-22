/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { 
  getChallengesForToday, 
  completeChallenge, 
  getUserStats, 
  createUserProfile,
  UserStats,
  subscribeToLeaderboard
} from './services/challengeService';
import { Challenge } from './services/geminiService';
import { ChallengeCard, StatBadge, LeaderboardItem } from './components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Award, 
  Trophy, 
  LogOut, 
  LogIn, 
  Zap,
  LayoutDashboard,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([]);
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard'>('challenges');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userStats = await createUserProfile(u);
        setStats(userStats);
        
        // Fetch completed challenges for today
        const today = new Date().toISOString().split('T')[0];
        const q = query(
          collection(db, 'completions'),
          where('userId', '==', u.uid),
          where('date', '==', today)
        );
        const snap = await getDocs(q);
        setCompletedIds(snap.docs.map(d => d.data().challengeId));
      } else {
        setStats(null);
        setCompletedIds([]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch Challenges and Leaderboard when user is authenticated
  useEffect(() => {
    if (!user) return;

    const init = async () => {
      try {
        const daily = await getChallengesForToday();
        setChallenges(daily);
      } catch (err) {
        console.error("Failed to fetch challenges:", err);
      }
    };
    init();

    const unsubLeaderboard = subscribeToLeaderboard((users) => {
      setLeaderboard(users);
    });
    
    return () => {
      unsubLeaderboard();
    };
  }, [user]);

  // Real-time stats sync
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data() as UserStats);
      }
    });
    return unsub;
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleComplete = async (challenge: Challenge) => {
    if (!user || !stats || completedIds.includes(challenge.id)) return;
    
    setProcessing(challenge.id);
    try {
      await completeChallenge(user.uid, challenge, stats);
      setCompletedIds(prev => [...prev, challenge.id]);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EAB308', '#F59E0B', '#FFF']
      });

      // Reward bonus if all 3 completed
      if (completedIds.length + 1 === challenges.length) {
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 160,
            origin: { y: 0.4 },
            colors: ['#FFD700', '#FFA500', '#FF4500']
          });
        }, 500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Zap className="w-12 h-12 text-yellow-400" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="z-10 max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-12 rounded-[48px] shadow-2xl"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-4xl shadow-lg border border-white/20 mb-8">
            ⚡
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">STRIVE</h1>
          <p className="text-white/60 text-lg mb-12 font-medium">
            AI-powered daily challenges to sharpen your body, mind, and social game.
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-400 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
          >
            <LogIn className="w-6 h-6" />
            ENTER THE ARENA
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-32">
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-white/5 backdrop-blur-xl sticky top-0 z-40 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl shadow-lg border border-white/20">
            ⚡
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase leading-none">Strive</h1>
            <p className="text-[10px] text-white/50 tracking-widest uppercase font-bold mt-1">Daily Quest</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        {/* Stats Section */}
        <section className="flex flex-wrap gap-4 mb-10">
          <div className="flex-1 min-w-[140px]">
            <StatBadge 
              label="Streak" 
              value={`${stats?.streak || 0} Days`} 
              icon={Flame} 
              colorClass="text-orange-400" 
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <StatBadge 
              label="Total XP" 
              value={stats?.totalPoints.toLocaleString() || 0} 
              icon={Trophy} 
              colorClass="text-yellow-400" 
            />
          </div>
        </section>

        {/* Tab Selection */}
        <div className="flex bg-black/20 backdrop-blur-md p-1.5 rounded-3xl mb-10 border border-white/5">
          <button 
            onClick={() => setActiveTab('challenges')}
            className={cn(
              "flex-1 py-3.5 rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-2 transition-all uppercase",
              activeTab === 'challenges' ? "bg-white/10 text-white shadow-xl border border-white/10" : "text-white/40 hover:text-white/70"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Missions
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={cn(
              "flex-1 py-3.5 rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-2 transition-all uppercase",
              activeTab === 'leaderboard' ? "bg-white/10 text-white shadow-xl border border-white/10" : "text-white/40 hover:text-white/70"
            )}
          >
            <Users className="w-4 h-4" />
            Rankings
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'challenges' ? (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/70">Today's AI Challenges</h2>
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">Refreshed</span>
              </div>
              
              <div className="space-y-4">
                {challenges.length > 0 ? (
                  challenges.map((c) => (
                    <ChallengeCard 
                      key={c.id} 
                      challenge={c}
                      isCompleted={completedIds.includes(c.id)}
                      isLoading={processing === c.id}
                      onComplete={() => handleComplete(c)}
                    />
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <motion.div 
                      animate={{ opacity: [0.4, 1, 0.4] }} 
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-white/20 font-black tracking-widest uppercase text-sm"
                    >
                      Summoning New Quests...
                    </motion.div>
                  </div>
                )}
              </div>

              {completedIds.length === challenges.length && challenges.length > 0 && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mt-8 p-8 rounded-[40px] bg-gradient-to-r from-orange-500 to-pink-600 relative overflow-hidden shadow-2xl shadow-orange-500/20"
                >
                  <div className="relative z-10">
                    <h3 className="font-black italic text-2xl text-white">DAILY SWEEP COMPLETE!</h3>
                    <p className="text-sm text-white/80 font-medium">You've mastered all current missions. The arena resets in 24h.</p>
                    <div className="w-full h-3 bg-black/20 rounded-full mt-6 overflow-hidden border border-white/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                      />
                    </div>
                  </div>
                  <div className="absolute -right-6 -bottom-6 opacity-20 text-9xl rotate-12">🏆</div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/70">Global Leaderboard</h2>
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Updated Live</span>
              </div>

              <div className="bg-black/20 backdrop-blur-2xl rounded-[40px] border border-white/5 p-2 space-y-2">
                {leaderboard.map((u, i) => (
                  <LeaderboardItem 
                    key={u.uid} 
                    user={u} 
                    rank={i + 1} 
                    isCurrentUser={u.uid === user.uid} 
                  />
                ))}

                {leaderboard.length === 0 && (
                   <div className="py-20 text-center text-white/20 font-black tracking-tighter">
                    THE HALL IS EMPTY
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-2xl border border-white/10 p-2 rounded-[32px] flex gap-2 shadow-2xl z-50">
        <button 
          onClick={() => setActiveTab('challenges')}
          className={cn(
            "p-4 rounded-2xl transition-all",
            activeTab === 'challenges' ? "bg-white/10 text-white shadow-xl" : "text-white/40 hover:text-white/60"
          )}
        >
          <LayoutDashboard className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setActiveTab('leaderboard')}
          className={cn(
            "p-4 rounded-2xl transition-all",
            activeTab === 'leaderboard' ? "bg-white/10 text-white shadow-xl" : "text-white/40 hover:text-white/60"
          )}
        >
          <Users className="w-6 h-6" />
        </button>
      </nav>
    </div>
  );
}


