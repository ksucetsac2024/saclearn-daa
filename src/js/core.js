"use strict";
/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const INF = Infinity;
const fmt = v => (v === INF ? "∞" : v === -INF ? "−∞" : (typeof v === "number" && v < 0 ? "−" + (-v) : String(v)));
const r2 = x => Math.round(x * 100) / 100;
let _uid = 0;
const uid = p => p + "_" + (++_uid);
const clone = o => JSON.parse(JSON.stringify(o));
const natCmp = (a, b) => {
  const na = Number(a), nb = Number(b);
  if (!isNaN(na) && !isNaN(nb) && String(a).trim() !== "" && String(b).trim() !== "") return na - nb;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
};
const store = {
  get(k, d) {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.has("sync")) {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(p.get("sync")))));
        localStorage.setItem(k, JSON.stringify(decoded));
        const url = new URL(window.location.href);
        url.searchParams.delete("sync");
        window.history.replaceState({}, "", url.pathname + url.hash);
        return decoded;
      }
      const v = localStorage.getItem(k);
      return v == null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      window.dispatchEvent(new CustomEvent("saclearn:progress", { detail: { course: "daa", progress: v } }));
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "SACLEARN_PROGRESS_UPDATE", course: "daa", data: v }, "*");
      }
    } catch {}
  },
  exportSyncUrl(k) {
    const raw = localStorage.getItem(k) || "{}";
    const enc = btoa(unescape(encodeURIComponent(raw)));
    const url = new URL(window.location.href);
    url.searchParams.set("sync", enc);
    return url.toString();
  }
};
function parseNums(s) {
  return String(s).split(/[\s,;]+/).filter(x => x !== "").map(x => {
    const v = Number(x);
    if (isNaN(v)) throw new Error(`"${x}" is not a number.`);
    return v;
  });
}
function parseList(s) { return String(s).split(/[\s,;]+/).filter(x => x !== ""); }

/* ================= step player ================= */
function makePlayer(host, render, onBeforeAction) {
  host.classList.add("player");
  host.innerHTML = `<div class="stage"></div><div class="cap" aria-live="polite"></div>
  <div class="ctrl">
    <button class="btn" data-a="first" title="First step">⏮</button>
    <button class="btn" data-a="prev">◀ Back</button>
    <span class="cnt"></span>
    <button class="btn pri" data-a="next">Next ▶</button>
    <button class="btn" data-a="last" title="Last step">⏭</button>
    <button class="btn" data-a="play">Play</button>
    <input type="range" min="0" max="0" value="0" aria-label="Jump to step">
    <button class="btn btn-challenge" data-a="challenge" title="Active recall mode: predict before seeing">💡 Challenge</button>
  </div>`;
  const stage = $(".stage", host), cap = $(".cap", host), cnt = $(".cnt", host), rng = $("input[type=range]", host);
  const bPlay = $('[data-a="play"]', host);
  let frames = [], i = 0, timer = null, challenge = false;
  function stop() { if (timer) { clearInterval(timer); timer = null; bPlay.textContent = "Play"; } }
  function show() {
    const f = frames[i];
    if (!f) { stage.innerHTML = ""; cap.innerHTML = ""; cnt.textContent = "–"; return; }
    try { stage.innerHTML = render(f, i, frames); } catch (e) { stage.innerHTML = `<p class="err">${esc(e.message)}</p>`; console.error(e); }
    if (challenge && i > 0 && f.msg) {
      cap.innerHTML = `<div class="cap-challenge"><span>✏️ <b>Predict:</b> Work out step ${i + 1} on paper first.</span><button class="btn pri reveal-step-btn" type="button">Reveal</button></div>`;
      const rev = cap.querySelector(".reveal-step-btn");
      if (rev) rev.addEventListener("click", () => { cap.innerHTML = f.msg || ""; });
    } else {
      cap.innerHTML = f.msg || "";
    }
    cnt.textContent = `Step ${i + 1} / ${frames.length}`;
    rng.max = frames.length - 1; rng.value = i;
    $('[data-a="prev"]', host).disabled = $('[data-a="first"]', host).disabled = i === 0;
    $('[data-a="next"]', host).disabled = $('[data-a="last"]', host).disabled = i === frames.length - 1;
  }
  $(".ctrl", host).addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (onBeforeAction) onBeforeAction();
    const a = b.dataset.a;
    if (a === "challenge") {
      challenge = !challenge;
      b.classList.toggle("on", challenge);
      show();
      return;
    }
    if (a === "play") {
      if (timer) { stop(); return; }
      if (i >= frames.length - 1) i = 0;
      bPlay.textContent = "Pause"; show();
      timer = setInterval(() => { if (i >= frames.length - 1) { stop(); return; } i++; show(); }, 1300);
      return;
    }
    stop();
    if (a === "first") i = 0; else if (a === "last") i = frames.length - 1;
    else if (a === "prev") i = Math.max(0, i - 1); else if (a === "next") i = Math.min(frames.length - 1, i + 1);
    show();
  });
  rng.addEventListener("input", () => { stop(); i = +rng.value; show(); });
  return { load(fs, start = 0) { stop(); frames = fs; i = Math.min(start, fs.length - 1); show(); }, stop };
}

