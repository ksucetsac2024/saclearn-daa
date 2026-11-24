/* ======================= MODULE 3 ======================= */

/* ---------- binomial recursion tree ---------- */
STATIC.binom = el => {
  const count = {};
  const mk = (n, k) => { const key = `C(${n},${k})`; count[key] = (count[key] || 0) + 1; const node = { label: key, box: 58, fs: 12, children: [] }; if (k > 0 && k < n) node.children = [mk(n - 1, k - 1), mk(n - 1, k)]; return node; };
  const root = mk(5, 2);
  const mark = n => { if (count[n.label] > 1 && n.children.length) n.cls = "cur"; else if (!n.children.length) n.cls = "done"; n.children.forEach(mark); };
  mark(root);
  const reps = Object.entries(count).filter(([k, c]) => c > 1 && !/C\((\d+),(0|\1)\)/.test(k));
  el.innerHTML = drawTree([root], { gap: 8, levelH: 56, maxW: 900 }) + `<figcaption>Computing C(5, 2) by plain recursion. Amber subproblems are computed more than once (${reps.map(([k, c]) => `${k} ×${c}`).join(", ")}); green leaves are base cases. A DP table computes each of them once.</figcaption>`;
};

/* ---------- diagonal test figure ---------- */
STATIC.diag = el => {
  const n = 6, qr = 2, qc = 3, cs = 34;
  let s = `<svg viewBox="0 0 ${n * cs + 230} ${n * cs + 30}" width="${n * cs + 230}" role="img" aria-label="Squares attacked along the diagonals of a queen satisfy equal row and column differences">`;
  for (let r = 1; r <= n; r++) for (let c = 1; c <= n; c++) {
    const att = Math.abs(r - qr) === Math.abs(c - qc) && r !== qr;
    const col = c === qc && r !== qr;
    s += `<rect x="${(c - 1) * cs + 20}" y="${(r - 1) * cs + 4}" width="${cs}" height="${cs}" class="${att ? "red-f" : col ? "amb-f" : (r + c) % 2 ? "soft-f" : "surf-f"}" style="stroke:var(--line)"/>`;
    if (r === qr && c === qc) s += `<text x="${(c - 1) * cs + 20 + cs / 2}" y="${(r - 1) * cs + 4 + cs / 2 + 8}" text-anchor="middle" style="font-size:24px">♛</text>`;
  }
  for (let c = 1; c <= n; c++) s += `<text x="${(c - 1) * cs + 20 + cs / 2}" y="${n * cs + 20}" text-anchor="middle" class="sub">${c}</text>`;
  for (let r = 1; r <= n; r++) s += `<text x="8" y="${(r - 1) * cs + 4 + cs / 2 + 4}" text-anchor="middle" class="sub">${r}</text>`;
  const tx = n * cs + 36;
  s += `<text x="${tx}" y="30" style="font-weight:700;font-size:13px">Queen at row ${qr}, column ${qc}</text>
    <text x="${tx}" y="56" class="faint">Red squares: |row − ${qr}| = |col − ${qc}|</text>
    <text x="${tx}" y="76" class="faint">e.g. (5, 6): |5−2| = |6−3| = 3</text>
    <text x="${tx}" y="102" class="faint">Amber: same column, x[j] = i</text>
    <text x="${tx}" y="128" class="faint">Same row is impossible:</text>
    <text x="${tx}" y="146" class="faint">one queen per row by design</text>`;
  el.innerHTML = s + `</svg>`;
};

