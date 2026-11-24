/* ======================= MODULE 4 ======================= */

/* ---------- Venn diagram of classes ---------- */
STATIC.venn = el => {
  const panel = (title, body) => `<div><p class="panel-title">${title}</p>${body}</div>`;
  const a = `<svg viewBox="0 0 380 250" width="380" role="img" aria-label="Assuming P is not NP: P inside NP, NP-complete is the overlap of NP and NP-hard">
    <ellipse cx="270" cy="125" rx="104" ry="112" class="red-f red-s" stroke-width="1.6" opacity=".9"/>
    <ellipse cx="150" cy="125" rx="140" ry="100" class="sky-f sky-s" stroke-width="1.6" opacity=".85"/>
    <path d="M ${270 - 104 + 0} 125" fill="none"/>
    <ellipse cx="105" cy="130" rx="62" ry="50" class="grn-f grn-s" stroke-width="1.6"/>
    <text x="105" y="128" text-anchor="middle" style="font-weight:700">P</text>
    <text x="105" y="146" text-anchor="middle" class="faint">sorting, MST</text>
    <text x="55" y="58" style="font-weight:700" class="t-acc">NP</text>
    <text x="232" y="120" text-anchor="middle" style="font-weight:700">NP-complete</text>
    <text x="232" y="137" text-anchor="middle" class="faint">SAT, CLIQUE,</text>
    <text x="232" y="152" text-anchor="middle" class="faint">vertex cover</text>
    <text x="336" y="44" text-anchor="middle" style="font-weight:700" class="t-red">NP-hard</text>
    <text x="330" y="200" text-anchor="middle" class="faint">halting,</text>
    <text x="330" y="215" text-anchor="middle" class="faint">optimisation TSP</text>
  </svg>`;
  const b = `<svg viewBox="0 0 300 250" width="300" role="img" aria-label="If P equals NP, P, NP and NP-complete coincide">
    <ellipse cx="190" cy="125" rx="104" ry="112" class="red-f red-s" stroke-width="1.6" opacity=".9"/>
    <ellipse cx="120" cy="125" rx="100" ry="90" class="grn-f grn-s" stroke-width="1.6" opacity=".9"/>
    <text x="100" y="120" text-anchor="middle" style="font-weight:700">P = NP</text>
    <text x="100" y="138" text-anchor="middle" class="faint">(= NP-complete,</text>
    <text x="100" y="153" text-anchor="middle" class="faint">except trivial sets)</text>
    <text x="260" y="44" text-anchor="middle" style="font-weight:700" class="t-red">NP-hard</text>
  </svg>`;
  el.innerHTML = `<div class="row">${panel("Believed picture: P ≠ NP", a)}${panel("If it turned out that P = NP", b)}</div><figcaption>NP-complete = NP ∩ NP-hard. NP-hard reaches outside NP: it includes problems that are not decision problems or are not even decidable.</figcaption>`;
};

/* ---------- reduction diagram ---------- */
STATIC.reduction = el => {
  const box = (x, y, w, t1, t2, cls = "soft-f line-s") => `<rect x="${x}" y="${y}" width="${w}" height="50" rx="6" class="${cls}" stroke-width="1.5"/><text x="${x + w / 2}" y="${y + 22}" text-anchor="middle" style="font-weight:700;font-size:13px">${t1}</text><text x="${x + w / 2}" y="${y + 39}" text-anchor="middle" class="faint">${t2}</text>`;
  const ar = (x1, x2, y) => `<line x1="${x1}" y1="${y}" x2="${x2 - 6}" y2="${y}" class="ink-s" stroke-width="1.8"/><path d="M${x2 - 8},${y - 5} L${x2},${y} L${x2 - 8},${y + 5} Z" class="ink-f"/>`;
  let s = `<svg viewBox="0 0 680 140" width="680" role="img" aria-label="A reduction turns an instance of A into an instance of B in polynomial time; an algorithm for B then answers A">`;
  s += `<text x="14" y="49" class="faint">x</text>` + ar(24, 70, 45);
  s += box(70, 20, 150, "reduction f", "polynomial time", "amb-f amb-s") + ar(220, 290, 45) + `<text x="255" y="36" text-anchor="middle" class="faint">f(x)</text>`;
  s += box(290, 20, 170, "algorithm for B", "decides f(x)") + ar(460, 520, 45);
  s += `<text x="530" y="40" style="font-weight:700" class="t-grn">yes</text><text x="530" y="58" style="font-weight:700" class="t-red">no</text>`;
  s += `<rect x="56" y="8" width="430" height="74" rx="10" fill="none" class="acc-s" stroke-width="1.6" stroke-dasharray="6 5"/><text x="271" y="104" text-anchor="middle" class="t-acc" style="font-size:13px;font-weight:700">an algorithm for A, built from f and B</text>`;
  s += `<text x="271" y="126" text-anchor="middle" class="faint">x ∈ A  ⇔  f(x) ∈ B</text>`;
  el.innerHTML = s + `</svg>`;
};