const WIDGETS = {};
function bench(id, spec) { WIDGETS[id] = spec; }
function initWidget(el) {
  if (el.dataset.ready) return;
  el.dataset.ready = "1";
  const spec = WIDGETS[el.id]; if (!spec) return;
  const top = $(".bench-top", el);
  if (top && !$(".bench-focus-btn", top)) {
    const fb = document.createElement("button");
    fb.type = "button";
    fb.className = "bench-focus-btn";
    fb.title = "Fullscreen focus mode (Esc to exit)";
    fb.textContent = "⛶ Focus";
    fb.addEventListener("click", () => {
      const active = el.classList.toggle("focus-mode");
      fb.textContent = active ? "✕ Exit" : "⛶ Focus";
      document.body.style.overflow = active ? "hidden" : "";
    });
    top.appendChild(fb);
  }
  let errBox = $(".err", el);
  if (!errBox) { errBox = document.createElement("div"); errBox.className = "err"; const pl = $(".player, .out", el); el.insertBefore(errBox, pl || null); }
  let tmr = null, dirty = false;
  const run = () => {
    clearTimeout(tmr); tmr = null; dirty = false;
    errBox.textContent = "";
    try {
      const res = spec.build(el);
      if (player) { if (!res || !res.length) throw new Error("Nothing to show for this input."); player.load(res); }
    } catch (e) { errBox.textContent = e.message; console.error(e); }
  };
  const flush = () => { if (dirty) run(); };
  const player = spec.render ? makePlayer($(".player", el), spec.render, flush) : null;
  $$("input, select, textarea", el).forEach(inp => {
    inp.addEventListener("change", run);
    if (inp.type === "range" || inp.tagName !== "SELECT") {
      inp.addEventListener("input", () => {
        dirty = true;
        clearTimeout(tmr);
        tmr = setTimeout(run, inp.type === "range" ? 0 : 350);
      });
    }
    if (inp.tagName === "INPUT" && inp.type !== "checkbox" && inp.type !== "range") inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); run(); } });
  });
  $$(".chip[data-fill]", el).forEach(c => c.addEventListener("click", () => {
    const vals = JSON.parse(c.dataset.fill);
    for (const k in vals) {
      const inp = el.querySelector("#" + k);
      if (!inp) continue;
      if (inp.type === "checkbox") inp.checked = !!vals[k]; else inp.value = vals[k];
    }
    run();
  }));
  if (spec.init) spec.init(el);
  run();
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    const f = document.querySelector(".bench.focus-mode");
    if (f) {
      f.classList.remove("focus-mode");
      const btn = f.querySelector(".bench-focus-btn");
      if (btn) btn.textContent = "⛶ Focus";
      document.body.style.overflow = "";
    }
  }
});