/* ---------- fractional knapsack ---------- */
bench("w-knap", {
  build(el) {
    const p = parseNums($("#kn-p", el).value), w = parseNums($("#kn-w", el).value), M = +$("#kn-m", el).value, rule = $("#kn-r", el).value;
    if (p.length !== w.length) throw new Error(`${p.length} profits but ${w.length} weights: the lists must be the same length.`);
    if (!p.length) throw new Error("Enter at least one object.");
    if (w.some(x => x <= 0)) throw new Error("Weights must be positive.");
    if (!(M > 0)) throw new Error("Capacity must be positive.");
    const items = p.map((pi, i) => ({ i: i + 1, p: pi, w: w[i], r: pi / w[i] }));
    const key = { ratio: (a, b) => b.r - a.r || a.i - b.i, profit: (a, b) => b.p - a.p || a.i - b.i, weight: (a, b) => a.w - b.w || a.i - b.i }[rule];
    const ord = [...items].sort(key);
    const x = Array(p.length).fill(0);
    let U = M, P = 0; const fr = [];
    const snap = (cur, msg) => fr.push({ items, ord, x: [...x], U, P, M, cur, msg });
    snap(null, `Order by ${({ ratio: "profit/weight, largest first", profit: "profit, largest first", weight: "weight, smallest first" })[rule]}: objects ${ord.map(o => o.i).join(", ")}. Capacity left U = ${M}.`);
    for (const o of ord) {
      if (U <= 0) break;
      if (o.w <= U) { x[o.i - 1] = 1; U = r2(U - o.w); P = r2(P + o.p); snap(o.i, `Object ${o.i} (w = ${o.w}) fits: take all of it. Profit += ${o.p} → ${P}. U = ${U}.`); }
      else { const f = U / o.w; x[o.i - 1] = f; P = r2(P + o.p * f); snap(o.i, `Object ${o.i} (w = ${o.w}) does not fit in U = ${U}: take the fraction ${U}/${o.w} = ${r2(f)}. Profit += ${r2(o.p * f)} → ${P}. The knapsack is full.`); U = 0; break; }
    }
    // compare all three rules
    const run = cmp => { let u = M, pr = 0; for (const o of [...items].sort(cmp)) { if (u <= 0) break; if (o.w <= u) { u -= o.w; pr += o.p; } else { pr += o.p * u / o.w; u = 0; } } return r2(pr); };
    const cmpTxt = `Largest p/w: <b>${run((a, b) => b.r - a.r || a.i - b.i)}</b> · largest profit: ${run((a, b) => b.p - a.p || a.i - b.i)} · smallest weight: ${run((a, b) => a.w - b.w || a.i - b.i)}`;
    snap(null, `x = (${x.map(v => r2(v)).join(", ")}), total profit <b>${P}</b>.<br><span style="font-size:14.5px">All three rules on this input: ${cmpTxt}</span>`);
    return fr;
  },
  render(f) {
    const W = 560, H = 46, sc = W / f.M;
    let xpos = 0, s = `<svg viewBox="0 0 ${W + 20} ${H + 30}" width="${W + 20}" role="img" aria-label="Knapsack filled by weight"><rect x="0" y="0" width="${W}" height="${H}" class="surf-f" style="stroke:var(--ink-2);stroke-width:2"/>`;
    f.ord.forEach((o, k) => {
      const amt = f.x[o.i - 1] * o.w; if (!amt) return;
      const w = amt * sc;
      s += `<rect x="${xpos}" y="0" width="${w}" height="${H}" style="fill:var(--c${k % 6});stroke:var(--surface)" />`;
      if (w > 30) s += `<text x="${xpos + w / 2}" y="${H / 2 + 5}" text-anchor="middle" class="mono" style="font-size:12px;font-weight:700">#${o.i}${f.x[o.i - 1] < 1 ? " ×" + r2(f.x[o.i - 1]) : ""}</text>`;
      xpos += w;
    });
    s += `<text x="0" y="${H + 20}" class="faint">0</text><text x="${W}" y="${H + 20}" text-anchor="end" class="faint">M = ${f.M}</text></svg>`;
    const rows = f.ord.map(o => [o.i, o.p, o.w, r2(o.r), { v: r2(f.x[o.i - 1]), c: o.i === f.cur ? "hl" : f.x[o.i - 1] ? "ok" : "" }]);
    return s + table(["object", "p", "w", "p/w", "x"], rows) + `<p class="mono" style="margin:4px 0">Profit so far: ${f.P} · capacity left: ${r2(f.U)}</p>`;
  }
});