/* ---------- TSP branch and bound ---------- */
function tspReduce(M) {
  const n = M.length, R = M.map(r => [...r]), rowMin = [], colMin = [];
  let r = 0;
  for (let i = 0; i < n; i++) { const m = Math.min(...R[i]); rowMin[i] = m === INF ? null : m; if (m !== INF && m > 0) { R[i] = R[i].map(v => v === INF ? INF : v - m); r += m; } }
  for (let j = 0; j < n; j++) { const m = Math.min(...R.map(row => row[j])); colMin[j] = m === INF ? null : m; if (m !== INF && m > 0) { for (let i = 0; i < n; i++) if (R[i][j] !== INF) R[i][j] -= m; r += m; } }
  return { R, rowMin, colMin, r };
}
function tspMatHTML(M, { rowMin, colMin, hlRow = -1, hlCol = -1, extra = null } = {}) {
  const n = M.length, lab = [...Array(n).keys()].map(i => i + 1);
  const head = ["", ...lab]; if (rowMin) head.push("row min");
  const rows = M.map((r, i) => {
    const cells = r.map((v, j) => ({ v, c: (i === hlRow || j === hlCol || (extra && extra[0] === i && extra[1] === j)) ? "kk" : v === 0 ? "ok" : "" }));
    if (rowMin) cells.push({ v: rowMin[i] ?? "–", c: "hl" });
    return cells;
  });
  const rh = [...lab];
  if (colMin) { rows.push([...colMin.map(v => ({ v: v ?? "–", c: "hl" })), ...(rowMin ? [{ v: "", c: "" }] : [])]); rh.push("col min"); }
  return table(head, rows, { rowHead: rh });
}
bench("w-tsp", {
  build(el) {
    const A = parseMatrix($("#ts-m", el).value), n = A.length;
    if (n < 3 || n > 7) throw new Error("Use between 3 and 7 cities.");
    for (let i = 0; i < n; i++) A[i][i] = INF;
    const fr = [], nodes = [];
    let id = 0;
    const state = {};
    const snapNodes = () => nodes.map(x => ({ ...x, st: state[x.id] }));
    const rootRed = tspReduce(A);
    const root = { id: ++id, parent: null, path: [0], M: rootRed.R, cost: rootRed.r, city: 1 };
    nodes.push(root); state[root.id] = "live";
    const rs = rootRed.rowMin.reduce((s, v) => s + (v || 0), 0);
    fr.push({ nodes: snapNodes(), left: ["Cost matrix (row minimums)", tspMatHTML(A, { rowMin: rootRed.rowMin })], right: ["Reduced (column minimums from the row-reduced matrix)", tspMatHTML(rootRed.R, {})], msg: `Root (node 1): subtract row minimums (total ${rs}) then column minimums (total ${rootRed.r - rs}). r = ${rootRed.r}, so ĉ(1) = <b>${rootRed.r}</b>: no tour can cost less.` });
    let live = [root], guard = 0;
    for (;;) {
      if (++guard > 400) throw new Error("Search too large to show.");
      live.sort((a, b) => a.cost - b.cost || a.id - b.id);
      const E = live.shift();
      if (!E || E.cost === INF) { fr.push({ nodes: snapNodes(), msg: "No finite tour exists." }); break; }
      if (E.path.length === n) {
        state[E.id] = "best";
        let x = E; while (x) { if (x !== E) state[x.id] = "bestpath"; x = nodes.find(y => y.id === x.parent); }
        live.forEach(l => state[l.id] = "killed");
        const tour = [...E.path, 0].map(c => c + 1).join(" → ");
        let tc = 0; for (let k = 0; k < n; k++) tc += A[E.path[k]][k + 1 < n ? E.path[k + 1] : 0];
        // brute force check
        let best = INF; const perm = (rest, cur, c) => { if (c >= best) return; if (!rest.length) { const t = c + A[cur][0]; if (t < best) best = t; return; } rest.forEach((v, k) => perm(rest.filter((_, q) => q !== k), v, c + A[cur][v])); };
        perm([...Array(n).keys()].slice(1), 0, 0);
        fr.push({ nodes: snapNodes(), left: ["Reduced matrix of the answer node", tspMatHTML(E.M, {})], msg: `The live node with the least ĉ is node ${E.id}, a complete tour. Every other live node has ĉ ≥ ${E.cost}, so they are killed. <b>Optimal tour: ${tour}, cost ${tc}.</b> (Brute-force check over all tours: ${best}.)` });
        break;
      }
      state[E.id] = "E";
      fr.push({ nodes: snapNodes(), left: [`Reduced matrix of node ${E.id}`, tspMatHTML(E.M, {})], msg: `E-node: node <b>${E.id}</b> (path ${E.path.map(c => c + 1).join("→")}), the live node with the least ĉ = ${E.cost}. Generate all its children.` });
      const i = E.path[E.path.length - 1];
      for (let j = 0; j < n; j++) {
        if (E.path.includes(j)) continue;
        const M2 = E.M.map(r => [...r]);
        for (let k = 0; k < n; k++) { M2[i][k] = INF; M2[k][j] = INF; }
        if (E.path.length + 1 < n) M2[j][0] = INF;
        const red = tspReduce(M2);
        const aij = E.M[i][j];
        const cost = aij === INF ? INF : E.cost + aij + red.r;
        const ch = { id: ++id, parent: E.id, path: [...E.path, j], M: red.R, cost, city: j + 1 };
        nodes.push(ch); state[ch.id] = cost === INF ? "killed" : "live";
        if (cost !== INF) live.push(ch);
        fr.push({
          nodes: snapNodes(), cur: ch.id,
          left: [`Node ${ch.id}: edge ${i + 1}→${j + 1}. Row ${i + 1}, column ${j + 1}${E.path.length + 1 < n ? ` and A[${j + 1}][1]` : ""} set to ∞`, tspMatHTML(M2, { rowMin: red.rowMin, hlRow: i, hlCol: j })],
          right: ["Reduced", tspMatHTML(red.R, { colMin: red.colMin })],
          msg: aij === INF ? `Edge ${i + 1}→${j + 1} is unavailable (∞), so node ${ch.id} is dead.` : `Node ${ch.id} (path ${ch.path.map(c => c + 1).join("→")}): r = ${red.r}. ĉ = ĉ(${E.id}) + A(${i + 1},${j + 1}) + r = ${E.cost} + ${aij} + ${red.r} = <b>${cost}</b>.`
        });
      }
      state[E.id] = "done";
    }
    return fr;
  },
  render(f) {
    const byId = {};
    f.nodes.forEach(x => byId[x.id] = { label: String(x.id), children: [], under: fmt(x.cost), elabel: x.parent ? "→" + x.city : undefined, cls: { E: "cur", live: "front", killed: "bad", best: "done", bestpath: "done", done: "" }[x.st] || "" });
    if (f.cur) byId[f.cur].cls = "new";
    f.nodes.forEach(x => { if (x.parent) byId[x.parent].children.push(byId[x.id]); });
    const tree = drawTree([byId[1]], { r: 15, gap: 18, levelH: 66, maxW: 760, extraBottom: 20 });
    const mats = [f.left, f.right].filter(Boolean).map(([t, h]) => `<div><p class="panel-title" style="max-width:340px">${esc(t)}</p>${h}</div>`).join("");
    return `<div class="row">${mats}</div><p class="panel-title" style="margin-top:14px">State space tree</p><div style="overflow-x:auto">${tree}</div>`;
  }
});

