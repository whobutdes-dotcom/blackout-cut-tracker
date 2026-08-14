"use client";

import { useEffect, useMemo, useState } from "react";

type IconName = "home" | "dumbbell" | "food" | "chart" | "sparkles" | "plus" | "flame" | "clock" | "chevron" | "trophy";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
    dumbbell: <><path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/></>,
    food: <><path d="M6 3v8M3 3v5c0 2 1.3 3 3 3s3-1 3-3V3M6 11v10M15 3v18M15 3c4 2 5 5 5 9h-5"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    sparkles: <><path d="m12 3 1.2 3.3L16.5 8l-3.3 1.7L12 13l-1.2-3.3L7.5 8l3.3-1.7L12 3Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/><path d="m5 13 .7 1.8 1.8.7-1.8.7L5 18l-.7-1.8-1.8-.7 1.8-.7L5 13Z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    flame: <path d="M12 22c4 0 7-2.8 7-7.2 0-3-1.6-5.7-4.7-8.3.2 2.1-.7 3.5-1.7 4.2.2-3.4-1.5-6.2-4-8.7.1 3.4-3.6 6.4-3.6 11.7C5 18.7 8 22 12 22Z"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    trophy: <><path d="M8 4h8v4c0 4-1.8 6-4 6s-4-2-4-6V4Z"/><path d="M8 6H4v2c0 2 1.2 3 3.5 3M16 6h4v2c0 2-1.2 3-3.5 3M12 14v4M8 21h8M9 18h6"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const days = [
  { day: "M", date: "12", done: true },
  { day: "T", date: "13", active: true },
  { day: "W", date: "14" },
  { day: "T", date: "15" },
  { day: "F", date: "16" },
  { day: "S", date: "17" },
  { day: "S", date: "18" },
];