/* ---------- MST ---------- */
bench("w-mst", {
  build(el) {
    const G = parseGraph($("#mt-e", el).value, { weighted: true });
    const V = [...G.nodes].sort(natCmp), pos = positionsFor(G, null);
    return $("#mt-alg", el).value === "k" ? kruskalFrames(G, V, pos) : primFrames(G, V, pos, $("#mt-s", el).value.trim() || V[0]);
  },
  render: f => `<div class="row"><div>${drawGraph(f.view, { maxW: 470 })}</div><div style="flex:1 1 240px">${f.side}</div></div>`
});
function kruskalFrames(G, V, pos) {
  const par = {}; V.forEach(v => par[v] = v);
  const find = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  const E = G.edges.map((e, i) => ({ ...e, i })).sort((a, b) => a.w - b.w || a.i - b.i);
  const st = {}; let total = 0, acc = 0; const fr = [];
  const snap = (cur, msg) => {
    const groups = {}; V.forEach(v => (groups[find(v)] = groups[find(v)] || []).push(v));
    const ncls = {}; let ci = 0; Object.values(groups).forEach(g => { if (g.length > 1) { g.forEach(v => ncls[v] = "c" + (ci % 6)); ci++; } });
    fr.push({
      view: viewGraph(G, pos, { ncls, ecls: e => { const k = e.u + "|" + e.v; return cur === k ? "hi" : st[k] === "a" ? "ok" : st[k] === "r" ? "dim" : ""; } }),
      side: `<p class="panel-title">Edges in sorted order</p>` + table(["edge", "w", ""], E.map(e => { const k = e.u + "|" + e.v; const s = st[k]; return [{ v: `${e.u}–${e.v}`, c: k === cur ? "hl" : "" }, e.w, { v: s === "a" ? "accept" : s === "r" ? "reject" : "", c: s === "a" ? "ok" : s === "r" ? "bad" : "" }]; }), { cls: "" }) +
        `<p class="panel-title">Sets</p>${Object.values(groups).map(g => `<span class="pill">{${g.map(esc).join(",")}}</span>`).join(" ")}`, msg
    });
  };
  snap(null, `Sort the ${E.length} edges by weight. Every vertex starts in its own set.`);
  for (const e of E) {
    if (acc === V.length - 1) break;
    const k = e.u + "|" + e.v, a = find(e.u), b = find(e.v);
    if (a !== b) { par[a] = b; st[k] = "a"; total += e.w; acc++; snap(k, `Edge ${esc(e.u)}–${esc(e.v)} (${e.w}): ${esc(e.u)} and ${esc(e.v)} are in different sets. <b>Accept</b> and union. Cost so far ${total}.`); }
    else { st[k] = "r"; snap(k, `Edge ${esc(e.u)}–${esc(e.v)} (${e.w}): both ends already in the same set, so it would make a cycle. <b>Reject</b>.`); }
  }
  snap(null, acc === V.length - 1 ? `Done: ${acc} edges accepted (V − 1 = ${V.length - 1}). <b>MST cost = ${total}</b>.` : `Only ${acc} edges could be accepted: the graph is disconnected, so this is a minimum spanning forest of cost ${total}.`);
  return fr;
}
function primFrames(G, V, pos, r) {
  if (!V.includes(r)) throw new Error(`Start vertex "${r}" is not in the graph.`);
  const adj = adjOf(G), key = {}, pi = {}, inT = new Set(); V.forEach(v => { key[v] = INF; pi[v] = "–"; });
  key[r] = 0; let total = 0; const fr = [];
  const snap = (cur, msg) => {
    const ncls = {}; V.forEach(v => ncls[v] = inT.has(v) ? "done" : key[v] < INF ? "front" : ""); if (cur) ncls[cur] = "cur";
    const nsub = {}; V.forEach(v => nsub[v] = inT.has(v) ? "" : key[v] === INF ? "∞" : "key " + key[v]);
    fr.push({
      view: viewGraph(G, pos, { ncls, nsub, ecls: e => (inT.has(e.u) && pi[e.u] === e.v) || (inT.has(e.v) && pi[e.v] === e.u) ? "ok" : (inT.has(e.u) !== inT.has(e.v)) ? "" : "dim" }),
      side: table(["v", "key", "π", "in tree"], V.map(v => [{ v, c: v === cur ? "hl" : "" }, key[v], pi[v], { v: inT.has(v) ? "✓" : "", c: inT.has(v) ? "ok" : "" }])), msg
    });
  };
  snap(null, `key[${esc(r)}] = 0, every other key ∞.`);
  while (inT.size < V.length) {
    let u = null; V.forEach(v => { if (!inT.has(v) && (u === null || key[v] < key[u])) u = v; });
    if (key[u] === INF) { snap(null, `The remaining vertices are unreachable: the graph is disconnected. Tree cost ${total}.`); return fr; }
    inT.add(u); total += key[u];
    const upd = [];
    for (const { v, w } of adj[u]) if (!inT.has(v) && w < key[v]) { key[v] = w; pi[v] = u; upd.push(`${esc(v)}→${w}`); }
    snap(u, `EXTRACT-MIN gives <b>${esc(u)}</b>${pi[u] !== "–" ? ` via edge ${esc(pi[u])}–${esc(u)} (${key[u]})` : ""}. ${upd.length ? "Lower keys: " + upd.join(", ") + "." : "No keys change."}`);
  }
  snap(null, `All vertices are in the tree. <b>MST cost = ${total}</b>.`);
  return fr;
}