/* ---------- 3-CNF to CLIQUE ---------- */
function parseLit(t) {
  const m = t.match(/^(~|!|¬|-|not)?\s*([A-Za-z]\w*)('?)$/);
  if (!m) throw new Error(`"${t}" is not a literal. Write a variable like x1, or its negation like ~x1.`);
  const neg = !!m[1] !== !!m[3];
  return { v: m[2], neg, s: (neg ? "¬" : "") + m[2] };
}
bench("w-cnf", {
  build(el) {
    const clauses = $("#cn-f", el).value.split("\n").map(l => l.replace(/[()∨,]|\bor\b|\|/g, " ").trim()).filter(Boolean).map(l => l.split(/\s+/).map(parseLit));
    const k = clauses.length;
    if (k < 2 || k > 6) throw new Error("Use between 2 and 6 clauses.");
    const V = [], pos = {}, R = 40 + 42 * k;
    clauses.forEach((c, r) => {
      const ang = -Math.PI / 2 + 2 * Math.PI * r / k, cx = 240 + R * Math.cos(ang), cy = 220 + R * Math.sin(ang);
      const tx = -Math.sin(ang), ty = Math.cos(ang);
      c.forEach((lit, p) => { const id = `${r}_${p}`; V.push({ id, r, lit }); const o = (p - (c.length - 1) / 2) * 44; pos[id] = { x: cx + tx * o, y: cy + ty * o }; });
    });
    const adj = (a, b) => a.r !== b.r && !(a.lit.v === b.lit.v && a.lit.neg !== b.lit.neg);
    const E = [];
    for (let a = 0; a < V.length; a++) for (let b = a + 1; b < V.length; b++) if (adj(V[a], V[b])) E.push([V[a], V[b]]);
    // search one vertex per clause
    const pick = [];
    const go = r => { if (r === k) return true; for (const v of V.filter(x => x.r === r)) { if (pick.every(p => adj(p, v))) { pick.push(v); if (go(r + 1)) return true; pick.pop(); } } return false; };
    const found = go(0);
    const inC = new Set(pick.map(p => p.id));
    const g = {
      directed: false,
      nodes: V.map(v => ({ id: v.id, label: v.lit.s, x: pos[v.id].x, y: pos[v.id].y, cls: found ? (inC.has(v.id) ? "done" : "dim") : "c" + (v.r % 6), sub: v.lit === clauses[v.r][1] ? "C" + (v.r + 1) : "" })),
      edges: E.map(([a, b]) => ({ u: a.id, v: b.id, cls: found ? (inC.has(a.id) && inC.has(b.id) ? "ok" : "dim") : "" }))
    };
    let txt;
    if (found) {
      const asg = {}; pick.forEach(p => asg[p.lit.v] = !p.lit.neg);
      const vars = [...new Set(clauses.flat().map(l => l.v))].sort();
      vars.forEach(v => { if (!(v in asg)) asg[v] = false; });
      txt = `<div class="result">k = ${k} clauses, so look for a clique of size ${k}. Found: {${pick.map(p => p.lit.s + " from C" + (p.r + 1)).join(", ")}}.<br>
        Make those literals true: <b>${vars.map(v => `${v} = ${asg[v] ? 1 : 0}`).join(", ")}</b>${vars.some(v => !pick.some(p => p.lit.v === v)) ? " (variables not in the clique set arbitrarily to 0)" : ""}.<br>
        Check: ${clauses.map((c, r) => `C${r + 1} = ${c.some(l => asg[l.v] !== l.neg) ? "1" : "0"}`).join(", ")}.</div>`;
    } else txt = `<div class="result" style="background:var(--red-soft)">No clique of size ${k} exists, so the formula is <b>unsatisfiable</b>.</div>`;
    $(".out", el).innerHTML = `<div class="row"><div>${drawGraph(g, { maxW: 520 })}</div><div style="flex:1 1 240px">
      <p class="panel-title">Graph G</p><p style="margin:4px 0">${V.length} vertices (3 per clause), ${E.length} edges. Vertices of one clause are never joined; neither are x and ¬x.</p>${txt}</div></div>`;
  }
});

/* ---------- clique / vertex cover ---------- */
bench("w-vc", {
  build(el) {
    const E = pairsOf($("#vc-e", el).value), extra = parseList($("#vc-v", el).value);
    const V = [...new Set([...E.flat(), ...extra])].sort(natCmp);
    if (V.length > 12) throw new Error("Use at most 12 vertices.");
    const has = new Set(E.map(([a, b]) => [a, b].sort().join("|")));
    const isE = (a, b) => has.has([a, b].sort().join("|"));
    const comp = []; for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) if (!isE(V[i], V[j])) comp.push({ u: V[i], v: V[j] });
    let best = [];
    for (let m = 1; m < 1 << V.length; m++) {
      const S = V.filter((_, i) => m >> i & 1);
      if (S.length <= best.length) continue;
      if (S.every((a, i) => S.slice(i + 1).every(b => isE(a, b)))) best = S;
    }
    const inC = new Set(best), cover = V.filter(v => !inC.has(v));
    const pos = circleLayout(V, 150, 140, 105);
    const gG = { directed: false, nodes: V.map(v => ({ id: v, x: pos[v].x, y: pos[v].y, cls: inC.has(v) ? "done" : "" })), edges: E.map(([u, v]) => ({ u, v, cls: inC.has(u) && inC.has(v) ? "ok" : "" })) };
    const gC = { directed: false, nodes: V.map(v => ({ id: v, x: pos[v].x, y: pos[v].y, cls: inC.has(v) ? "" : "cur" })), edges: comp.map(e => ({ ...e })) };
    const ok = comp.every(e => !inC.has(e.u) || !inC.has(e.v));
    $(".out", el).innerHTML = `<div class="row"><div><p class="panel-title">G: maximum clique {${best.join(", ")}}</p>${drawGraph(gG, { maxW: 320 })}</div>
      <div><p class="panel-title">Ḡ (complement): vertex cover {${cover.join(", ")}}</p>${drawGraph(gC, { maxW: 320 })}</div></div>
      <div class="result">|V| = ${V.length}, clique size k = ${best.length}, so the cover in Ḡ has |V| − k = <b>${cover.length}</b> vertices. ${ok ? "Every edge of Ḡ has at least one amber endpoint ✓" : ""} No Ḡ-edge can join two green (clique) vertices, because those pairs are edges of G.</div>`;
  }
});

/* ---------- bin packing ---------- */
function packBins(items, cap, alg) {
  const seq = (alg === "ffd" || alg === "bfd") ? [...items].sort((a, b) => b.s - a.s || a.i - b.i) : items;
  const bins = [], steps = [];
  let cur = -1;
  for (const it of seq) {
    let b = -1;
    if (alg === "nf") { if (cur >= 0 && bins[cur].used + it.s <= cap) b = cur; }
    else if (alg === "ff" || alg === "ffd") b = bins.findIndex(x => x.used + it.s <= cap);
    else { let bestRoom = Infinity; bins.forEach((x, k) => { const room = cap - x.used - it.s; if (room >= 0 && room < bestRoom) { bestRoom = room; b = k; } }); }
    let opened = false;
    if (b < 0) { bins.push({ used: 0, items: [] }); b = bins.length - 1; opened = true; if (alg === "nf" && cur >= 0) bins[cur].closed = true; }
    bins[b].used += it.s; bins[b].items.push(it); cur = b;
    steps.push({ it, b, opened, bins: bins.map(x => ({ used: x.used, items: [...x.items], closed: x.closed })) });
  }
  return { bins, steps, seq };
}
bench("w-bins", {
  build(el) {
    const raw = parseList($("#bp-s", el).value), capRaw = String($("#bp-c", el).value).trim();
    const dec = Math.max(...[...raw, capRaw].map(x => (x.split(".")[1] || "").length));
    const sc = 10 ** dec;
    const cap = Math.round(Number(capRaw) * sc);
    if (!(cap > 0)) throw new Error("Capacity must be positive.");
    const items = raw.map((x, i) => { const v = Number(x); if (isNaN(v) || v <= 0) throw new Error(`"${x}" is not a positive size.`); return { i, s: Math.round(v * sc), lab: x }; });
    if (items.some(it => it.s > cap)) throw new Error("An item is larger than the bin capacity.");
    if (items.length > 40) throw new Error("Use at most 40 items.");
    const alg = $("#bp-a", el).value;
    const names = { nf: "Next Fit", ff: "First Fit", bf: "Best Fit", ffd: "First Fit Decreasing", bfd: "Best Fit Decreasing" };
    const res = packBins(items, cap, alg);
    const fmtS = v => r2(v / sc);
    const fr = [];
    if (alg === "ffd" || alg === "bfd") fr.push({ bins: [], cap, sc, msg: `Sort the items largest first: ${res.seq.map(x => x.lab).join(", ")}. Then run ${alg === "ffd" ? "First" : "Best"} Fit.` });
    res.steps.forEach(st => fr.push({
      bins: st.bins, cap, sc, newest: st.it.i,
      msg: `Item ${st.it.lab}: ${st.opened ? `no ${alg === "nf" ? "room in the current bin" : "open bin has room"}, so open bin ${st.b + 1}${alg === "nf" && st.b > 0 ? ` and close bin ${st.b}` : ""}.` : `goes into bin ${st.b + 1}${alg === "bf" || alg === "bfd" ? " (tightest fit)" : alg === "nf" ? " (the current bin)" : " (first bin with room)"}.`} Bin ${st.b + 1} now holds ${fmtS(st.bins[st.b].used)}.`
    }));
    const sum = items.reduce((s, x) => s + x.s, 0), lb = Math.ceil(sum / cap - 1e-9);
    const all = Object.keys(names).map(a => [names[a], packBins(items, cap, a).bins.length]);
    fr.push({ bins: res.bins, cap, sc, msg: `${names[alg]} uses <b>${res.bins.length}</b> bins. Lower bound ⌈Σs / C⌉ = ⌈${fmtS(sum)} / ${fmtS(cap)}⌉ = ${lb}.<br><span style="font-size:14.5px">${all.map(([n, c]) => `${n}: ${c}`).join(" · ")}</span>` + (res.bins.length === lb ? " This packing is optimal (it meets the lower bound)." : "") });
    return fr;
  },
  render(f) {
    return `<div class="bins">${f.bins.map((b, k) => `<div class="bin${b.closed ? " cl" : ""}"><div class="box">${b.items.map(it => `<div class="it${it.i === f.newest ? " newest" : ""}" style="height:${it.s / f.cap * 170}px;background:var(--c${it.i % 6})">${it.s / f.cap * 170 >= 15 ? esc(it.lab) : ""}</div>`).join("")}</div><small>bin ${k + 1}</small><small>free ${r2((f.cap - b.used) / f.sc)}</small></div>`).join("") || "<span class='faint'>no bins yet</span>"}</div>`;
  }
});

/* ---------- Monte Carlo runs ---------- */
bench("w-mc", {
  build(el) {
    const p = Number($("#mc-p", el).value), t = Number($("#mc-t", el).value);
    if (!(p > 0 && p < 1)) throw new Error("The error per run must be between 0 and 1.");
    if (!(t > 0 && t < 1)) throw new Error("The target must be between 0 and 1.");
    const k = Math.ceil(Math.log(t) / Math.log(p) - 1e-12);
    const rows = [1, 2, 5, 10, k].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b).map(r => [{ v: r, c: r === k ? "ok" : "" }, { v: sci(r * Math.log(p)), raw: true, c: r === k ? "ok" : "" }]);
    $(".out", el).innerHTML = `<div class="row"><div>${table(["runs t", "error ≤ pᵗ"], rows)}</div><div class="result" style="flex:1 1 260px;align-self:center">Need pᵗ ≤ ${t}, so t ≥ log(${t}) / log(${p}) = ${r2(Math.log(t) / Math.log(p))}. <b>${k} independent runs</b> suffice.</div></div>`;
  }
});

