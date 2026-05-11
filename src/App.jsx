import { useState, useEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts";

const DEFAULT_HABITS = [
  { id: "gym",       label: "Gym",           emoji: "🏋️", color: "#FF6B35", custom: false },
  { id: "coding",    label: "Coding",        emoji: "💻", color: "#4ECDC4", custom: false },
  { id: "guitar",    label: "Guitar",        emoji: "🎸", color: "#A8DADC", custom: false },
  { id: "hindu",     label: "Hindu Culture", emoji: "🕉️", color: "#FFD700", custom: false },
  { id: "skin_hair", label: "Skin & Hair",   emoji: "✨", color: "#F4A7B9", custom: false },
  { id: "no_junk",   label: "No Junk Food",  emoji: "🚫", color: "#FF4560", custom: false },
  { id: "no_sugar",  label: "No Sugar",      emoji: "🍬", color: "#FF6B6B", custom: false },
];

const WATER_GOAL = 8;

const EMOJI_OPTIONS = [
  "📚","🧘","🏃","🎨","🎯","🌿","💪","🥗","🎵","🧠",
  "🌅","💊","🦷","🚶","🛏️","📖","✍️","🥦","🧹","🕐",
  "🏊","🎤","☀️","🧘‍♂️","🫁","🎭","🌙","🧗","🚴","🍎"
];

const COLOR_OPTIONS = [
  "#FF6B35","#4ECDC4","#A8DADC","#FFD700","#F4A7B9",
  "#9b7fe8","#5ebd7a","#FF4560","#00B4D8","#E9C46A",
  "#F77F00","#06D6A0","#ef476f","#118ab2","#cb9cf2"
];

const MOODS = ["😔","😐","🙂","😊","🤩"];
const MOOD_LABELS = ["Low","Meh","Okay","Good","Amazing"];

const QUOTES = [
  "Small steps every day build mountains.",
  "Discipline is choosing what you want most over what you want now.",
  "You don't rise to your goals — you fall to your systems.",
  "The secret of getting ahead is getting started.",
  "Consistency beats perfection, every time.",
  "Every day is a chance to be better than yesterday.",
  "Progress, not perfection.",
  "Your habits shape your identity.",
  "Suffer the pain of discipline or the pain of regret.",
  "What you do today is who you become tomorrow.",
  "Energy flows where attention goes.",
  "One rep, one page, one glass — just start.",
  "The man who moves mountains begins by carrying small stones.",
  "Sthitaprajña — steady in all conditions.",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getWeekDates(offset = 0) {
  const base = new Date();
  base.setDate(base.getDate() + offset * 7);
  const mon = new Date(base);
  mon.setDate(base.getDate() - ((base.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function formatDate(ds) {
  return new Date(ds + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short"
  });
}

function dayName(ds) {
  return new Date(ds + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" });
}

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function persist(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function calcStreak(habitId, data) {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().split("T")[0];
    if (data[key]?.activities?.[habitId]) streak++;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [habits, setHabits]         = useState(() => load("rt_habits", DEFAULT_HABITS));
  const [data, setData]             = useState(() => load("rt_data", {}));
  const [tab, setTab]               = useState("today");
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal]   = useState(false);
  const [newHabit, setNewHabit]     = useState({ label: "", emoji: "📚", color: "#9b7fe8" });
  const [mood, setMood]             = useState(null);
  const [note, setNote]             = useState("");

  const today = getTodayKey();
  const quoteIdx = (new Date().getDate() + new Date().getMonth()) % QUOTES.length;
  const quote = QUOTES[quoteIdx];

  useEffect(() => {
    setMood(data[today]?.mood ?? null);
    setNote(data[today]?.note ?? "");
  }, [today]);

  useEffect(() => { persist("rt_habits", habits); }, [habits]);

  function mutateDay(dayKey, fn) {
    setData(prev => {
      const next = {
        ...prev,
        [dayKey]: {
          activities: {},
          water: 0,
          mood: null,
          note: "",
          ...(prev[dayKey] || {})
        }
      };
      fn(next[dayKey]);
      persist("rt_data", next);
      return next;
    });
  }

  function toggleActivity(id) {
    mutateDay(today, d => { d.activities[id] = !d.activities[id]; });
  }

  function isChecked(id) { return !!data[today]?.activities?.[id]; }

  const waterCount = data[today]?.water ?? 0;

  function setWater(v) {
    mutateDay(today, d => { d.water = Math.max(0, Math.min(WATER_GOAL, v)); });
  }

  function handleMood(m) {
    setMood(m);
    mutateDay(today, d => { d.mood = m; });
  }

  function handleNote(e) {
    setNote(e.target.value);
    mutateDay(today, d => { d.note = e.target.value; });
  }

  function addHabit() {
    if (!newHabit.label.trim()) return;
    const id = "custom_" + Date.now();
    setHabits(prev => [...prev, { ...newHabit, id, custom: true }]);
    setNewHabit({ label: "", emoji: "📚", color: "#9b7fe8" });
    setShowModal(false);
  }

  function removeHabit(id) {
    setHabits(h => h.filter(x => x.id !== id));
  }

  // ─── Derived data ───────────────────────────────────────────────────────────

  const weekDates = getWeekDates(weekOffset);
  const todayCount = habits.filter(a => isChecked(a.id)).length;
  const todayPct   = habits.length ? Math.round((todayCount / habits.length) * 100) : 0;

  const weekBarData = weekDates.map(d => ({
    day: dayName(d),
    date: d,
    count: habits.filter(h => !!data[d]?.activities?.[h.id]).length,
  }));

  const radarData = habits.map(a => ({
    activity: a.emoji,
    value: weekDates.filter(d => !!data[d]?.activities?.[a.id]).length,
    fullMark: 7,
  }));

  const trendData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().split("T")[0];
    return {
      day: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      done: habits.filter(h => !!data[key]?.activities?.[h.id]).length,
      water: data[key]?.water ?? 0,
    };
  });

  const weekCompletion = weekDates.map(d => {
    const done = habits.filter(h => !!data[d]?.activities?.[h.id]).length;
    return {
      date: d,
      done,
      pct: habits.length ? Math.round((done / habits.length) * 100) : 0
    };
  });

  // ─── Style helpers ─────────────────────────────────────────────────────────

  const card = {
    background: "#13121e",
    border: "1px solid #23213a",
    borderRadius: 16,
    padding: "18px"
  };

  const lbl = {
    fontSize: 10,
    letterSpacing: 3,
    color: "#6a6285",
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: 12,
    display: "block"
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#0b0a13", fontFamily: "'Syne', sans-serif", color: "#e8e4f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0b0a13; }
        ::-webkit-scrollbar-thumb { background: #2a2640; border-radius: 4px; }
        textarea, input { outline: none; }
        textarea { resize: none; }
        .hov { transition: all .18s cubic-bezier(.4,0,.2,1); }
        .hov:hover { transform: translateY(-2px); }
        .tap { transition: all .13s; cursor: pointer; }
        .tap:active { transform: scale(.95); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fadeUp { animation: fadeUp .32s ease both; }
        @keyframes pop {
          0%   { opacity: 0; transform: translateY(40px); }
          60%  { transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .pop { animation: pop .3s ease both; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(90deg,#110f1e,#0d0c18)",
        borderBottom: "1px solid #1a1830",
        padding: "16px 18px 12px",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{ maxWidth: 740, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 5, color: "#6a6285", textTransform: "uppercase" }}>Daily Ritual</div>
            <div style={{ fontSize: 21, fontWeight: 800, color: "#f0eaff", letterSpacing: -0.5 }}>Arun's Tracker</div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#c5bde8" }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long" })}
              </div>
              <div style={{ fontSize: 10, color: "#6a6285" }}>
                {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
            {/* Circular progress */}
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: `conic-gradient(#9b7fe8 ${todayPct * 3.6}deg, #1e1c2e 0deg)`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: "#110f1e",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "#c5bde8"
              }}>{todayPct}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: "#0d0c18", borderBottom: "1px solid #1e1c2e", overflowX: "auto" }}>
        <div style={{ maxWidth: 740, margin: "0 auto", display: "flex", padding: "0 18px" }}>
          {[
            { id: "today", label: "📋 Today" },
            { id: "week",  label: "📅 Week"  },
            { id: "log",   label: "📓 Log"   },
            { id: "stats", label: "📊 Stats" },
          ].map(t => (
            <button
              key={t.id}
              className="tap"
              onClick={() => setTab(t.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: tab === t.id ? "2px solid #9b7fe8" : "2px solid transparent",
                color: tab === t.id ? "#c5b8f0" : "#5a5278",
                fontFamily: "inherit",
                fontWeight: tab === t.id ? 700 : 400,
                fontSize: 13,
                padding: "12px 18px 10px",
                whiteSpace: "nowrap",
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "18px 14px 90px" }}>

        {/* ════ TODAY ════ */}
        {tab === "today" && (
          <div className="fadeUp">

            {/* Quote */}
            <div style={{ ...card, marginBottom: 14, borderLeft: "3px solid #9b7fe8", background: "#0f0e1a", padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontStyle: "italic", color: "#8b82ab", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.7 }}>
                "{quote}"
              </div>
            </div>

            {/* Mood */}
            <div style={{ ...card, marginBottom: 14 }}>
              <span style={lbl}>Today's Mood</span>
              <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                {MOODS.map((m, i) => (
                  <button key={m} className="tap" onClick={() => handleMood(i)} style={{
                    flex: 1, padding: "10px 0", borderRadius: 12, fontFamily: "inherit",
                    border: mood === i ? "1.5px solid #9b7fe8" : "1.5px solid #2a2640",
                    background: mood === i ? "#9b7fe822" : "#0f0e1a",
                  }}>
                    <div style={{ fontSize: 22 }}>{m}</div>
                    <div style={{ fontSize: 10, color: mood === i ? "#c5bde8" : "#4a4268", marginTop: 4 }}>{MOOD_LABELS[i]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6a6285", marginBottom: 6 }}>
              <span style={{ letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>Habits</span>
              <span>{todayCount}/{habits.length} done</span>
            </div>
            <div style={{ height: 5, background: "#1e1c2e", borderRadius: 99, overflow: "hidden", marginBottom: 14 }}>
              <div style={{
                height: "100%", width: `${todayPct}%`,
                background: "linear-gradient(90deg,#7c5cbf,#c084fc)",
                borderRadius: 99, transition: "width .4s"
              }} />
            </div>

            {/* Habit cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 14 }}>
              {habits.map((act, idx) => {
                const checked = isChecked(act.id);
                const streak  = calcStreak(act.id, data);
                return (
                  <div
                    key={act.id}
                    className="hov"
                    onClick={() => toggleActivity(act.id)}
                    style={{
                      background: checked ? `linear-gradient(135deg,${act.color}22,${act.color}08)` : "#13121e",
                      border: checked ? `1.5px solid ${act.color}66` : "1.5px solid #23213a",
                      borderRadius: 14, padding: "13px", position: "relative",
                      animationDelay: `${idx * 0.04}s`, cursor: "pointer",
                    }}
                  >
                    {act.custom && (
                      <button
                        onClick={e => { e.stopPropagation(); removeHabit(act.id); }}
                        style={{
                          position: "absolute", top: 7, right: 8,
                          background: "none", border: "none",
                          color: "#4a4268", fontSize: 13, lineHeight: 1, fontFamily: "inherit", cursor: "pointer"
                        }}
                      >✕</button>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0, fontSize: 19,
                        background: checked ? `${act.color}28` : "#1a1828",
                        border: checked ? `1px solid ${act.color}55` : "1px solid #2a2640",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{act.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 700,
                          color: checked ? "#f0eaff" : "#6a6285",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                        }}>{act.label}</div>
                        <div style={{ fontSize: 10, color: checked ? act.color : "#3a3560" }}>
                          {checked ? "✓ Done" : "Tap to log"}
                        </div>
                      </div>
                    </div>
                    {streak > 0 && (
                      <div style={{
                        fontSize: 10, color: "#FFD700",
                        background: "#FFD70014", borderRadius: 6,
                        padding: "2px 8px", display: "inline-block"
                      }}>🔥 {streak}d streak</div>
                    )}
                  </div>
                );
              })}

              {/* Add habit card */}
              <div
                className="hov"
                onClick={() => setShowModal(true)}
                style={{
                  border: "1.5px dashed #3a3560", borderRadius: 14, padding: "13px",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8,
                  color: "#6a6285", fontSize: 13, background: "#0f0e1a",
                }}
              >
                <span style={{ fontSize: 22, color: "#4a4268" }}>＋</span>
                <span>Add Habit</span>
              </div>
            </div>

            {/* Water tracker */}
            <div style={{ ...card, marginBottom: 14, background: "#0c141e", border: "1.5px solid #1a3040" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>💧</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#c5e8f0" }}>Water Intake</div>
                    <div style={{ fontSize: 10, color: "#4a8090" }}>Goal: {WATER_GOAL} glasses/day</div>
                  </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: waterCount >= WATER_GOAL ? "#4ECDC4" : "#6FCEEE" }}>
                  {waterCount}<span style={{ fontSize: 12, color: "#4a7080", fontWeight: 400 }}>/{WATER_GOAL}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
                {Array.from({ length: WATER_GOAL }).map((_, i) => (
                  <div
                    key={i}
                    className="tap"
                    onClick={() => setWater(i + 1)}
                    style={{
                      flex: 1, height: 30, borderRadius: 7,
                      background: i < waterCount
                        ? (i < 3 ? "#1a6070" : i < 6 ? "#1a8090" : "#4ECDC4")
                        : "#12232a",
                      transition: "background .2s",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                    }}
                  >{i < waterCount ? "💧" : ""}</div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="tap" onClick={() => setWater(waterCount - 1)} style={{
                  background: "#12232a", border: "1px solid #1a3040", color: "#6FCEEE",
                  borderRadius: 8, width: 40, height: 34, fontSize: 20, fontFamily: "inherit"
                }}>−</button>
                <button className="tap" onClick={() => setWater(waterCount + 1)} style={{
                  background: "#1a4a5a", border: "1px solid #6FCEEE44", color: "#6FCEEE",
                  borderRadius: 8, width: 40, height: 34, fontSize: 20, fontFamily: "inherit"
                }}>+</button>
              </div>
            </div>

            {/* Notes */}
            <div style={card}>
              <span style={lbl}>📝 Notes & Goals</span>
              <textarea
                value={note}
                onChange={handleNote}
                rows={4}
                placeholder="Today's intention, wins, or reflections..."
                style={{
                  width: "100%", background: "#0f0e1a",
                  border: "1px solid #23213a", borderRadius: 10,
                  color: "#c5bde8", fontFamily: "'DM Sans',sans-serif",
                  fontSize: 13.5, lineHeight: 1.7, padding: "10px 12px",
                }}
              />
            </div>
          </div>
        )}

        {/* ════ WEEK DASHBOARD ════ */}
        {tab === "week" && (
          <div className="fadeUp">

            {/* Week nav */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <button className="tap" onClick={() => setWeekOffset(o => o - 1)} style={{
                background: "#13121e", border: "1px solid #2a2640", color: "#9b7fe8",
                borderRadius: 8, padding: "7px 16px", fontFamily: "inherit", fontSize: 18
              }}>‹</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#6a6285", letterSpacing: 2, textTransform: "uppercase" }}>Week of</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#c5bde8" }}>
                  {formatDate(weekDates[0])} – {formatDate(weekDates[6])}
                </div>
                {weekOffset === 0 && <div style={{ fontSize: 10, color: "#9b7fe8", marginTop: 2 }}>Current Week</div>}
              </div>
              <button className="tap" onClick={() => setWeekOffset(o => Math.min(0, o + 1))} style={{
                background: "#13121e", border: "1px solid #2a2640",
                color: weekOffset === 0 ? "#3a3560" : "#9b7fe8",
                borderRadius: 8, padding: "7px 16px", fontFamily: "inherit", fontSize: 18
              }}>›</button>
            </div>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
              {[
                {
                  label: "Total Logs",
                  value: weekDates.reduce((s, d) => s + habits.filter(h => !!data[d]?.activities?.[h.id]).length, 0),
                  color: "#9b7fe8"
                },
                {
                  label: "Perfect Days",
                  value: weekDates.filter(d => d <= today && habits.every(h => !!data[d]?.activities?.[h.id])).length,
                  color: "#5ebd7a"
                },
                {
                  label: "Avg / Day",
                  value: (weekDates.reduce((s, d) => s + habits.filter(h => !!data[d]?.activities?.[h.id]).length, 0) / 7).toFixed(1),
                  color: "#FFD700"
                },
              ].map(c => (
                <div key={c.label} style={{ ...card, textAlign: "center", padding: "14px 8px" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: 10, color: "#5a5278", marginTop: 3 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Day heat strip */}
            <div style={{ ...card, marginBottom: 14 }}>
              <span style={lbl}>Day-by-Day Completion</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                {weekCompletion.map(({ date, done, pct }) => {
                  const isT = date === today;
                  const isFuture = date > today;
                  return (
                    <div key={date} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: isT ? "#c5bde8" : "#4a4268", marginBottom: 5, fontWeight: isT ? 700 : 400 }}>
                        {dayName(date)}
                      </div>
                      <div style={{
                        height: 60, borderRadius: 10,
                        background: isFuture ? "#0f0e1a" : pct === 0 ? "#1a1828"
                          : `linear-gradient(180deg,${pct === 100 ? "#5ebd7a" : "#9b7fe8"}44,${pct === 100 ? "#5ebd7a" : "#9b7fe8"}08)`,
                        border: isT ? "1.5px solid #9b7fe8" : "1px solid #1e1c2e",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700,
                        color: isFuture ? "#2a2640" : pct >= 80 ? "#5ebd7a" : pct >= 50 ? "#c084fc" : pct > 0 ? "#8b7ab8" : "#3a3560",
                      }}>
                        {isFuture ? "—" : `${pct}%`}
                        <div style={{ fontSize: 9, color: "#4a4268", marginTop: 2 }}>
                          {isFuture ? "" : `${done}/${habits.length}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Habit matrix */}
            <div style={{ ...card, marginBottom: 14 }}>
              <span style={lbl}>Habit Matrix</span>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 380 }}>
                  <thead>
                    <tr>
                      <td style={{ fontSize: 10, color: "#4a4268", paddingBottom: 8, minWidth: 90 }}>Habit</td>
                      {weekDates.map(d => (
                        <td key={d} style={{
                          fontSize: 10, color: d === today ? "#c5bde8" : "#4a4268",
                          textAlign: "center", paddingBottom: 8, fontWeight: d === today ? 700 : 400
                        }}>{dayName(d)}</td>
                      ))}
                      <td style={{ fontSize: 10, color: "#4a4268", textAlign: "center", paddingBottom: 8, paddingLeft: 6 }}>Total</td>
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map(h => {
                      const wTotal = weekDates.filter(d => !!data[d]?.activities?.[h.id]).length;
                      return (
                        <tr key={h.id}>
                          <td style={{ padding: "5px 0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <span style={{ fontSize: 14 }}>{h.emoji}</span>
                              <span style={{
                                fontSize: 10, color: "#8b82ab",
                                whiteSpace: "nowrap", overflow: "hidden",
                                textOverflow: "ellipsis", maxWidth: 70
                              }}>{h.label}</span>
                            </div>
                          </td>
                          {weekDates.map(d => {
                            const done = !!data[d]?.activities?.[h.id];
                            const isFuture = d > today;
                            return (
                              <td key={d} style={{ textAlign: "center", padding: "5px 3px" }}>
                                <div style={{
                                  width: 26, height: 26, borderRadius: 7, margin: "0 auto",
                                  background: done ? `${h.color}33` : isFuture ? "#0f0e1a" : "#1a1828",
                                  border: done ? `1px solid ${h.color}66` : "1px solid #1e1c2e",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 13, color: done ? h.color : "#3a3560",
                                }}>
                                  {done ? "✓" : isFuture ? "" : "·"}
                                </div>
                              </td>
                            );
                          })}
                          <td style={{ textAlign: "center", paddingLeft: 6 }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700,
                              color: wTotal >= 5 ? "#5ebd7a" : wTotal >= 3 ? "#FFD700" : "#6a6285"
                            }}>{wTotal}/7</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bar chart */}
            <div style={{ ...card, marginBottom: 14 }}>
              <span style={lbl}>Daily Count</span>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weekBarData} barSize={26}>
                  <XAxis dataKey="day" tick={{ fill: "#5a5278", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, habits.length]} tick={{ fill: "#5a5278", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1a1828", border: "1px solid #3a3560", borderRadius: 8, color: "#c5bde8", fontSize: 12 }} cursor={{ fill: "#ffffff05" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Done">
                    {weekBarData.map((e, i) => (
                      <Cell key={i} fill={e.date === today ? "#9b7fe8" : e.count === habits.length ? "#5ebd7a" : "#3a3560"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar */}
            <div style={card}>
              <span style={lbl}>Balance Wheel</span>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#2a2640" />
                  <PolarAngleAxis dataKey="activity" tick={{ fill: "#8b82ab", fontSize: 16 }} />
                  <Radar dataKey="value" stroke="#9b7fe8" fill="#9b7fe8" fillOpacity={0.22} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ════ LOG ════ */}
        {tab === "log" && (
          <div className="fadeUp">
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#6a6285", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>
              14-Day Activity Log
            </div>
            {Array.from({ length: 14 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - i);
              return d.toISOString().split("T")[0];
            }).map(d => {
              const acts    = data[d]?.activities || {};
              const dayNote = data[d]?.note || "";
              const water   = data[d]?.water ?? 0;
              const moodIdx = data[d]?.mood ?? null;
              const isT     = d === today;
              const done    = habits.filter(h => !!acts[h.id]).length;
              return (
                <div key={d} style={{
                  ...card, marginBottom: 10,
                  border: isT ? "1.5px solid #3a3060" : "1px solid #1e1c2e",
                  background: isT ? "#15131f" : "#0f0e1a"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isT ? "#c5bde8" : "#8b82ab" }}>
                      {isT ? "Today — " : ""}{formatDate(d)}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {moodIdx !== null && <span style={{ fontSize: 16 }}>{MOODS[moodIdx]}</span>}
                      <span style={{ fontSize: 11, color: done === habits.length ? "#5ebd7a" : "#5a5278" }}>
                        {done}/{habits.length} · 💧{water}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {habits.map(a => (
                      <div key={a.id} style={{
                        padding: "3px 9px", borderRadius: 7, fontSize: 11,
                        background: !!acts[a.id] ? `${a.color}22` : "#1a1828",
                        color: !!acts[a.id] ? a.color : "#3a3560",
                        border: `1px solid ${!!acts[a.id] ? a.color + "44" : "#252338"}`,
                        fontWeight: !!acts[a.id] ? 600 : 400,
                      }}>{a.emoji} {a.label}</div>
                    ))}
                  </div>
                  {dayNote && (
                    <div style={{
                      fontSize: 12, color: "#6a6285", fontStyle: "italic",
                      borderTop: "1px solid #1e1c2e", paddingTop: 8, marginTop: 8,
                      fontFamily: "'DM Sans',sans-serif"
                    }}>"{dayNote}"</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════ STATS ════ */}
        {tab === "stats" && (
          <div className="fadeUp">

            {/* Streak leaderboard */}
            <div style={{ ...card, marginBottom: 14 }}>
              <span style={lbl}>🔥 Current Streaks</span>
              {[...habits]
                .sort((a, b) => calcStreak(b.id, data) - calcStreak(a.id, data))
                .map(h => {
                  const s = calcStreak(h.id, data);
                  return (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 18, width: 26 }}>{h.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#9b92c8" }}>{h.label}</span>
                          <span style={{
                            fontSize: 12, fontWeight: 700,
                            color: s >= 7 ? "#FFD700" : s >= 3 ? "#9b7fe8" : "#5a5278"
                          }}>{s} day{s !== 1 ? "s" : ""}{s >= 7 ? " 🏆" : s >= 3 ? " 🔥" : ""}</span>
                        </div>
                        <div style={{ height: 5, background: "#1e1c2e", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{
                            width: `${Math.min(100, (s / 14) * 100)}%`,
                            height: "100%",
                            background: s >= 7 ? "#FFD700" : h.color,
                            borderRadius: 99, transition: "width .4s"
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* 14-day trend */}
            <div style={{ ...card, marginBottom: 14 }}>
              <span style={lbl}>14-Day Completion Trend</span>
              <ResponsiveContainer width="100%" height={155}>
                <LineChart data={trendData}>
                  <CartesianGrid stroke="#1e1c2e" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fill: "#5a5278", fontSize: 9 }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis domain={[0, habits.length]} tick={{ fill: "#5a5278", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1a1828", border: "1px solid #3a3560", borderRadius: 8, color: "#c5bde8", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#8b82ab" }} />
                  <Line type="monotone" dataKey="done"  name="Habits" stroke="#9b7fe8" strokeWidth={2.5} dot={{ fill: "#9b7fe8", r: 3 }} />
                  <Line type="monotone" dataKey="water" name="Water"  stroke="#6FCEEE" strokeWidth={2}   dot={{ fill: "#6FCEEE", r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Per-habit this week */}
            <div style={{ ...card, marginBottom: 14 }}>
              <span style={lbl}>This Week — Per Habit</span>
              {habits.map(a => {
                const days = getWeekDates(0).filter(d => !!data[d]?.activities?.[a.id]).length;
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 18, width: 26 }}>{a.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#9b92c8" }}>{a.label}</span>
                        <span style={{ fontSize: 12, color: a.color, fontWeight: 700 }}>{days}/7</span>
                      </div>
                      <div style={{ height: 6, background: "#1e1c2e", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          width: `${(days / 7) * 100}%`, height: "100%",
                          background: a.color, borderRadius: 99, transition: "width .4s"
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* All-time */}
            <div style={card}>
              <span style={lbl}>All-Time Stats</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Days Tracked",        value: Object.keys(data).length, color: "#9b7fe8" },
                  { label: "Total Completions",   value: Object.values(data).reduce((s, d) => s + Object.values(d.activities || {}).filter(Boolean).length, 0), color: "#4ECDC4" },
                  { label: "Total Water (glasses)", value: Object.values(data).reduce((s, d) => s + (d.water || 0), 0), color: "#6FCEEE" },
                  { label: "Top Streak Habit",    value: habits.reduce((b, h) => { const s = calcStreak(h.id, data); return s > b.s ? { s, e: h.emoji } : b; }, { s: 0, e: "—" }).e, color: "#FFD700" },
                ].map(c => (
                  <div key={c.label} style={{
                    background: "#0f0e1a", border: "1px solid #1e1c2e",
                    borderRadius: 12, padding: "14px", textAlign: "center"
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
                    <div style={{ fontSize: 10, color: "#5a5278", marginTop: 3 }}>{c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════ ADD HABIT MODAL ════ */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "#000000bb",
            zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center"
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="pop"
            onClick={e => e.stopPropagation()}
            style={{
              background: "#15131f", borderRadius: "22px 22px 0 0",
              border: "1px solid #2a2640", padding: "24px 18px 40px",
              width: "100%", maxWidth: 520,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: "#f0eaff", marginBottom: 16 }}>Add New Habit</div>
            <input
              value={newHabit.label}
              onChange={e => setNewHabit(h => ({ ...h, label: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addHabit()}
              placeholder="Habit name (e.g. Meditation)..."
              style={{
                width: "100%", background: "#0f0e1a", border: "1px solid #2a2640",
                borderRadius: 10, color: "#c5bde8", fontFamily: "inherit",
                fontSize: 14, padding: "10px 14px", marginBottom: 14
              }}
            />
            <div style={{ fontSize: 10, color: "#6a6285", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Pick Emoji</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
              {EMOJI_OPTIONS.map(em => (
                <button key={em} className="tap" onClick={() => setNewHabit(h => ({ ...h, emoji: em }))} style={{
                  fontSize: 19, width: 36, height: 36, borderRadius: 8, fontFamily: "inherit",
                  background: newHabit.emoji === em ? "#9b7fe833" : "#1a1828",
                  border: newHabit.emoji === em ? "1.5px solid #9b7fe8" : "1.5px solid #2a2640",
                }}>{em}</button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#6a6285", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Pick Color</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {COLOR_OPTIONS.map(c => (
                <div key={c} className="tap" onClick={() => setNewHabit(h => ({ ...h, color: c }))} style={{
                  width: 28, height: 28, borderRadius: 7, background: c,
                  border: newHabit.color === c ? "3px solid #fff" : "2px solid transparent",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="tap" onClick={() => setShowModal(false)} style={{
                flex: 1, padding: "12px", background: "#1a1828", border: "1px solid #2a2640",
                color: "#6a6285", borderRadius: 12, fontFamily: "inherit", fontSize: 14
              }}>Cancel</button>
              <button className="tap" onClick={addHabit} style={{
                flex: 2, padding: "12px",
                background: newHabit.label.trim() ? "linear-gradient(90deg,#7c5cbf,#9b7fe8)" : "#2a2640",
                border: "none",
                color: newHabit.label.trim() ? "#fff" : "#4a4268",
                borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 700
              }}>Add to Routine ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}