/* ================= SVG: graphs ================= */
const MK_KINDS = ["", "hi", "ok", "bad", "tree", "back", "fwd", "cross", "ink"];
function svgDefs(id) {
  return `<defs>${MK_KINDS.map(k => `<marker id="${id}-${k || "d"}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mk ${k}" d="M0,0 L10,5 L0,10 z"/></marker>`).join("")}</defs>`;
}
function circleLayout(ids, cx = 200, cy = 170, R = null) {
  const n = ids.length, pos = {};
  R = R || Math.max(90, Math.min(200, 34 * n / Math.PI));
  ids.forEach((id, k) => {
    const a = -Math.PI / 2 + 2 * Math.PI * k / n;
    pos[id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  return pos;
}
/* g = {nodes:[{id,x,y,cls,sub,label,subHot}], edges:[{u,v,w,cls,label}], directed, r} */
function drawGraph(g, opt = {}) {
  const R = g.r || 17, id = uid("g");
  const P = {}; g.nodes.forEach(n => P[n.id] = n);
  const xs = g.nodes.map(n => n.x), ys = g.nodes.map(n => n.y);
  const pad = 34;
  const minx = Math.min(...xs) - pad - 10, maxx = Math.max(...xs) + pad + 10, miny = Math.min(...ys) - pad, maxy = Math.max(...ys) + pad + 10;
  const W = maxx - minx, H = maxy - miny;
  const has = new Set(g.edges.map(e => e.u + "→" + e.v));
  let out = `<svg viewBox="${minx} ${miny} ${W} ${H}" width="${Math.min(W * (opt.scale || 1), opt.maxW || 620)}" role="img" aria-label="${esc(opt.aria || "graph")}">${svgDefs(id)}`;
  let labels = "";
  for (const e of g.edges) {
    const a = P[e.u], b = P[e.v]; if (!a || !b) continue;
    const cls = e.cls || "";
    const mk = g.directed ? ` marker-end="url(#${id}-${MK_KINDS.includes(cls) && cls ? cls : "d"})"` : "";
    if (e.u === e.v) { // self loop
      out += `<path class="e ${cls}" d="M${a.x - 8},${a.y - R + 2} C${a.x - 30},${a.y - R - 40} ${a.x + 30},${a.y - R - 40} ${a.x + 8},${a.y - R + 2}"${mk}/>`;
      if (e.w !== undefined || e.label) labels += wlabel(a.x, a.y - R - 34, e.label ?? fmt(e.w));
      continue;
    }
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const curved = g.directed && has.has(e.v + "→" + e.u);
    if (curved) {
      const nx = -uy, ny = ux, off = 22;
      const cx = (a.x + b.x) / 2 + nx * off, cy = (a.y + b.y) / 2 + ny * off;
      const s = toward(a, cx, cy, R), t = toward(b, cx, cy, R + 2);
      out += `<path class="e ${cls}" d="M${s.x},${s.y} Q${cx},${cy} ${t.x},${t.y}"${mk}/>`;
      if (e.w !== undefined || e.label) labels += wlabel((a.x + b.x) / 2 + nx * off * 0.62, (a.y + b.y) / 2 + ny * off * 0.62, e.label ?? fmt(e.w));
    } else {
      const sx = a.x + ux * R, sy = a.y + uy * R, tx = b.x - ux * (R + (g.directed ? 2 : 0)), ty = b.y - uy * (R + (g.directed ? 2 : 0));
      out += `<line class="e ${cls}" x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}"${mk}/>`;
      if (e.w !== undefined || e.label) {
        const t = e.lpos ?? 0.5;
        labels += wlabel(a.x + dx * t, a.y + dy * t, e.label ?? fmt(e.w));
      }
    }
  }
  out += labels;
  for (const n of g.nodes) {
    out += `<g class="n ${n.cls || ""}"><circle cx="${n.x}" cy="${n.y}" r="${R}"/><text class="lbl" x="${n.x}" y="${n.y + 5}" text-anchor="middle">${esc(n.label ?? n.id)}</text>`;
    if (n.sub !== undefined && n.sub !== "") out += `<text class="sub${n.subHot ? " hot" : ""}" x="${n.x}" y="${n.y + R + 14}" text-anchor="middle">${esc(n.sub)}</text>`;
    out += `</g>`;
  }
  return out + `</svg>`;
}
function toward(c, x, y, R) { const dx = x - c.x, dy = y - c.y, L = Math.hypot(dx, dy) || 1; return { x: c.x + dx / L * R, y: c.y + dy / L * R }; }
function wlabel(x, y, t) {
  const s = String(t), w = 8 * s.length + 8;
  return `<rect class="wtbg" x="${x - w / 2}" y="${y - 10}" width="${w}" height="18" rx="4"/><text class="wt" x="${x}" y="${y + 4}" text-anchor="middle">${esc(s)}</text>`;
}

/* Graph text: one edge per line "u v [w]"; a line with a single token adds an isolated vertex. */
function parseGraph(text, { directed = false, weighted = false } = {}) {
  const nodes = [], seen = new Set(), edges = [], keys = new Set();
  const addN = x => { if (!seen.has(x)) { seen.add(x); nodes.push(x); } };
  for (let raw of String(text).split(/\n|;/)) {
    const line = raw.replace(/[(),]/g, " ").replace(/->|→|—|–/g, " ").trim();
    if (!line) continue;
    const t = line.split(/\s+/);
    if (t.length === 1) { addN(t[0]); continue; }
    const [u, v] = t; let w = t[2] !== undefined ? Number(t[2]) : undefined;
    if (weighted && (w === undefined || isNaN(w))) throw new Error(`Edge "${raw.trim()}" needs a weight: write it as "u v weight".`);
    if (!weighted) w = undefined;
    addN(u); addN(v);
    const k = directed ? u + "|" + v : [u, v].sort().join("|");
    if (keys.has(k)) continue;
    keys.add(k);
    edges.push({ u, v, w });
  }
  if (!nodes.length) throw new Error("Enter at least one edge, one per line, like: A B 4");
  return { nodes, edges, directed };
}
function adjOf(G) {
  const adj = {}; G.nodes.forEach(n => adj[n] = []);
  for (const e of G.edges) {
    adj[e.u].push({ v: e.v, w: e.w, e });
    if (!G.directed && e.u !== e.v) adj[e.v].push({ v: e.u, w: e.w, e });
  }
  for (const k in adj) adj[k].sort((a, b) => natCmp(a.v, b.v));
  return adj;
}
function positionsFor(G, preset) {
  if (preset && G.nodes.every(n => preset[n])) return preset;
  return circleLayout([...G.nodes].sort(natCmp));
}
/* Build a drawable graph from G, positions and per-step class maps */
function viewGraph(G, pos, { ncls = {}, nsub = {}, ecls = () => "", directed = G.directed, hot = {} } = {}) {
  return {
    directed,
    nodes: G.nodes.map(id => ({ id, x: pos[id].x, y: pos[id].y, cls: ncls[id] || "", sub: nsub[id], subHot: hot[id] })),
    edges: G.edges.map(e => ({ u: e.u, v: e.v, w: e.w, cls: ecls(e) || "" }))
  };
}
const ekey = (u, v, directed) => directed ? u + "|" + v : [u, v].sort().join("|");

/* ================= SVG: trees ================= */
/* Generic tidy layout. node = {label, children, cls, w, note}. Returns svg. */
function layoutTree(roots, { nodeW = n => n.w || 34, gap = 14, levelH = 64 } = {}) {
  const next = [];
  const all = [];
  function shift(n, dx) { n.x += dx; (n.children || []).forEach(c => shift(c, dx)); }
  function bump(n) { const d = n.depth; next[d] = Math.max(next[d] ?? -Infinity, n.x + n.w / 2 + gap); (n.children || []).forEach(bump); }
  function rec(n, d) {
    n.depth = d; n.w = nodeW(n); all.push(n);
    const kids = n.children || [];
    if (!kids.length) n.x = (next[d] ?? 0) + n.w / 2;
    else {
      kids.forEach(c => rec(c, d + 1));
      n.x = (kids[0].x + kids[kids.length - 1].x) / 2;
      const minX = (next[d] ?? 0) + n.w / 2;
      if (n.x < minX) { shift(n, minX - n.x); bump(n); }
    }
    next[d] = n.x + n.w / 2 + gap;
  }
  roots.forEach(r => rec(r, 0));
  all.forEach(n => n.y = n.depth * levelH);
  return all;
}
/* draw a forest of circle nodes (or boxes when n.box) */
function drawTree(roots, opt = {}) {
  const R = opt.r || 17;
  const all = layoutTree(roots, { nodeW: opt.nodeW || (n => n.box ? n.box : 2 * R + 6), gap: opt.gap ?? 14, levelH: opt.levelH || 64 });
  if (!all.length) return `<p class="faint">(empty)</p>`;
  const pad = 26;
  const minx = Math.min(...all.map(n => n.x - n.w / 2)) - pad, maxx = Math.max(...all.map(n => n.x + n.w / 2)) + pad;
  const maxy = Math.max(...all.map(n => n.y)) + R + pad + (opt.extraBottom || 16);
  const miny = -R - pad + 6;
  const W = maxx - minx, H = maxy - miny;
  const id = uid("t");
  let s = `<svg viewBox="${minx} ${miny} ${W} ${H}" width="${Math.min(W * (opt.scale || 1), opt.maxW || 900)}" role="img" aria-label="${esc(opt.aria || "tree")}">${svgDefs(id)}`;
  for (const n of all) for (const c of n.children || []) {
    const cls = c.ecls || "";
    const y1 = n.y + (n.box ? 14 : R), y2 = c.y - (c.box ? 14 : R);
    s += `<line class="e ${cls}" x1="${n.x}" y1="${y1}" x2="${c.x}" y2="${y2}"${opt.arrowsUp ? ` marker-start="url(#${id}-ink)"` : ""}/>`;
    if (c.elabel) s += `<text class="faint" x="${(n.x + c.x) / 2 + (c.x < n.x ? -6 : 6)}" y="${(y1 + y2) / 2 + 4}" text-anchor="${c.x < n.x ? "end" : c.x > n.x ? "start" : "middle"}">${esc(c.elabel)}</text>`;
  }
  for (const n of all) {
    if (n.box) {
      s += `<g class="n ${n.cls || ""}"><rect x="${n.x - n.box / 2}" y="${n.y - 14}" width="${n.box}" height="28" rx="5"/><text class="${n.small ? "sub" : "lbl"} mono" x="${n.x}" y="${n.y + 5}" text-anchor="middle" style="font-size:${n.fs || 13}px">${esc(n.label)}</text></g>`;
    } else {
      s += `<g class="n ${n.cls || ""}"><circle cx="${n.x}" cy="${n.y}" r="${R}"/><text class="lbl" x="${n.x}" y="${n.y + 5}" text-anchor="middle">${esc(n.label)}</text></g>`;
    }
    if (n.note !== undefined && n.note !== "") s += `<text class="sub${n.noteHot ? " hot" : ""}" x="${n.x + (n.box ? 0 : R + 4)}" y="${n.box ? n.y + 30 : n.y - R + 2}" text-anchor="${n.box ? "middle" : "start"}">${esc(n.note)}</text>`;
    if (n.under !== undefined) s += `<text class="sub${n.underHot ? " hot" : ""}" x="${n.x}" y="${n.y + (n.box ? 30 : R + 14)}" text-anchor="middle">${esc(n.under)}</text>`;
  }
  return s + `</svg>`;
}
/* Binary tree laid out by in-order rank. node = {k, l, r, cls, note, noteHot} */
function drawBinTree(root, opt = {}) {
  if (!root) return `<p class="faint" style="padding:10px">(empty tree)</p>`;
  const R = opt.r || 18, dx = opt.dx || 44, dy = opt.dy || 62;
  const list = []; let rank = 0;
  (function walk(n, d) { if (!n) return; walk(n.l, d + 1); n._x = rank++ * dx; n._y = d * dy; list.push(n); walk(n.r, d + 1); })(root, 0);
  const W = (rank - 1) * dx + 2 * R + 60, H = Math.max(...list.map(n => n._y)) + 2 * R + 40;
  let s = `<svg viewBox="${-R - 30} ${-R - 12} ${W} ${H}" width="${Math.min(W, opt.maxW || 900)}" role="img" aria-label="${esc(opt.aria || "binary tree")}">`;
  for (const n of list) for (const c of [n.l, n.r]) if (c) s += `<line class="e ${c.ecls || ""}" x1="${n._x}" y1="${n._y + R}" x2="${c._x}" y2="${c._y - R}"/>`;
  for (const n of list) {
    const lab = String(n.k);
    const fs = lab.length > 3 ? 11 : 14;
    s += `<g class="n ${n.cls || ""}"><circle cx="${n._x}" cy="${n._y}" r="${R}"/><text class="lbl" x="${n._x}" y="${n._y + 5}" text-anchor="middle" style="font-size:${fs}px">${esc(lab)}</text></g>`;
    if (n.note !== undefined) s += `<text class="sub${n.noteHot ? " hot" : ""}" x="${n._x + R + 2}" y="${n._y - R + 4}">${esc(n.note)}</text>`;
  }
  return s + `</svg>`;
}

/* ================= HTML tables ================= */
/* rows: array of arrays of cells; a cell may be {v, c} for class */
function table(head, rows, { cls = "num", rowHead = null } = {}) {
  const cell = (x, tag = "td") => {
    if (x && typeof x === "object" && "v" in x) return `<${tag} class="${x.c || ""}">${x.raw ? x.v : esc(fmt(x.v))}</${tag}>`;
    return `<${tag}>${esc(fmt(x))}</${tag}>`;
  };
  let h = `<div class="tbl-wrap"><table class="tbl ${cls}">`;
  if (head) h += `<tr>${head.map(x => cell(x, "th")).join("")}</tr>`;
  rows.forEach((r, i) => { h += `<tr>${rowHead ? cell(rowHead[i], "th") : ""}${r.map(x => cell(x)).join("")}</tr>`; });
  return h + `</table></div>`;
}
function arr(vals, cls = []) {
  return `<div class="arr">${vals.map((v, i) => `<span class="${cls[i] || ""}">${esc(fmt(v))}</span>`).join("")}</div>`;
}
function matrixHTML(M, labels, { hl = () => "" } = {}) {
  return table(["", ...labels], M.map((row, i) => row.map((v, j) => ({ v, c: hl(i, j) }))), { rowHead: labels });
}

const PKEY = "daa-guide-progress-v1";
let progress = store.get(PKEY, {});
function topics() { return $$(".topic").filter(t => t.dataset.mod && t.dataset.mod !== "0"); }
function setDone(id, val) {
  progress[id] = !!val; store.set(PKEY, progress); paintProgress();
}
function paintProgress() {
  const ts = topics(); const n = ts.length; const d = ts.filter(t => progress[t.id]).length;
  $$("[data-tick]").forEach(el => el.classList.toggle("done", !!progress[el.dataset.tick]));
  $$(".prog-bar i").forEach(i => i.style.width = (n ? 100 * d / n : 0) + "%");
  $$(".prog-text").forEach(el => el.textContent = `${d} of ${n} topics done`);
  for (const m of ["1", "2", "3", "4"]) {
    const mt = ts.filter(t => t.dataset.mod === m);
    const cnt = mt.filter(t => progress[t.id]).length;
    $$(`.mprog[data-mod="${m}"], .rail-mod-prog[data-mod="${m}"]`).forEach(el => el.textContent = `${cnt}/${mt.length}`);
  }
  $$(".done-btn").forEach(b => {
    const id = b.dataset.id; b.classList.toggle("isdone", !!progress[id]);
    b.textContent = progress[id] ? "✓ Marked as done" : "Mark this topic as done";
  });
}
function buildNav() {
  const ts = topics();
  const mods = {
    1: "Basics, Analysis & AVL",
    2: "Disjoint Sets, Graphs, D&C",
    3: "Greedy, DP, Backtracking",
    4: "B&B, Complexity, Randomized"
  };
  let rail = "", home = "";
  for (const m of ["1", "2", "3", "4"]) {
    const mt = ts.filter(t => t.dataset.mod === m);
    const items = mt.map(t => `<li><a href="#${t.id}" data-nav="${t.id}"><span class="tick" data-tick="${t.id}"></span><span>${esc(t.dataset.title)}</span></a></li>`).join("");
    rail += `<div class="rail-mod-group open" data-mod="${m}">
      <button class="rail-mod-header" type="button">
        <span class="rail-mod-chevron">›</span>
        <span class="rail-mod-num">${m}</span>
        <span class="rail-mod-title">${esc(mods[m])}</span>
        <span class="rail-mod-prog" data-mod="${m}">0/${mt.length}</span>
      </button>
      <ul class="rail-mod-topics">${items}</ul>
    </div>`;
    home += `<div class="mod"><span class="eyebrow">Module ${m}</span> <span class="mprog" data-mod="${m}"></span><h3>${esc(mods[m])}</h3><ol>${mt.map(t => `<li><a href="#${t.id}"><span class="tick" data-tick="${t.id}"></span>${esc(t.dataset.title)}</a></li>`).join("")}</ol></div>`;
  }
  $("#rail-list").innerHTML = rail;
  $("#home-mods").innerHTML = home;

  $$(".rail-mod-header").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".rail-mod-group").classList.toggle("open");
    });
  });

  ts.forEach((t, k) => {
    const prev = ts[k - 1], next = ts[k + 1];
    const f = document.createElement("div"); f.className = "topic-foot";
    f.innerHTML = `${prev ? `<a class="btn" href="#${prev.id}">← ${esc(prev.dataset.title)}</a>` : `<a class="btn" href="#home">← Overview</a>`}
      <span class="sp"></span><button class="btn done-btn" data-id="${t.id}"></button>
      ${next ? `<a class="btn pri" href="#${next.id}">${esc(next.dataset.title)} →</a>` : `<a class="btn pri" href="#home">Overview →</a>`}`;
    t.appendChild(f);
    const hdr = $("header", t);
    if (hdr && !$(".eyebrow", hdr)) hdr.insertAdjacentHTML("afterbegin", `<span class="eyebrow">Module ${t.dataset.mod} · Topic ${k + 1} of ${ts.length}</span>`);
  });
  document.addEventListener("click", e => {
    const b = e.target.closest(".done-btn"); if (b) setDone(b.dataset.id, !progress[b.dataset.id]);
  });
}
function route() {
  const h = (location.hash || "").slice(1);
  const t = h && document.getElementById(h);
  const target = t && (t.classList.contains("topic") || t.id === "home") ? t : $(".home");
  $$(".topic.show, .home.show").forEach(x => x.classList.remove("show"));
  target.classList.add("show");
  $$("[data-nav]").forEach(a => a.classList.toggle("on", a.dataset.nav === target.id));
  
  const crumb = $("#page-breadcrumbs");
  const mods = { 1: "Module 1: Basics, Analysis & AVL", 2: "Module 2: Disjoint Sets, Graphs, D&C", 3: "Module 3: Greedy, DP, Backtracking", 4: "Module 4: B&B, Complexity, Randomized" };
  if (crumb) {
    if (target.id === "cheatsheet") {
      crumb.innerHTML = `<a href="#home">CSE - PCCST502</a> <span class="sep">›</span> <span class="cur">Complexity Cheat Sheet</span>`;
    } else if (target.id === "mock-test") {
      crumb.innerHTML = `<a href="#home">CSE - PCCST502</a> <span class="sep">›</span> <span class="cur">Mock Test &amp; Model Question Paper</span>`;
    } else if (target.id === "home") {
      crumb.innerHTML = `<a href="#home">CSE - PCCST502</a> <span class="sep">›</span> <span class="cur">Overview</span>`;
    } else if (target.dataset.mod && mods[target.dataset.mod]) {
      crumb.innerHTML = `<a href="#home">CSE - PCCST502</a> <span class="sep">›</span> <span>${esc(mods[target.dataset.mod])}</span> <span class="sep">›</span> <span class="cur">${esc(target.dataset.title || "")}</span>`;
      const grp = $(`.rail-mod-group[data-mod="${target.dataset.mod}"]`);
      if (grp) grp.classList.add("open");
    } else {
      crumb.innerHTML = "";
    }
  }

  $$(".bench", target).forEach(initWidget);
  $$("[data-static]", target).forEach(el => { if (!el.dataset.ready) { el.dataset.ready = 1; STATIC[el.dataset.static] && STATIC[el.dataset.static](el); } });
  document.title = (target.dataset.title ? target.dataset.title + " · " : "") + "DAA Visual Guide · SAC LEARN";
  $(".rail").classList.remove("open");
  $("#rail-backdrop")?.classList.remove("open");
  $("#menu-btn")?.setAttribute("aria-expanded", "false");
  if (!h || !h.startsWith("q-")) window.scrollTo(0, 0);
}
const STATIC = {}; // id -> fn(el) for non-interactive drawings generated by script