/* ---------- randomized quicksort ---------- */
bench("w-qs", {
  build(el) {
    const A = parseNums($("#qs-a", el).value);
    if (A.length < 2 || A.length > 14) throw new Error("Use between 2 and 14 numbers.");
    const piv = $("#qs-p", el).value.trim() ? parseNums($("#qs-p", el).value) : [];
    const detail = $("#qs-d", el).checked;
    const used = new Set(), fin = new Set(), nodes = [], fr = [];
    let comps = 0;
    const snap = (o, msg) => fr.push({ A: [...A], fin: new Set(fin), nn: nodes.length, ...o, msg });
    const rec = (p, r, parent) => {
      if (p > r) return;
      if (p === r) { fin.add(p); nodes.push({ id: nodes.length, parent, label: `[${A[p]}]`, leaf: true }); return; }
      const sub = A.slice(p, r + 1);
      let idx = -1, how = "at random";
      for (let k = 0; k < piv.length; k++) if (!used.has(k)) { const at = sub.indexOf(piv[k]); if (at >= 0) { idx = p + at; used.add(k); how = "from your list"; break; } }
      if (idx < 0) idx = p + Math.floor(Math.random() * (r - p + 1));
      const x = A[idx];
      const me = { id: nodes.length, parent, label: `[${sub.join(" ")}]  pivot ${x}` };
      nodes.push(me);
      snap({ p, r, pv: idx }, `RANDOMIZED-PARTITION on A[${p + 1}..${r + 1}] = [${sub.join(", ")}]. Pivot <b>${x}</b> chosen ${how}${idx !== r ? `; swap it with the last element ${A[r]}` : " (already last)"}.`);
      [A[idx], A[r]] = [A[r], A[idx]];
      let i = p - 1;
      for (let j = p; j < r; j++) {
        comps++;
        const le = A[j] <= x;
        if (le) { i++;[A[i], A[j]] = [A[j], A[i]]; }
        if (detail) snap({ p, r, pv: r, i, j }, `j = ${j + 1}: ${A[le ? i : j]} ${le ? "≤" : "&gt;"} ${x}${le ? ` → i = ${i + 1}, swap into the ≤ region` : " → leave it"}.`);
      }
      [A[i + 1], A[r]] = [A[r], A[i + 1]];
      const q = i + 1; fin.add(q);
      snap({ p, r, pv: q, i: q - 1, placed: true }, `Pivot ${x} lands at position ${q + 1}: left part [${A.slice(p, q).join(", ") || "empty"}] ≤ ${x} &lt; right part [${A.slice(q + 1, r + 1).join(", ") || "empty"}].`);
      rec(p, q - 1, me.id); rec(q + 1, r, me.id);
    };
    snap({ p: 0, r: A.length - 1 }, `Start: RANDOMIZED-QUICKSORT(A, 1, ${A.length}).`);
    rec(0, A.length - 1, null);
    fr.forEach(f => f.nodes = nodes);
    const n = A.length;
    snap({ p: -1, r: -1 }, `Sorted with <b>${comps}</b> comparisons. For comparison: n(n−1)/2 = ${n * (n - 1) / 2} (worst case) and 2n ln n ≈ ${Math.round(2 * n * Math.log(n))} (expected value is about this).`);
    fr[fr.length - 1].nodes = nodes;
    return fr;
  },
  render(f) {
    const cls = f.A.map((_, k) => {
      if (f.fin.has(k) && !(k === f.pv && !f.placed)) return "ok";
      if (k < f.p || k > f.r) return "dim";
      if (k === f.pv) return "piv";
      if (f.j !== undefined && k === f.j) return "cur";
      if (f.i !== undefined && k >= f.p && k <= f.i) return "lo";
      return "";
    });
    const shown = f.nodes.slice(0, f.nn);
    let tree = "";
    if (shown.length) {
      const by = {}; shown.forEach(x => by[x.id] = { label: x.label, box: x.label.length * 7.4 + 18, fs: 12, children: [], cls: x.leaf ? "done" : "" });
      const roots = []; shown.forEach(x => x.parent === null ? roots.push(by[x.id]) : by[x.parent].children.push(by[x.id]));
      if (shown.length && !shown[shown.length - 1].leaf) by[shown[shown.length - 1].id].cls = "cur";
      tree = `<p class="panel-title" style="margin-top:14px">Recursion tree</p><div style="overflow-x:auto">${drawTree(roots, { gap: 12, levelH: 54, maxW: 900 })}</div>`;
    }
    return `<div class="arr-idx">${f.A.map((_, k) => `<span>${k + 1}</span>`).join("")}</div><br>${arr(f.A, cls)}${tree}`;
  }
});
