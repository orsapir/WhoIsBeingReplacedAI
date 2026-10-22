(() => {
  "use strict";

  const JOBS = window.JOBS || [];
  const STORE_KEY = "mi-yuchlaf-kodem:v1";
  const RECENT_LIMIT = 40;
  const ROUNDS_PER_LEVEL = 3;
  // Allowed gap between the two probabilities at each level: easy pairs first, near-ties later.
  const LEVEL_GAPS = [
    [0.5, 1], [0.4, 1], [0.3, 0.8], [0.22, 0.6], [0.16, 0.45],
    [0.12, 0.35], [0.09, 0.28], [0.07, 0.22], [0.06, 0.18], [0.05, 0.15],
  ];
  const MILESTONES = new Set([5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200]);
  const RIGHT_TITLES = ["צדקת!", "בול!", "נכון!", "יפה מאוד!"];
  const MS_MEANINGFUL_GAP = 0.05;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (id) => document.getElementById(id);

  const cards = [0, 1].map((i) => {
    const root = $(`job-${i}`);
    const q = (sel) => root.querySelector(sel);
    return {
      root,
      tag: q(".job-tag"),
      emoji: q(".job-emoji"),
      name: q(".job-name"),
      en: q(".job-en"),
      result: q(".job-result"),
      pct: q(".job-pct"),
      fill: q(".meter-fill"),
      rank: q(".job-rank"),
      ms: q(".job-ms"),
      stamp: q(".stamp"),
    };
  });

  const ui = {
    verdict: $("verdict"),
    verdictTitle: $("verdict-title"),
    verdictText: $("verdict-text"),
    verdictNote: $("verdict-note"),
    next: $("next"),
    correct: $("stat-correct"),
    streak: $("stat-streak"),
    best: $("stat-best"),
    level: $("stat-level"),
    about: $("about"),
    share: $("share"),
    shareStatus: $("share-status"),
    reset: $("reset"),
  };

  const defaults = { correct: 0, answered: 0, streak: 0, best: 0 };
  let stats = loadStats();
  let pair = null;
  let revealed = false;
  let round = 0;
  const recent = [];

  function loadStats() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved && typeof saved === "object") {
        const merged = { ...defaults };
        for (const key of Object.keys(defaults)) {
          if (Number.isFinite(saved[key]) && saved[key] >= 0) merged[key] = Math.floor(saved[key]);
        }
        return merged;
      }
    } catch (_) { /* storage unavailable: play without persistence */ }
    return { ...defaults };
  }

  function saveStats() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(stats));
    } catch (_) { /* ignore */ }
  }

  function currentLevel() {
    return Math.min(LEVEL_GAPS.length, 1 + Math.floor(stats.streak / ROUNDS_PER_LEVEL));
  }

  // 0.97 -> "97%", 0.042 -> "4.2%", 0.0028 -> "0.28%"
  function formatPct(p) {
    const v = p * 100;
    return (v >= 10 ? Math.round(v) : Number(v.toPrecision(2))) + "%";
  }

  function formatScore(s) {
    return s.toFixed(2);
  }

  // Keeps numbers like "29%" in left-to-right order inside Hebrew sentences.
  function ltr(text) {
    return `\u2066${text}\u2069`;
  }

  function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function pickPair(level) {
    const [minGap, maxGap] = LEVEL_GAPS[level - 1];
    const fits = (a, b) => {
      const gap = Math.abs(a.p - b.p);
      return gap >= minGap && gap <= maxGap;
    };
    const attempt = (pool) => {
      for (let tries = 0; tries < 60; tries++) {
        const a = randomItem(pool);
        const partners = pool.filter((b) => b !== a && fits(a, b));
        if (partners.length) return [a, randomItem(partners)];
      }
      return null;
    };
    const fresh = JOBS.filter((j) => !recent.includes(j.soc));
    let found = attempt(fresh) || attempt(JOBS);
    if (!found) {
      // Should not happen with the shipped data; fall back to any pair with a clear winner.
      const a = randomItem(JOBS);
      found = [a, randomItem(JOBS.filter((b) => Math.abs(b.p - a.p) >= 0.05))];
    }
    if (Math.random() < 0.5) found.reverse();
    for (const job of found) {
      recent.push(job.soc);
      if (recent.length > RECENT_LIMIT) recent.shift();
    }
    return found;
  }

  function renderStats(bump) {
    ui.correct.textContent = `${stats.correct}/${stats.answered}`;
    ui.streak.textContent = String(stats.streak);
    ui.best.textContent = String(stats.best);
    ui.level.textContent = String(currentLevel());
    if (bump) {
      for (const el of [ui.streak, ui.best]) {
        el.classList.remove("bump");
        void el.offsetWidth;
        el.classList.add("bump");
      }
    }
  }

  function resetCard(card, job) {
    const { root } = card;
    root.disabled = false;
    root.classList.remove("is-picked", "is-right", "is-wrong", "is-first");
    root.setAttribute("aria-label", `${job.he}. ${job.en}`);
    card.tag.textContent = "";
    card.emoji.textContent = job.emoji;
    card.name.textContent = job.he;
    const code = document.createElement("span");
    code.className = "soc";
    code.textContent = `SOC ${job.soc}`;
    card.en.replaceChildren(`${job.en} · `, code);
    card.result.hidden = true;
    card.pct.textContent = "";
    card.fill.style.width = "0";
    card.stamp.hidden = true;
  }

  function newRound() {
    round += 1;
    revealed = false;
    pair = pickPair(currentLevel());
    pair.forEach((job, i) => resetCard(cards[i], job));
    ui.verdict.classList.remove("is-right", "is-wrong");
    ui.verdictTitle.textContent = "מי יוחלף קודם?";
    ui.verdictText.textContent = "לחצו על המקצוע שלדעתכם בסיכון גבוה יותר.";
    ui.verdictNote.hidden = true;
    ui.next.hidden = true;
  }

  function countUp(el, p, thisRound) {
    const final = formatPct(p);
    if (reduceMotion.matches) {
      el.textContent = final;
      return;
    }
    const start = performance.now();
    const duration = 750;
    const frame = (now) => {
      if (thisRound !== round) return;
      const k = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = k < 1 ? formatPct(p * eased) : final;
      if (k < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function revealCard(card, job, isFirst, thisRound) {
    card.root.disabled = true;
    card.result.hidden = false;
    card.root.classList.toggle("is-first", isFirst);
    card.rank.textContent = `מקום ${ltr(job.rank)} מתוך 702 בדירוג`;
    card.ms.textContent = job.ms === null
      ? "AI יוצר (Microsoft): אין התאמה ישירה"
      : `AI יוצר (Microsoft): ${ltr(formatScore(job.ms))} מתוך 1`;
    countUp(card.pct, job.p, thisRound);
    requestAnimationFrame(() => {
      card.fill.style.width = `${(job.p * 100).toFixed(2)}%`;
    });
    if (isFirst) {
      const delay = reduceMotion.matches ? 0 : 650;
      setTimeout(() => {
        if (thisRound === round) card.stamp.hidden = false;
      }, delay);
    }
  }

  function msNote(first, second) {
    if (first.ms === null || second.ms === null) return "";
    const gap = Math.abs(first.ms - second.ms);
    if (gap < MS_MEANINGFUL_GAP) return "";
    if (second.ms > first.ms) {
      return `ומה לגבי AI יוצר? לפי Microsoft (2025), דווקא ל${second.he} יש ציון התאמה גבוה יותר: ${ltr(formatScore(second.ms))} לעומת ${ltr(formatScore(first.ms))}.`;
    }
    return `גם לפי Microsoft (2025), ל${first.he} יש ציון התאמה גבוה יותר ל-AI יוצר: ${ltr(formatScore(first.ms))} לעומת ${ltr(formatScore(second.ms))}.`;
  }

  function choose(index) {
    if (revealed || !pair) return;
    revealed = true;
    const thisRound = round;
    const firstIndex = pair[0].p > pair[1].p ? 0 : 1;
    const first = pair[firstIndex];
    const second = pair[1 - firstIndex];
    const isRight = index === firstIndex;
    const brokenStreak = stats.streak;

    stats.answered += 1;
    if (isRight) {
      stats.correct += 1;
      stats.streak += 1;
      stats.best = Math.max(stats.best, stats.streak);
    } else {
      stats.streak = 0;
    }
    saveStats();
    renderStats(isRight);

    pair.forEach((job, i) => revealCard(cards[i], job, i === firstIndex, thisRound));
    const picked = cards[index];
    picked.root.classList.add("is-picked", isRight ? "is-right" : "is-wrong");
    picked.tag.textContent = isRight ? "✓ הבחירה שלך" : "✗ הבחירה שלך";

    let title;
    if (isRight) {
      title = randomItem(RIGHT_TITLES);
      if (MILESTONES.has(stats.streak)) title += ` רצף של ${stats.streak}!`;
    } else {
      title = "לא הפעם";
    }
    ui.verdict.classList.add(isRight ? "is-right" : "is-wrong");
    ui.verdictTitle.textContent = title;

    let text = `${first.he} בסיכון של ${ltr(formatPct(first.p))} לאוטומציה, לעומת ${ltr(formatPct(second.p))} אצל ${second.he}.`;
    if (!isRight && brokenStreak > 0) text += ` הרצף של ${ltr(brokenStreak)} נשבר.`;
    ui.verdictText.textContent = text;

    const note = msNote(first, second);
    ui.verdictNote.textContent = note;
    ui.verdictNote.hidden = !note;

    ui.next.hidden = false;
    ui.next.focus({ preventScroll: true });
    ui.verdict.scrollIntoView({ block: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
  }

  function shareText() {
    const best = stats.best;
    let text = best > 0
      ? `הגעתי לרצף של ${best} במשחק ״מי יוחלף קודם על ידי AI?״ 🤖 נסו לעקוף אותי.`
      : "משחק: מי יוחלף קודם על ידי AI? 🤖 שני מקצועות, נתונים אמיתיים ממחקר.";
    const inFrame = window.top !== window.self;
    if (!inFrame && /^https?:$/.test(location.protocol)) text += ` ${location.origin}${location.pathname}`;
    return text;
  }

  function flashStatus(message) {
    ui.shareStatus.textContent = message;
    clearTimeout(flashStatus.timer);
    flashStatus.timer = setTimeout(() => { ui.shareStatus.textContent = ""; }, 3500);
  }

  async function share() {
    const text = shareText();
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      flashStatus("הטקסט הועתק. אפשר להדביק ולשלוח.");
    } catch (_) {
      flashStatus(text);
    }
  }

  function openAbout() {
    if (typeof ui.about.showModal === "function") ui.about.showModal();
    else ui.about.setAttribute("open", "");
    $("about-title").focus({ preventScroll: true });
    ui.about.scrollTop = 0;
  }

  function closeAbout() {
    if (typeof ui.about.close === "function") ui.about.close();
    else ui.about.removeAttribute("open");
  }

  let resetArmed = false;
  function resetStats() {
    if (!resetArmed) {
      resetArmed = true;
      ui.reset.textContent = "לחצו שוב כדי לאפס";
      setTimeout(() => {
        resetArmed = false;
        ui.reset.textContent = "איפוס התוצאה";
      }, 4000);
      return;
    }
    resetArmed = false;
    ui.reset.textContent = "התוצאה אופסה";
    stats = { ...defaults };
    saveStats();
    renderStats(false);
    newRound();
  }

  cards.forEach((card, i) => card.root.addEventListener("click", () => choose(i)));
  ui.next.addEventListener("click", () => {
    newRound();
    cards[0].root.focus({ preventScroll: true });
  });
  $("open-about").addEventListener("click", openAbout);
  $("close-about").addEventListener("click", closeAbout);
  ui.about.addEventListener("click", (e) => {
    if (e.target === ui.about) closeAbout();
  });
  ui.share.addEventListener("click", share);
  ui.reset.addEventListener("click", resetStats);

  // In RTL the first card sits on the right.
  document.addEventListener("keydown", (e) => {
    if (ui.about.open || e.altKey || e.ctrlKey || e.metaKey) return;
    if (!revealed && e.key === "ArrowRight") { e.preventDefault(); choose(0); }
    else if (!revealed && e.key === "ArrowLeft") { e.preventDefault(); choose(1); }
  });

  if (JOBS.length < 2) {
    ui.verdictTitle.textContent = "הנתונים לא נטענו";
    ui.verdictText.textContent = "הקובץ assets/jobs.js חסר. הריצו את scripts/build_data.py ורעננו את הדף.";
    cards.forEach((c) => { c.root.disabled = true; });
    return;
  }

  renderStats(false);
  newRound();
})();