/* ================= quizzes ================= */
function wireQuizzes() {
  $$(".mcq").forEach(q => {
    const ans = +q.dataset.answer;
    const btns = $$(".opts button", q);
    btns.forEach((b, i) => b.addEventListener("click", () => {
      if (q.classList.contains("answered")) return;
      q.classList.add("answered");
      btns.forEach((x, j) => { x.disabled = true; if (j === ans) x.classList.add("right"); });
      if (i !== ans) b.classList.add("wrong");
    }));
  });
}

function wireSync() {
  const dlg = $("#sync-dialog");
  const openBtn = $("#open-sync-btn");
  const closeBtn = $("#close-sync-btn");
  const copyBtn = $("#copy-sync-btn");
  const urlInp = $("#sync-url-input");
  const exportBtn = $("#export-file-btn");
  const importInp = $("#import-file-input");
  const status = $("#sync-status");
  if (!dlg || !openBtn) return;
  openBtn.addEventListener("click", () => {
    urlInp.value = store.exportSyncUrl(PKEY);
    status.className = "sync-status";
    status.textContent = "";
    dlg.showModal();
  });
  closeBtn?.addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  copyBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(urlInp.value);
      status.className = "sync-status";
      status.textContent = "✓ Transfer link copied to clipboard.";
    } catch {
      urlInp.select();
      status.className = "sync-status err";
      status.textContent = "Copy failed. Please manually copy the URL above.";
    }
  });
  exportBtn?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `saclearn-daa-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    status.className = "sync-status";
    status.textContent = "✓ Backup file downloaded.";
  });
  importInp?.addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result));
        if (typeof parsed !== "object" || parsed === null) throw new Error();
        progress = Object.assign(progress, parsed);
        store.set(PKEY, progress);
        paintProgress();
        urlInp.value = store.exportSyncUrl(PKEY);
        status.className = "sync-status";
        status.textContent = "✓ Backup restored successfully.";
      } catch {
        status.className = "sync-status err";
        status.textContent = "Failed to parse backup file.";
      }
      importInp.value = "";
    };
    r.readAsText(file);
  });
  window.addEventListener("storage", e => {
    if (e.key === PKEY) {
      progress = store.get(PKEY, {});
      paintProgress();
    }
  });
  window.addEventListener("message", e => {
    if (e.data?.type === "SACLEARN_SET_PROGRESS" && e.data.course === "daa" && e.data.data) {
      progress = e.data.data;
      store.set(PKEY, progress);
      paintProgress();
    }
  });
}

function wireSidebar() {
  const CKEY = "daa-sidebar-collapsed";
  const shell = $(".shell");
  const edgeBtn = $("#rail-edge-btn");
  const menuBtn = $("#menu-btn");
  const rail = $(".rail");
  const backdrop = $("#rail-backdrop");
  if (!shell) return;
  const setCollapsed = val => {
    shell.classList.toggle("collapsed", val);
    try { localStorage.setItem(CKEY, val ? "1" : "0"); } catch {}
  };
  const setDrawer = open => {
    rail?.classList.toggle("open", open);
    backdrop?.classList.toggle("open", open);
    menuBtn?.setAttribute("aria-expanded", open ? "true" : "false");
  };
  if (window.innerWidth > 900 && localStorage.getItem(CKEY) === "1") {
    shell.classList.add("collapsed");
  }
  edgeBtn?.addEventListener("click", () => setCollapsed(!shell.classList.contains("collapsed")));
  menuBtn?.addEventListener("click", () => setDrawer(!rail.classList.contains("open")));
  backdrop?.addEventListener("click", () => setDrawer(false));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && rail?.classList.contains("open")) setDrawer(false);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      setCollapsed(!shell.classList.contains("collapsed"));
    }
  });
}

function wireTheme() {
  const root = document.documentElement;
  const syncThemeMeta = theme => {
    const color = theme === "dark" ? "#0f172a" : "#f0f7ff";
    $$('meta[name="theme-color"]').forEach(m => { m.content = color; });
  };
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
    syncThemeMeta(saved);
  }
  $("#theme-toggle-btn")?.addEventListener("click", () => {
    const cur = root.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    syncThemeMeta(next);
    try { localStorage.setItem("theme", next); } catch {}
  });
}

function wireSearch() {
  const dlg = $("#search-dialog");
  const openBtn = $("#open-search-btn");
  const escBtn = $("#cmd-esc-btn");
  const input = $("#cmd-search-input");
  const list = $("#cmd-results-list");
  if (!dlg || !input || !list) return;

  const getItems = () => {
    const arr = [
      { title: "Course Overview", hash: "#home", meta: "KTU PCCST502" },
      { title: "Complexity Cheat Sheet", hash: "#cheatsheet", meta: "Reference & Recurrences" },
      { title: "DAA Mock Test & MQP", hash: "#mock-test", meta: "Part A & B Practice" }
    ];
    topics().forEach(t => {
      arr.push({ title: t.dataset.title || "", hash: `#${t.id}`, meta: `Module ${t.dataset.mod}` });
    });
    return arr;
  };

  const render = q => {
    const query = q.trim().toLowerCase();
    const items = getItems();
    const filtered = items.filter(it => it.title.toLowerCase().includes(query) || it.meta.toLowerCase().includes(query));
    if (!filtered.length) {
      list.innerHTML = `<div style="padding:14px;color:var(--muted);font-size:13px;text-align:center">No matching topics found.</div>`;
      return;
    }
    list.innerHTML = filtered.map((it, idx) => `
      <a class="cmd-item ${idx === 0 ? "selected" : ""}" href="${it.hash}">
        <span>${esc(it.title)}</span>
        <span class="cmd-item-meta">${esc(it.meta)}</span>
      </a>
    `).join("");
  };

  const openDlg = () => {
    input.value = "";
    render("");
    dlg.showModal();
    input.focus();
  };
  const closeDlg = () => dlg.close();

  openBtn?.addEventListener("click", openDlg);
  escBtn?.addEventListener("click", closeDlg);
  dlg.addEventListener("click", e => { if (e.target === dlg) closeDlg(); });
  list.addEventListener("click", e => {
    const a = e.target.closest("a");
    if (a) closeDlg();
  });

  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", e => {
    const cur = $(".cmd-item.selected", list);
    const all = $$(".cmd-item", list);
    const idx = all.indexOf(cur);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (all.length) {
        cur?.classList.remove("selected");
        all[(idx + 1) % all.length].classList.add("selected");
        all[(idx + 1) % all.length].scrollIntoView({ block: "nearest" });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (all.length) {
        cur?.classList.remove("selected");
        all[(idx - 1 + all.length) % all.length].classList.add("selected");
        all[(idx - 1 + all.length) % all.length].scrollIntoView({ block: "nearest" });
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (cur) {
        cur.click();
        closeDlg();
      }
    }
  });

  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (dlg.open) closeDlg(); else openDlg();
    }
  });
}

