import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Flame, Trophy, CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { format, subDays, differenceInCalendarDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import SpineScoreRing from "@/components/SpineScoreRing";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { getProgressMessage } from "@/lib/dailySystem";

/**
 * Compute real consecutive streak from check-in dates.
 * Only counts consecutive completed days ending today or yesterday.
 * NEVER inflates — missed days break the streak.
 */
function computeRealStreak(checkIns) {
  const completedDates = new Set(
    checkIns.filter((c) => c.completed).map((c) => c.date)
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  // Start from today or yesterday (if today not yet done)
  let cursor = completedDates.has(today) ? new Date() : subDays(new Date(), 1);
  const cursorStr = format(cursor, "yyyy-MM-dd");

  if (!completedDates.has(cursorStr)) return 0;

  let streak = 0;
  let current = cursor;
  while (true) {
    const dateStr = format(current, "yyyy-MM-dd");
    if (completedDates.has(dateStr)) {
      streak++;
      current = subDays(current, 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function Progress() {
  const { data: user } = useCurrentUser();

  const { data: profiles } = useQuery({
    queryKey: ["userProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: checkIns } = useQuery({
    queryKey: ["checkIns", user?.email],
    queryFn: () => base44.entities.DailyCheckIn.filter({ created_by: user.email }, "-created_date", 60),
    enabled: !!user?.email,
    initialData: [],
  });

  const profile = profiles[0];
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayCheckIn = checkIns.find((c) => c.date === todayStr);
  const didToday = todayCheckIn?.completed === true;

  // Real streak — computed from actual dates, no inflation
  const realStreak = useMemo(() => computeRealStreak(checkIns), [checkIns]);
  const totalCompleted = checkIns.filter((c) => c.completed).length;

  // Build a set of completed date strings for quick lookup
  const completedSet = useMemo(
    () => new Set(checkIns.filter((c) => c.completed).map((c) => c.date)),
    [checkIns]
  );

  // Calendar: show last 5 weeks (35 days) in a grid
  const calendarDays = useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => {
      const date = subDays(new Date(), 34 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      return {
        dateStr,
        label: format(date, "d"),
        dayLetter: format(date, "EEEEE"),
        completed: completedSet.has(dateStr),
        isToday: dateStr === todayStr,
        isFuture: date > new Date(),
      };
    });
  }, [completedSet, todayStr]);

  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const progressMsg = getProgressMessage(realStreak);
  const longestStreak = profile?.longest_streak || 0;

  return (
    <div className="px-5 pt-12 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Progress</p>
        <h1 className="text-2xl font-bold tracking-tight mb-6">Your Journey</h1>
      </motion.div>

      {/* Today's status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 ${
          didToday ? "bg-primary/10 border border-primary/20" : "bg-secondary border border-border"
        }`}
      >
        {didToday
          ? <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
          : <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        }
        <div>
          <p className={`text-sm font-semibold ${didToday ? "text-primary" : "text-foreground"}`}>
            {didToday ? "Today's workout done" : "Today's workout pending"}
          </p>
          {progressMsg && (
            <p className="text-xs text-muted-foreground">{progressMsg}</p>
          )}
        </div>
      </motion.div>

      {/* Score ring */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center mb-6"
      >
        <SpineScoreRing score={profile?.spine_score || 0} size={130} strokeWidth={9} />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Flame className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold">{realStreak}</p>
          <p className="text-[10px] text-muted-foreground">Streak</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold">{longestStreak}</p>
          <p className="text-[10px] text-muted-foreground">Best</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold">{totalCompleted}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
      </motion.div>

      {/* Calendar view */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="font-semibold text-sm mb-3">Activity Calendar</h2>
        <div className="bg-card border border-border rounded-2xl p-4">
          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-muted-foreground">{d}</div>
            ))}
          </div>
          {/* Weeks */}
          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day) => (
                  <div
                    key={day.dateStr}
                    className="flex items-center justify-center"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium transition-all ${
                        day.isFuture
                          ? "opacity-20 bg-secondary text-muted-foreground"
                          : day.completed
                          ? "bg-primary text-primary-foreground"
                          : day.isToday
                          ? "border-2 border-primary text-primary bg-primary/5"
                          : "bg-secondary/60 text-muted-foreground/60"
                      }`}
                    >
                      {day.completed && !day.isToday
                        ? <CheckCircle2 className="w-3.5 h-3.5" />
                        : day.label
                      }
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[10px] text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-secondary border-2 border-primary" />
              <span className="text-[10px] text-muted-foreground">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-secondary/60" />
              <span className="text-[10px] text-muted-foreground">Missed</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent history list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-semibold text-sm mb-3">Recent Workouts</h2>
        <div className="space-y-2">
          {Array.from({ length: 7 }, (_, i) => {
            const date = subDays(new Date(), i);
            const dateStr = format(date, "yyyy-MM-dd");
            const completed = completedSet.has(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div
                key={dateStr}
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  completed ? "bg-primary/10" : "bg-secondary"
                }`}>
                  {completed
                    ? <CheckCircle2 className="w-4 h-4 text-primary" />
                    : <Circle className="w-4 h-4 text-muted-foreground/40" />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {isToday ? "Today" : format(date, "EEEE, MMM d")}
                  </p>
                </div>
                <span className={`text-xs font-semibold ${
                  completed ? "text-primary" : isToday ? "text-muted-foreground" : "text-muted-foreground/50"
                }`}>
                  {completed ? "Done" : isToday ? "Pending" : "Missed"}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}