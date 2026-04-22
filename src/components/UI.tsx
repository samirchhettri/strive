import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, TrendingUp, Flame, User } from 'lucide-react';
import { Challenge } from '../services/geminiService';
import { cn } from '../lib/utils';

interface ChallengeCardProps {
  challenge: Challenge;
  isCompleted: boolean;
  onComplete: () => void;
  isLoading?: boolean;
  key?: React.Key;
}

export function ChallengeCard({ challenge, isCompleted, onComplete, isLoading }: ChallengeCardProps) {
  const categoryStyles = {
    Fitness: {
      bg: "bg-cyan-500/20",
      border: "border-cyan-400/30",
      accent: "text-cyan-400",
      btn: "bg-cyan-500 hover:bg-cyan-400",
      emoji: "🏃♂️"
    },
    Productivity: {
      bg: "bg-emerald-500/20",
      border: "border-emerald-400/30",
      accent: "text-emerald-400",
      btn: "bg-emerald-500 hover:bg-emerald-400",
      emoji: "🧠"
    },
    Social: {
      bg: "bg-fuchsia-500/20",
      border: "border-fuchsia-400/30",
      accent: "text-fuchsia-400",
      btn: "bg-fuchsia-500 hover:bg-fuchsia-400",
      emoji: "🤝"
    },
    Mindset: {
      bg: "bg-indigo-500/20",
      border: "border-indigo-400/30",
      accent: "text-indigo-400",
      btn: "bg-indigo-500 hover:bg-indigo-400",
      emoji: "🧘"
    }
  };

  const style = categoryStyles[challenge.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "bg-white/10 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 flex flex-col sm:flex-row items-center gap-6 group hover:bg-white/15 transition-all",
        isCompleted && "opacity-60 grayscale-[0.5]"
      )}
    >
      <div className={cn(
        "w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-2xl border transition-colors",
        style.bg,
        style.border
      )}>
        {style.emoji}
      </div>
      
      <div className="flex-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
          <span className={cn("text-[10px] font-bold uppercase tracking-widest", style.accent)}>
            {challenge.category}
          </span>
          <span className="text-[10px] text-white/30 italic">+{challenge.points} XP</span>
        </div>
        <p className="text-lg font-medium text-white group-hover:text-white transition-colors">
          {challenge.text}
        </p>
      </div>

      <button
        id={`complete-${challenge.id}`}
        disabled={isCompleted || isLoading}
        onClick={onComplete}
        className={cn(
          "px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 whitespace-nowrap",
          isCompleted
            ? "bg-white/10 text-white/50 cursor-not-allowed border border-white/10"
            : cn(style.btn, "text-white shadow-current/20")
        )}
      >
        {isCompleted ? (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> ✓ COMPLETED
          </span>
        ) : (
          isLoading ? "PROCESSING..." : "DONE"
        )}
      </button>
    </motion.div>
  );
}

export function StatBadge({ label, value, icon: Icon, colorClass }: { label: string, value: string | number, icon: any, colorClass: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[28px] px-6 py-3 flex items-center gap-3">
      <div className={cn("p-2 rounded-xl bg-white/5 border border-white/10")}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="leading-tight">
        <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">{label}</p>
        <p className="text-xl font-black italic text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export function LeaderboardItem({ user, rank, isCurrentUser }: { user: any, rank: number, isCurrentUser: boolean, key?: React.Key }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-[28px] transition-all",
        isCurrentUser 
          ? "bg-indigo-500/40 border-2 border-indigo-400 shadow-2xl shadow-indigo-500/20 relative z-10" 
          : "bg-white/5 border border-white/10 hover:bg-white/10"
      )}
    >
      <span className={cn(
        "w-8 font-black text-xl italic",
        rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-300" : rank === 3 ? "text-orange-400" : "text-white/40"
      )}>
        {rank < 10 ? `0${rank}` : rank}
      </span>
      
      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
        ) : (
          <div className={cn("w-full h-full flex items-center justify-center font-bold text-xs", isCurrentUser ? "bg-indigo-300 text-indigo-900" : "bg-white/5 text-white/40")}>
            {isCurrentUser ? "YOU" : user.displayName.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("font-bold text-sm truncate", isCurrentUser ? "text-white" : "text-white/80")}>
          {user.displayName}
        </p>
        <p className={cn("text-[10px] uppercase font-bold tracking-tighter opacity-70 flex items-center gap-1", isCurrentUser ? "text-white" : "text-white/40")}>
          {user.streak > 0 && <Flame className="w-3 h-3" />} {user.streak} DAYS STREAK
        </p>
      </div>

      <span className={cn("font-black text-sm", isCurrentUser ? "text-white" : "text-white/70")}>
        {user.totalPoints.toLocaleString()}
      </span>
    </motion.div>
  );
}