/* ---------- Dijkstra ---------- */
bench("w-dij", {
  build(el) {
    const G = parseGraph($("#dj-e", el).value, { weighted: true, directed: $("#dj-dir", el).checked });
    const V = [...G.nodes].sort(natCmp), s = $("#dj-s", el).value.trim(), adj = adjOf(G);
    if (!adj[s]) throw new Error(`Source "${s}" is not in the graph.`);
    const pos = positionsFor(G, null);
    const d = {}, pi = {}, done = new Set(); V.forEach(v => { d[v] = INF; pi[v] = "–"; }); d[s] = 0;
    const rows = [], fr = [];
    const snap = (cur, msg) => {
      const ncls = {}; V.forEach(v => ncls[v] = done.has(v) ? "done" : d[v] < INF ? "front" : ""); if (cur) ncls[cur] = "cur";
      const nsub = {}; V.forEach(v => nsub[v] = d[v] === INF ? "∞" : String(fmt(d[v])));
      fr.push({
        view: viewGraph(G, pos, { ncls, nsub, ecls: e => (pi[e.v] === e.u && done.has(e.v)) || (!G.directed && pi[e.u] === e.v && done.has(e.u)) ? "ok" : "" }),
        side: table(["step", "selected", ...V], rows.map(r => [r.k, r.u, ...V.map(v => ({ v: r.d[v], c: r.fin.has(v) ? (r.u === v ? "ok" : "dim") : "" }))])), msg
      });
    };
    rows.push({ k: 0, u: "–", d: { ...d }, fin: new Set() });
    snap(null, `Initialise: d[${esc(s)}] = 0, all others ∞.`);
    let k = 0;
    while (done.size < V.length) {
      let u = null; V.forEach(v => { if (!done.has(v) && (u === null || d[v] < d[u])) u = v; });
      if (d[u] === INF) break;
      done.add(u); k++;
      const ch = [];
      for (const { v, w } of adj[u]) if (!done.has(v) && d[u] + w < d[v]) { d[v] = d[u] + w; pi[v] = u; ch.push(`d[${esc(v)}] = ${fmt(d[u])} + ${fmt(w)} = ${fmt(d[v])}`); }
      rows.push({ k, u, d: { ...d }, fin: new Set(done) });
      snap(u, `Select <b>${esc(u)}</b> (smallest d = ${fmt(d[u])}); its distance is now final. ${ch.length ? "Relax: " + ch.join(", ") + "." : "No distances improve."}`);
    }
    const path = v => { const p = [v]; while (pi[p[0]] !== "–") p.unshift(pi[p[0]]); return p.join(" → "); };
    let msg = `Shortest paths from ${esc(s)}: ` + V.filter(v => v !== s).map(v => d[v] === INF ? `${esc(v)}: unreachable` : `${esc(path(v))} = <b>${fmt(d[v])}</b>`).join("; ");
    if (G.edges.some(e => e.w < 0)) {
      const bf = {}; V.forEach(v => bf[v] = INF); bf[s] = 0;
      for (let i = 0; i < V.length - 1; i++) for (const e of G.edges) { if (bf[e.u] + e.w < bf[e.v]) bf[e.v] = bf[e.u] + e.w; if (!G.directed && bf[e.v] + e.w < bf[e.u]) bf[e.u] = bf[e.v] + e.w; }
      const wrong = V.filter(v => bf[v] !== d[v]);
      msg += `<br><b style="color:var(--red)">This graph has a negative edge.</b> ` + (wrong.length ? `True distances (Bellman–Ford): ${wrong.map(v => `${esc(v)} = ${fmt(bf[v])}, not ${fmt(d[v])}`).join("; ")}.` : `This time the answers happen to be right, but Dijkstra gives no guarantee.`);
    }
    snap(null, msg);
    return fr;
  },
  render: f => `<div class="row"><div>${drawGraph(f.view, { maxW: 440 })}</div><div style="flex:1 1 260px">${f.side}</div></div>`
});