export default function Home() {
  const [showSetup, setShowSetup] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [logType, setLogType] = useState<"weight" | "meal" | "workout">("weight");
  const [savedMessage, setSavedMessage] = useState("");
  const [logs, setLogs] = useState<Record<string, string>[]>([]);
  const [workoutName, setWorkoutName] = useState("Push day");
  const [intensity, setIntensity] = useState<"light" | "moderate" | "hard">("moderate");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [workoutRunning, setWorkoutRunning] = useState(false);
  const [mealProjection, setMealProjection] = useState<string | null>(null);

  useEffect(() => {
    const checkProfile = window.setTimeout(() => {
      setShowSetup(!window.localStorage.getItem("blackout-profile"));
    }, 0);
    return () => window.clearTimeout(checkProfile);
  }, []);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      const storedLogs = JSON.parse(window.localStorage.getItem("blackout-logs") ?? "[]") as Record<string, string>[];
      setLogs(storedLogs);
      const active = JSON.parse(window.localStorage.getItem("blackout-active-workout") ?? "null") as { workout: string; intensity: "light" | "moderate" | "hard"; elapsedSeconds: number } | null;
      if (active) {
        setWorkoutName(active.workout);
        setIntensity(active.intensity);
        setElapsedSeconds(active.elapsedSeconds);
        setWorkoutRunning(true);
      }
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (!workoutRunning) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [workoutRunning]);

  useEffect(() => {
    if (!workoutRunning) return;
    window.localStorage.setItem("blackout-active-workout", JSON.stringify({ workout: workoutName, intensity, elapsedSeconds }));
  }, [workoutRunning, workoutName, intensity, elapsedSeconds]);

  const workoutPoints = useMemo(() => logs.filter((entry) => entry.type === "workout").reduce((total, entry) => total + Number(entry.points ?? 0), 0), [logs]);
  const leaderboard = useMemo(() => [
    { name: "Maya", points: 84, detail: "4 verified workouts" },
    { name: "Darius (you)", points: workoutPoints, detail: `${logs.filter((entry) => entry.type === "workout").length} verified workouts`, you: true },
    { name: "Chris", points: 61, detail: "3 verified workouts" },
    { name: "Jordan", points: 48, detail: "3 verified workouts" },
  ].sort((a, b) => b.points - a.points), [logs, workoutPoints]);

  function formatTime(total: number) {
    const minutes = Math.floor(total / 60).toString().padStart(2, "0");
    const seconds = (total % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function beginWorkout() {
    setElapsedSeconds(0);
    setWorkoutRunning(true);
  }

  function finishWorkout() {
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const intensityBonus = intensity === "hard" ? 4 : intensity === "moderate" ? 2 : 0;
    const points = 10 + Math.min(12, Math.floor(minutes / 5)) + intensityBonus;
    const entry = { type: "workout", date: new Date().toISOString(), workout: workoutName, duration: String(minutes), intensity, points: String(points), verified: "true" };
    const nextLogs = [entry, ...logs];
    setLogs(nextLogs);
    window.localStorage.setItem("blackout-logs", JSON.stringify(nextLogs));
    window.localStorage.removeItem("blackout-active-workout");
    setWorkoutRunning(false);
    setElapsedSeconds(0);
    setShowLog(false);
    setSavedMessage(`Workout verified · +${points} points`);
    window.setTimeout(() => setSavedMessage(""), 3000);
  }

  function finishSetup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    window.localStorage.setItem("blackout-profile", JSON.stringify(data));
    setShowSetup(false);
    setSavedMessage("Your plan is ready.");
    window.setTimeout(() => setSavedMessage(""), 2400);
  }

  function saveLog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entry = { type: logType, date: new Date().toISOString(), ...Object.fromEntries(new FormData(event.currentTarget)) };
    const nextLogs = [entry as Record<string, string>, ...logs];
    setLogs(nextLogs);
    window.localStorage.setItem("blackout-logs", JSON.stringify(nextLogs));
    if (logType === "meal") {
      const mealLogs = nextLogs.filter((item) => item.type === "meal");
      const totals = new Map<string, number>();
      mealLogs.forEach((item) => {
        const day = item.date.slice(0, 10);
        totals.set(day, (totals.get(day) ?? 0) + Number(item.calories || 0));
      });
      const average = [...totals.values()].reduce((sum, value) => sum + value, 0) / Math.max(1, totals.size);
      const profile = JSON.parse(window.localStorage.getItem("blackout-profile") ?? "{}") as { currentWeight?: string };
      const currentWeight = Number(profile.currentWeight || 204.8);
      const projectedChange = Math.max(-8, Math.min(8, ((average - 2200) * 28) / 3500));
      setMealProjection(`${(currentWeight + projectedChange).toFixed(1)} lb in 4 weeks`);
    }
    setShowLog(false);
    setSavedMessage(`${logType[0].toUpperCase()}${logType.slice(1)} saved.`);
    window.setTimeout(() => setSavedMessage(""), 2400);
  }

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand"><span className="brand-mark">B</span><span>BLACKOUT</span></div>
        <nav aria-label="Main navigation">
          <a className="nav-link active" href="#top"><Icon name="home"/>Overview</a>
          <a className="nav-link" href="#workout"><Icon name="dumbbell"/>Training</a>
          <a className="nav-link" href="#nutrition"><Icon name="food"/>Nutrition</a>
          <a className="nav-link" href="#progress"><Icon name="chart"/>Progress</a>
          <a className="nav-link" href="#competition"><Icon name="trophy"/>Competition</a>
          <a className="nav-link" href="#coach"><Icon name="sparkles"/>AI Coach</a>
        </nav>
        <div className="cut-card"><span>Current phase</span><strong>Summer Cut</strong><div className="cut-row"><span>Week 4 of 12</span><b>33%</b></div><div className="cut-track"><i/></div></div>
        <div className="profile"><div className="avatar">DJ</div><div><strong>Darius</strong><span>View profile</span></div><Icon name="chevron" size={16}/></div>
      </aside>

      <main id="top" className="dashboard">
        <header className="topbar">
          <div><p className="eyebrow">TUESDAY, AUGUST 13</p><h1>Good morning, Darius.</h1><p className="subtitle">Small choices. Serious results. Keep the cut moving.</p></div>
          <button className="primary-button" onClick={() => setShowLog(true)}><Icon name="plus" size={18}/> Log activity</button>
        </header>

        <section className="week-strip" aria-label="Current week">
          {days.map((item) => <div key={`${item.day}-${item.date}`} className={`day ${item.active ? "active" : ""} ${item.done ? "done" : ""}`}><span>{item.day}</span><strong>{item.date}</strong>{item.done && <i>✓</i>}</div>)}
        </section>

        <section className="metric-grid">
          <article className="metric-card"><div className="metric-icon red"><Icon name="flame"/></div><div><span>Calories left</span><strong>840</strong><small>1,360 of 2,200 kcal</small></div><div className="ring red-ring" aria-label="62 percent complete"><span>62%</span></div></article>
          <article className="metric-card"><div className="metric-icon blue"><Icon name="food"/></div><div><span>Protein</span><strong>112g</strong><small>Goal: 180g</small></div><div className="ring blue-ring" aria-label="62 percent complete"><span>62%</span></div></article>
          <article className="metric-card"><div className="metric-icon green"><Icon name="chart"/></div><div><span>Current weight</span><strong>204.8</strong><small className="positive">↓ 1.4 lb this week</small></div><em>lb</em></article>
          <article className="metric-card"><div className="metric-icon gold"><Icon name="flame"/></div><div><span>Daily streak</span><strong>9 days</strong><small>Personal best: 14</small></div><em>🔥</em></article>
        </section>

        <section className="content-grid">
          <article id="workout" className="panel workout-panel">
            <div className="panel-heading"><div><p className="eyebrow">TODAY&apos;S TRAINING</p><h2>Push day</h2></div><button className="text-button">View plan <Icon name="chevron" size={15}/></button></div>
            <div className="workout-visual"><div className="visual-copy"><span>CHEST · SHOULDERS · TRICEPS</span><strong>Upper body<br/>power</strong><div><span><Icon name="clock" size={16}/> 55 min</span><span><Icon name="dumbbell" size={16}/> 7 exercises</span></div></div><div className="plate plate-one"/><div className="plate plate-two"/><div className="barbell"/></div>
            <div className="exercise-list"><div><b>01</b><span><strong>Barbell bench press</strong><small>4 sets · 6–8 reps</small></span></div><div><b>02</b><span><strong>Incline dumbbell press</strong><small>3 sets · 8–10 reps</small></span></div><div><b>03</b><span><strong>Standing overhead press</strong><small>3 sets · 8–10 reps</small></span></div></div>
            <button className="start-button" onClick={() => { setLogType("workout"); setShowLog(true); }}><Icon name="dumbbell" size={19}/> Start workout</button>
          </article>

          <div className="right-column">
            <article id="coach" className="panel coach-panel"><div className="coach-icon"><Icon name="sparkles"/></div><div><p className="eyebrow">BLACKOUT AI COACH</p><h2>You&apos;re trending ahead.</h2><p>Your weight is dropping at 1.2 lb per week—right in the target zone. Keep calories steady today and prioritize sleep tonight.</p><button className="text-button light">Ask your coach <Icon name="chevron" size={15}/></button></div></article>
            <article id="nutrition" className="panel nutrition-panel"><div className="panel-heading"><div><p className="eyebrow">NUTRITION</p><h2>Today&apos;s macros</h2></div><button className="icon-button" aria-label="Add meal" onClick={() => { setLogType("meal"); setShowLog(true); }}><Icon name="plus" size={18}/></button></div><div className="macro"><span>Carbs <b>138 / 210g</b></span><div><i style={{width:"66%"}}/></div></div><div className="macro fat"><span>Fat <b>48 / 70g</b></span><div><i style={{width:"69%"}}/></div></div><div className="macro protein"><span>Protein <b>112 / 180g</b></span><div><i style={{width:"62%"}}/></div></div><button className="meal-button" onClick={() => { setLogType("meal"); setShowLog(true); }}><Icon name="plus" size={16}/> Add meal</button></article>
            <article id="progress" className="panel progress-panel"><div className="panel-heading"><div><p className="eyebrow">7-DAY PROGRESS</p><h2>Down 1.4 lb</h2></div><span className="trend">On track</span></div><div className="chart"><span className="line"/><i style={{left:"2%",top:"8%"}}/><i style={{left:"18%",top:"22%"}}/><i style={{left:"34%",top:"33%"}}/><i style={{left:"50%",top:"45%"}}/><i style={{left:"66%",top:"57%"}}/><i style={{left:"82%",top:"68%"}}/><i style={{left:"97%",top:"82%"}}/></div><div className="chart-labels"><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span><span>M</span><span>T</span></div></article>
          </div>
        </section>

        <section id="competition" className="panel competition-panel">
          <div className="competition-intro"><p className="eyebrow">4-WEEK FRIENDS TRIAL</p><h2>BlackOut League</h2><p>Points come from verified workout time, completion, and intensity. Workout minutes are capped in the score so consistency beats marathon sessions.</p><button className="invite-button" onClick={() => { navigator.clipboard?.writeText(window.location.href); setSavedMessage("Trial invite link copied."); window.setTimeout(() => setSavedMessage(""), 2400); }}>Invite friends</button></div>
          <div className="leaderboard">{leaderboard.map((person, index) => <div className={person.you ? "leader-row you" : "leader-row"} key={person.name}><b>{index + 1}</b><span><strong>{person.name}</strong><small>{person.detail}</small></span><em>{person.points} pts</em></div>)}</div>
        </section>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation"><a className="active" href="#top"><Icon name="home"/><span>Home</span></a><a href="#workout"><Icon name="dumbbell"/><span>Train</span></a><button aria-label="Log activity" onClick={() => setShowLog(true)}><Icon name="plus"/></button><a href="#nutrition"><Icon name="food"/><span>Food</span></a><a href="#competition"><Icon name="trophy"/><span>Compete</span></a></nav>

      {savedMessage && <div className="toast" role="status">✓ {savedMessage}</div>}

      {showSetup && <div className="modal-backdrop"><section className="modal setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title"><div className="modal-brand"><span className="brand-mark">B</span> BLACKOUT</div><p className="eyebrow">YOUR PLAN STARTS HERE</p><h2 id="setup-title">What are you working toward?</h2><p className="modal-copy">Three quick details help BlackOut shape your daily targets. You can change these anytime.</p><form onSubmit={finishSetup}><label>First name<input name="name" required placeholder="Darius" autoComplete="given-name"/></label><div className="form-row"><label>Current weight<input name="currentWeight" required type="number" min="70" max="700" placeholder="205"/></label><label>Goal weight<input name="goalWeight" required type="number" min="70" max="700" placeholder="190"/></label></div><label>Primary goal<select name="goal" defaultValue="lose-fat"><option value="lose-fat">Lose body fat</option><option value="build-muscle">Build muscle</option><option value="maintain">Maintain & feel better</option></select></label><label>Training days per week<select name="trainingDays" defaultValue="4"><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></label><button className="form-submit">Build my plan <Icon name="chevron" size={17}/></button></form><small className="privacy-note">Your information stays private and on this device for now.</small></section></div>}

      {showLog && <div className="modal-backdrop"><section className="modal log-modal" role="dialog" aria-modal="true" aria-labelledby="log-title"><button className="modal-close" onClick={() => setShowLog(false)} aria-label="Close">×</button><p className="eyebrow">{logType === "workout" ? "VERIFIED SESSION" : "QUICK LOG"}</p><h2 id="log-title">{logType === "workout" ? "Train with the clock" : "Add today&apos;s activity"}</h2>{!workoutRunning && <div className="log-tabs">{(["weight","meal","workout"] as const).map((type) => <button key={type} className={logType === type ? "active" : ""} onClick={() => setLogType(type)}>{type}</button>)}</div>}{logType !== "workout" && <form onSubmit={saveLog}>{logType === "weight" && <><label>Weight (lb)<input name="weight" type="number" step="0.1" required placeholder="204.8"/></label><label>Optional note<input name="note" placeholder="Morning check-in"/></label></>}{logType === "meal" && <><label>Meal name<input name="meal" required placeholder="Chicken rice bowl"/></label><div className="form-row three"><label>Calories<input name="calories" type="number" required placeholder="520"/></label><label>Protein<input name="protein" type="number" placeholder="42"/></label><label>Carbs<input name="carbs" type="number" placeholder="58"/></label></div>{mealProjection && <div className="projection"><span>4-week pace</span><strong>{mealProjection}</strong><small>Estimate based on logged food only—not medical advice.</small></div>}</>}<button className="form-submit">Save {logType}</button></form>}{logType === "workout" && <div className="timer-flow">{!workoutRunning ? <><label>Workout<input value={workoutName} onChange={(event) => setWorkoutName(event.target.value)} placeholder="Push day"/></label><fieldset><legend>Choose intensity</legend><div className="intensity-options">{(["light","moderate","hard"] as const).map((level) => <button type="button" key={level} className={intensity === level ? "active" : ""} onClick={() => setIntensity(level)}><strong>{level}</strong><span>{level === "light" ? "Recovery pace" : level === "moderate" ? "Challenging" : "High effort"}</span></button>)}</div></fieldset><p className="timer-note">Time counts only while this workout is active and visible.</p><button className="form-submit" disabled={!workoutName.trim()} onClick={beginWorkout}>Start verified workout</button></> : <><div className="live-indicator"><i/> Session in progress · {intensity}</div><div className="timer-display">{formatTime(elapsedSeconds)}</div><p className="timer-workout">{workoutName}</p><p className="timer-note">Switching away pauses counted time automatically.</p><button className="form-submit finish" onClick={finishWorkout}>Finish & verify workout</button></>}</div>}</section></div>}
    </div>
  );
}