function wireCheatSheet() {
  const inp = $("#cs-search");
  const table = $("#cs-algo-table");
  const pills = $("#cs-filter-pills");
  if (!table) return;
  let activeMod = "all";

  const filter = () => {
    const q = (inp?.value || "").toLowerCase().trim();
    const matches = el => {
      const matchMod = activeMod === "all" || el.dataset.mod === activeMod.slice(1);
      const matchText = !q || el.textContent.toLowerCase().includes(q);
      return matchMod && matchText;
    };
    $$("tbody tr", table).forEach(tr => {
      tr.style.display = matches(tr) ? "" : "none";
    });
    $$(".cs-filter-card").forEach(card => {
      card.style.display = matches(card) ? "" : "none";
    });
  };

  inp?.addEventListener("input", filter);
  pills?.addEventListener("click", e => {
    const b = e.target.closest(".cs-pill");
    if (!b) return;
    $$(".cs-pill", pills).forEach(x => x.classList.remove("on"));
    b.classList.add("on");
    activeMod = b.dataset.filter;
    filter();
  });
}

function wireMockTest() {
  const mqpView = $("#mt-mqp-view");
  const quizView = $("#mt-quiz-view");
  const tabs = $$(".mt-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("on"));
      tab.classList.add("on");
      const isQuiz = tab.dataset.view === "quiz";
      if (mqpView) mqpView.style.display = isQuiz ? "none" : "";
      if (quizView) quizView.style.display = isQuiz ? "" : "none";
      if (isQuiz && !quizView.dataset.ready) initTimedQuiz();
    });
  });

  function initTimedQuiz() {
    quizView.dataset.ready = "1";
    const qList = [
      { q: "What is the time complexity of building an AVL tree from n sorted keys?", opts: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"], a: 1, why: "Each insertion into an AVL tree takes O(log n), so n insertions require O(n log n) total time." },
      { q: "Master theorem solution for T(n) = 8T(n/2) + n^2 is:", opts: ["Θ(n^2)", "Θ(n^3)", "Θ(n^2 log n)", "Θ(n log n)"], a: 1, why: "n^(log_2 8) = n^3. Since f(n) = n^2 grows strictly slower by a polynomial gap (Case 1), T(n) = Θ(n^3)." },
      { q: "Which property allows path compression and union-by-rank to achieve nearly linear time?", opts: ["Inverse Ackermann function bound", "Master theorem", "Dynamic programming", "Fibonacci tree bound"], a: 0, why: "Any sequence of m union-find operations takes O(m α(n)) where α(n) is the inverse Ackermann function." },
      { q: "How many scalar multiplications are done in Strassen's matrix multiplication for two 2x2 blocks?", opts: ["8", "7", "6", "4"], a: 1, why: "Strassen replaces the naive 8 multiplications with 7 recursive multiplications." },
      { q: "Kosaraju's SCC algorithm requires:", opts: ["Two DFS traversals and graph transposition", "One BFS traversal", "Dijkstra and Prim", "Topological sort only"], a: 0, why: "Kosaraju runs DFS on G to get finish times, transposes G to G^T, and runs DFS in decreasing finish order." },
      { q: "Topological sorting can only be performed on:", opts: ["Undirected graphs", "Directed Acyclic Graphs (DAG)", "Complete graphs", "Bipartite graphs"], a: 1, why: "A graph with directed cycles cannot have a linear vertex ordering where all edges go forward." },
      { q: "Which problem can be solved optimally using a greedy approach?", opts: ["0/1 Knapsack", "Fractional Knapsack", "Longest Common Subsequence", "Traveling Salesperson Problem"], a: 1, why: "Fractional Knapsack has the greedy choice property; 0/1 Knapsack requires dynamic programming." },
      { q: "Dijkstra's shortest path algorithm can yield wrong answers if the graph has:", opts: ["Cycles", "Negative edge weights", "Directed edges", "Disconnected components"], a: 1, why: "Dijkstra greedily finalizes vertex distances, which fails if a negative edge reduces an already finalized distance." },
      { q: "Kruskal's algorithm finds a Minimum Spanning Tree using which data structure?", opts: ["Priority Queue only", "Disjoint Set (Union-Find)", "AVL Tree", "Hash Table"], a: 1, why: "Kruskal sorts all edges and uses Disjoint Sets to check whether adding an edge creates a cycle." },
      { q: "What is the time complexity of Matrix Chain Multiplication with n matrices?", opts: ["O(n^2)", "O(n^3)", "O(2^n)", "O(n!)"], a: 1, why: "There are O(n^2) subproblems (i, j) and each takes O(n) loop steps to find the optimal split k, giving O(n^3)." },
      { q: "Floyd-Warshall computes shortest paths between:", opts: ["Single source to all vertices", "All pairs of vertices", "Adjacent vertices only", "Leaves of a tree"], a: 1, why: "Floyd-Warshall is an O(V^3) dynamic programming algorithm for all-pairs shortest paths." },
      { q: "The state space tree for the 4-Queens problem has how many leaf nodes in brute force?", opts: ["16", "256", "64", "24"], a: 1, why: "Each of the 4 queens has 4 possible column choices, giving 4^4 = 256 configurations." },
      { q: "Which search strategy is primarily employed in Least-Cost Branch and Bound (LCBB)?", opts: ["Depth-First Search", "Breadth-First Search with FIFO Queue", "Priority Queue based on estimated bound", "Linear Search"], a: 2, why: "LCBB uses a min-heap priority queue to always expand the live node with the most promising bound." },
      { q: "If problem A is polynomial-time reducible to problem B (A ≤p B), and B is in P, then:", opts: ["A is in P", "A is NP-Complete", "A is NP-Hard", "B is NP-Complete"], a: 0, why: "If B can be solved in polynomial time, any instance of A can be mapped to B and solved in polynomial time." },
      { q: "The Cook-Levin theorem proved that which problem is NP-Complete?", opts: ["3-SAT", "Boolean Satisfiability (SAT)", "Vertex Cover", "Clique"], a: 1, why: "Cook proved that any problem in NP can be reduced to SAT, making SAT the first proven NP-Complete problem." },
      { q: "Vertex Cover of size k on G is equivalent to which problem on complement graph G'?", opts: ["Clique of size |V| - k", "Hamiltonian cycle", "Graph coloring", "Eulerian circuit"], a: 0, why: "S is a vertex cover of G iff V - S is an independent set of G, which is a clique in the complement graph G'." },
      { q: "What is the approximation ratio of First Fit Decreasing (FFD) for Bin Packing?", opts: ["2", "11/9 (about 1.22)", "1.5", "log n"], a: 1, why: "FFD guarantees using at most (11/9) OPT + 1 bins, which is asymptotically ~1.22 times the optimum." },
      { q: "Expected running time of Randomized Quicksort on any input is:", opts: ["O(n^2)", "O(n log n)", "O(n)", "O(log n)"], a: 1, why: "Randomized pivot selection guarantees balanced partitions on average, yielding expected O(n log n) time." },
      { q: "Which recurrence corresponds to Merge Sort?", opts: ["T(n) = 2T(n/2) + O(n)", "T(n) = T(n - 1) + O(1)", "T(n) = 7T(n/2) + O(n^2)", "T(n) = T(n/2) + O(1)"], a: 0, why: "Merge Sort splits the array in half (2 subproblems of size n/2) and merges in O(n) time." },
      { q: "In Dynamic Programming, memoization is associated with:", opts: ["Top-down approach", "Bottom-up tabulation", "Greedy choice", "Randomized partition"], a: 0, why: "Memoization starts from the top goal and caches recursive results on demand." }
    ];

    const quizList = $("#mt-quiz-list");
    let score = 0;
    const answered = {};

    quizList.innerHTML = qList.map((item, i) => `
      <div class="card mcq" data-idx="${i}">
        <p><b>Q${i + 1}.</b> ${esc(item.q)}</p>
        <div class="opts">
          ${item.opts.map((opt, oi) => `<button type="button" data-oi="${oi}">${esc(opt)}</button>`).join("")}
        </div>
        <div class="why">${esc(item.why)}</div>
      </div>
    `).join("");

    quizList.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      const card = b.closest(".mcq");
      const qIdx = +card.dataset.idx;
      if (answered[qIdx] !== undefined) return;
      const selOpt = +b.dataset.oi;
      const rightOpt = qList[qIdx].a;
      answered[qIdx] = selOpt;

      $$(".opts button", card).forEach((btn, oi) => {
        btn.disabled = true;
        if (oi === rightOpt) btn.classList.add("right");
      });
      if (selOpt === rightOpt) {
        score++;
        $("#mt-score-val").textContent = score;
      } else {
        b.classList.add("wrong");
      }
      $(".why", card).style.display = "block";
    });

    let remSec = 1800;
    const timerVal = $("#mt-timer-val");
    const interval = setInterval(() => {
      remSec--;
      if (remSec <= 0) {
        clearInterval(interval);
        timerVal.textContent = "00:00 (Time up!)";
        $$("#mt-quiz-list button").forEach(b => b.disabled = true);
        return;
      }
      const m = Math.floor(remSec / 60).toString().padStart(2, "0");
      const s = (remSec % 60).toString().padStart(2, "0");
      timerVal.textContent = `${m}:${s}`;
    }, 1000);

    $("#mt-submit-quiz-btn")?.addEventListener("click", () => {
      clearInterval(interval);
      alert(`Quiz Submitted! Final Score: ${score} / ${qList.length} (${Math.round((score / qList.length) * 100)}%)`);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  wireTheme();
  buildNav();
  wireQuizzes();
  wireSync();
  wireSidebar();
  wireSearch();
  wireCheatSheet();
  wireMockTest();
  paintProgress();
  window.addEventListener("hashchange", route);
  route();
});