/* ---------- matrix chain ---------- */
bench("w-mcm", {
  build(el) {
    const p = parseNums($("#mc-p", el).value), n = p.length - 1;
    if (n < 2) throw new Error("Give at least three numbers (two matrices).");
    if (n > 8) throw new Error("Use at most 8 matrices (9 numbers) so the tables fit.");
    const m = [], s = [];
    for (let i = 1; i <= n; i++) { m[i] = []; s[i] = []; m[i][i] = 0; }
    const fr = [];
    const snap = (cur, deps, msg) => fr.push({ n, m: clone(m), s: clone(s), cur, deps, msg, p });
    snap(null, [], `Matrices: ${[...Array(n).keys()].map(i => `A${i + 1} is ${p[i]}×${p[i + 1]}`).join(", ")}. The diagonal m[i,i] = 0 (one matrix, nothing to multiply).`);
    for (let L = 2; L <= n; L++) for (let i = 1; i <= n - L + 1; i++) {
      const j = i + L - 1; let best = INF, bk = 0; const tries = [], deps = [];
      for (let k = i; k < j; k++) {
        const q = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j];
        tries.push(`k=${k}: ${m[i][k]} + ${m[k + 1][j]} + ${p[i - 1]}·${p[k]}·${p[j]} = ${q}`);
        deps.push([i, k], [k + 1, j]);
        if (q < best) { best = q; bk = k; }
      }
      m[i][j] = best; s[i][j] = bk;
      snap([i, j], deps, `m[${i},${j}] = min{ ${tries.join(";  ")} } = <b>${best}</b>, so s[${i},${j}] = ${bk}.`);
    }
    const par = (i, j) => i === j ? `A${i}` : `(${par(i, s[i][j])}${par(s[i][j] + 1, j)})`;
    snap(null, [], `Minimum cost m[1,${n}] = <b>${m[1][n]}</b> scalar multiplications. Optimal order: <b>${par(1, n)}</b>.`);
    return fr;
  },
  render(f) {
    const idx = [...Array(f.n).keys()].map(i => i + 1);
    const isDep = (i, j) => f.deps.some(d => d[0] === i && d[1] === j);
    const cell = (T, i, j, diag) => {
      if (j < i) return { v: "", c: "dim" };
      const v = T[i][j];
      const c = f.cur && f.cur[0] === i && f.cur[1] === j ? "hl" : isDep(i, j) ? "kk" : "";
      return { v: v === undefined ? (diag && i === j ? 0 : "") : v, c };
    };
    const mT = table(["m", ...idx.map(j => "j=" + j)], idx.map(i => idx.map(j => cell(f.m, i, j, true))), { rowHead: idx.map(i => "i=" + i) });
    const sT = table(["s", ...idx.slice(1).map(j => "j=" + j)], idx.slice(0, -1).map(i => idx.slice(1).map(j => j <= i ? { v: "", c: "dim" } : cell(f.s, i, j, false))), { rowHead: idx.slice(0, -1).map(i => "i=" + i) });
    return `<div class="row"><div><p class="panel-title">m[i, j]: minimum cost</p>${mT}</div><div><p class="panel-title">s[i, j]: best split k</p>${sT}</div></div>`;
  }
});

/* ---------- Floyd–Warshall ---------- */
function parseMatrix(text) {
  const rows = text.trim().split(/\n/).map(r => r.trim().split(/[\s,]+/).filter(Boolean).map(x => {
    if (/^(inf|∞|-|x|i)$/i.test(x)) return INF;
    const v = Number(x); if (isNaN(v)) throw new Error(`"${x}" is not a number or inf.`); return v;
  }));
  const n = rows.length;
  if (!n || rows.some(r => r.length !== n)) throw new Error("The matrix must be square: n rows of n entries each.");
  return rows;
}
bench("w-floyd", {
  build(el) {
    const W = parseMatrix($("#fw-m", el).value), n = W.length;
    if (n > 8) throw new Error("Use at most 8 vertices.");
    const lab = [...Array(n).keys()].map(i => String(i + 1));
    const G = { nodes: lab, edges: [], directed: true };
    W.forEach((r, i) => r.forEach((w, j) => { if (i !== j && w !== INF) G.edges.push({ u: lab[i], v: lab[j], w }); }));
    const pos = circleLayout(lab, 160, 140, 100);
    let D = W.map(r => [...r]);
    const fr = [{ D: clone2(D), k: -1, ch: [], G, pos, lab, msg: `D⁰ is the weight matrix: direct edges only, no intermediate vertices allowed.` }];
    for (let k = 0; k < n; k++) {
      const N = D.map(r => [...r]), ch = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (D[i][k] + D[k][j] < N[i][j]) { ch.push(`D[${i + 1}][${j + 1}]: ${fmt(D[i][j])} → ${fmt(D[i][k])} + ${fmt(D[k][j])} = ${fmt(D[i][k] + D[k][j])}`); N[i][j] = D[i][k] + D[k][j]; }
      }
      D = N;
      fr.push({ D: clone2(D), k, ch: ch.map(c => c), changed: ch.map(c => c.match(/D\[(\d+)\]\[(\d+)\]/).slice(1).map(x => +x - 1)), G, pos, lab, msg: `D${sup(k + 1)}: allow vertex <b>${k + 1}</b> as a stopover. ${ch.length ? "Improved: " + ch.join("; ") + "." : "Nothing improves."}` });
    }
    const neg = D.map((r, i) => r[i]).some(v => v < 0);
    fr.push({ ...fr[fr.length - 1], msg: neg ? `<b style="color:var(--red)">Negative diagonal entry</b>: vertex ${D.map((r, i) => r[i] < 0 ? i + 1 : null).filter(x => x).join(", ")} lies on a negative-weight cycle. These distances are meaningless.` : `Final matrix D${sup(n)}: shortest distances between every pair. The diagonal is all 0, so there is no negative cycle.` });
    return fr;
  },
  render(f) {
    const n = f.D.length;
    const hl = (i, j) => f.changed && f.changed.some(c => c[0] === i && c[1] === j) ? "ok" : f.k >= 0 && (i === f.k || j === f.k) ? "kk" : "";
    const ncls = {}; if (f.k >= 0) ncls[f.lab[f.k]] = "cur";
    return `<div class="row"><div>${drawGraph(viewGraph(f.G, f.pos, { ncls }), { maxW: 300 })}</div><div><p class="panel-title">D${f.k < 0 ? "⁰" : sup(f.k + 1)}</p>${matrixHTML(f.D, f.lab, { hl })}</div></div>`;
  }
});
function clone2(M) { return M.map(r => [...r]); }

/* ---------- N-Queens ---------- */
bench("w-nq", {
  build(el) {
    const n = +$("#nq-n", el).value, all = $("#nq-all", el).value === "all";
    const x = [], fr = [], nodes = [{ id: 0, parent: null, label: "", cls: "" }];
    let sols = 0, stop = false;
    const path = [0];
    const LIMIT = 20000;
    const place = (k, i) => { for (let j = 0; j < k; j++) if (x[j] === i || Math.abs(x[j] - i) === Math.abs(j - k)) return j; return -1; };
    const rec = k => {
      for (let i = 0; i < n && !stop; i++) {
        if (fr.length > LIMIT) { stop = true; return; }
        const bad = place(k, i);
        const node = { id: nodes.length, parent: path[path.length - 1], label: String(i + 1), cls: bad >= 0 ? "bad" : "cur" };
        nodes.push(node);
        if (bad >= 0) { fr.push({ x: [...x], k, i, ok: false, nn: nodes.length, path: [...path, node.id], msg: `Row ${k + 1}, column ${i + 1}: attacked by the queen in row ${bad + 1} (${x[bad] === i ? "same column" : "same diagonal"}). Kill this node.` }); continue; }
        x[k] = i; path.push(node.id);
        if (k === n - 1) {
          sols++; node.cls = "done";
          fr.push({ x: [...x], k, i, ok: true, sol: true, nn: nodes.length, path: [...path], msg: `Row ${k + 1}, column ${i + 1} is safe and all ${n} queens are placed: <b>solution ${sols}</b> = (${x.map(v => v + 1).join(", ")}).` });
          if (!all) stop = true;
        } else {
          fr.push({ x: [...x], k, i, ok: true, nn: nodes.length, path: [...path], msg: `Row ${k + 1}, column ${i + 1} is safe. Place the queen and move on to row ${k + 2}.` });
          rec(k + 1);
          if (!stop) fr.push({ x: x.slice(0, k + 1), k: k + 1, i: -1, ok: true, back: true, nn: nodes.length, path: [...path], msg: `Every column in row ${k + 2} failed. <b>Backtrack</b>: remove the queen from row ${k + 1} (column ${x[k] + 1}) and try its next column.` });
        }
        path.pop(); x.length = k;
      }
    };
    rec(0);
    fr.forEach(f => { f.nodes = nodes; f.N = n; });
    fr.push({ ...fr[fr.length - 1], msg: `${sols} solution${sols === 1 ? "" : "s"} found after trying ${nodes.length - 1} squares (state space tree nodes, not counting the root).` + (fr.length > LIMIT ? " (Stopped early: too many steps.)" : "") });
    return fr;
  },
  render(f) {
    const N = f.N;
    // board
    const att = new Set();
    f.x.forEach((c, r) => { if (r === f.k && !f.back) return; for (let rr = 0; rr < N; rr++) for (let cc = 0; cc < N; cc++) if (rr !== r && (cc === c || Math.abs(cc - c) === Math.abs(rr - r))) att.add(rr * N + cc); });
    let b = `<div class="board" style="grid-template-columns:repeat(${N},38px)">`;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const q = f.x[r] === c && (r < f.k || (r === f.k && f.ok && !f.back) || f.sol);
      const trying = r === f.k && c === f.i;
      b += `<div class="${(r + c) % 2 ? "dk" : "lt"}${att.has(r * N + c) && !q ? " att" : ""}${trying ? " try" : ""}">${q ? `<span class="q">♛</span>` : trying && !f.ok ? `<span class="q badq">♛</span>` : ""}</div>`;
    }
    b += `</div>`;
    let tree = "";
    const shown = f.nodes.slice(0, f.nn);
    if (N <= 6 && shown.length <= 90) {
      const byId = {}; shown.forEach(nd => byId[nd.id] = { label: nd.id === 0 ? "·" : nd.label, children: [], cls: nd.cls === "bad" ? "bad" : nd.cls === "done" ? "done" : f.path.includes(nd.id) ? "cur" : "", under: nd.cls === "bad" ? "✕" : undefined, underHot: true });
      shown.forEach(nd => { if (nd.parent !== null) byId[nd.parent].children.push(byId[nd.id]); });
      tree = `<div style="flex:1 1 300px;min-width:0;overflow-x:auto"><p class="panel-title">State space tree (labels = column chosen)</p>${drawTree([byId[0]], { r: 13, gap: 6, levelH: 50, maxW: 640 })}</div>`;
    }
    return `<div class="row"><div>${b}<p class="mono" style="margin:8px 0 0">x = (${f.x.map(v => v + 1).join(", ")})</p></div>${tree}</div>`;
  }
});
