/* ======================= MODULE 1 ======================= */

/* ---------- BST cases figure ---------- */
STATIC.bstcases = el => {
  const bal = { k: 40, l: { k: 20, l: { k: 10 }, r: { k: 30 } }, r: { k: 60, l: { k: 50 }, r: { k: 70, cls: "cur" } }, cls: "done" };
  const sk = { k: 10, cls: "done", r: { k: 20, r: { k: 30, r: { k: 40, r: { k: 50, cls: "cur" } } } } };
  el.innerHTML = `<div class="row"><div><p class="panel-title">Balanced: height ≈ log₂n</p>${drawBinTree(bal, { maxW: 320 })}</div>
  <div><p class="panel-title">Skewed (keys inserted in sorted order): height = n</p>${drawBinTree(sk, { maxW: 320, dy: 46 })}</div></div>
  <figcaption>Green: best case (key at the root, 1 comparison). Amber: a deepest key. Searching for 70 costs 3 comparisons in the balanced tree; searching for 50 costs 5 in the chain.</figcaption>`;
};

/* ---------- O / Omega / Theta panels ---------- */
STATIC.asym3 = el => {
  const f = x => 20 + 0.55 * x + 8 * Math.sin(x / 6);
  const up = x => 1.0 * x + 2, lo = x => 0.45 * x + 13;
  const X = x => 34 + x * 2.2, Y = y => 172 - y * 1.45;
  const path = fn => { let d = ""; for (let x = 0; x <= 100; x += 1) d += (x ? "L" : "M") + X(x).toFixed(1) + "," + Y(fn(x)).toFixed(1); return d; };
  const n0of = test => { let n0 = 0; for (let x = 0; x <= 100; x += 0.5) if (!test(x)) n0 = x + 0.5; return n0; };
  const panel = (title, curves, n0, note) => {
    let s = `<svg viewBox="0 0 300 215" width="300" role="img" aria-label="${esc(title)}">
      <line x1="34" y1="172" x2="262" y2="172" class="ink-s" stroke-width="1.3"/><line x1="34" y1="172" x2="34" y2="12" class="ink-s" stroke-width="1.3"/>
      <text x="262" y="188" class="faint" text-anchor="end">n →</text>
      <line x1="${X(n0)}" y1="20" x2="${X(n0)}" y2="172" class="line-s" stroke-dasharray="4 4"/>
      <text x="${X(n0)}" y="188" text-anchor="middle" class="sub">n₀</text>
      <rect x="${X(n0)}" y="12" width="${262 - X(n0)}" height="160" class="soft-f" opacity=".55"/>`;
    for (const c of curves) s += `<path d="${path(c.fn)}" fill="none" stroke-width="2.4" style="stroke:var(${c.col})"/><text x="${X(100) + 4}" y="${Y(c.fn(100)) + 4}" style="fill:var(${c.col});font-weight:700;font-size:12.5px">${c.lab}</text>`;
    s += `<text x="150" y="207" text-anchor="middle" class="faint">${note}</text></svg>`;
    return `<div><p class="panel-title">${title}</p>${s}</div>`;
  };
  const nO = n0of(x => f(x) <= up(x)), nW = n0of(x => f(x) >= lo(x));
  el.innerHTML = `<div class="row">
   ${panel("f(n) = O(g(n))", [{ fn: up, col: "--accent", lab: "c·g" }, { fn: f, col: "--ink", lab: "f" }], nO, "after n₀, f stays below c·g")}
   ${panel("f(n) = Ω(g(n))", [{ fn: f, col: "--ink", lab: "f" }, { fn: lo, col: "--green", lab: "c·g" }], nW, "after n₀, f stays above c·g")}
   ${panel("f(n) = Θ(g(n))", [{ fn: up, col: "--accent", lab: "c₂g" }, { fn: f, col: "--ink", lab: "f" }, { fn: lo, col: "--green", lab: "c₁g" }], Math.max(nO, nW), "after n₀, f is sandwiched")}
  </div><figcaption>The shaded region is "all n ≥ n₀". Small n are ignored: only the long-run behaviour counts.</figcaption>`;
};

/* ---------- recursion tree 2T(n/2)+n ---------- */
STATIC.rtree = el => {
  const W = 700, rows = [["n"], ["n/2", "n/2"], ["n/4", "n/4", "n/4", "n/4"], Array(8).fill("n/8")];
  let s = `<svg viewBox="0 0 ${W} 330" width="${W}" role="img" aria-label="Recursion tree of 2T(n/2)+n: every level sums to n, log n levels">`;
  const area = 520;
  const pos = (L, k) => ({ x: (k + 0.5) * area / rows[L].length, y: 26 + L * 62 });
  rows.forEach((r, L) => r.forEach((lab, k) => {
    if (L) { const p = pos(L - 1, k >> 1), q = pos(L, k); s += `<line class="e" x1="${p.x}" y1="${p.y + 13}" x2="${q.x}" y2="${q.y - 13}"/>`; }
  }));
  rows.forEach((r, L) => r.forEach((lab, k) => {
    const q = pos(L, k), w = Math.min(54, area / r.length - 8);
    s += `<g class="n"><rect x="${q.x - w / 2}" y="${q.y - 13}" width="${w}" height="26" rx="5"/><text class="mono" x="${q.x}" y="${q.y + 5}" text-anchor="middle" style="font-size:12.5px">${lab}</text></g>`;
  }));
  s += `<text x="${area / 2}" y="${26 + 4 * 62 - 22}" text-anchor="middle" class="faint">⋮</text>`;
  const yl = 26 + 4 * 62 + 8;
  for (let k = 0; k < 16; k++) { const x = (k + 0.5) * area / 16; s += `<g class="n"><rect x="${x - 13}" y="${yl - 11}" width="26" height="22" rx="4"/><text class="mono" x="${x}" y="${yl + 4}" text-anchor="middle" style="font-size:9.5px">T(1)</text></g>`; }
  const ann = ["n", "2 · n/2 = n", "4 · n/4 = n", "8 · n/8 = n"];
  ann.forEach((a, L) => s += `<text x="${area + 24}" y="${26 + L * 62 + 5}" class="mono t-acc" style="font-size:13px;font-weight:700">${a}</text>`);
  s += `<text x="${area + 24}" y="${yl + 5}" class="mono t-acc" style="font-size:13px;font-weight:700">n · T(1) = n</text>`;
  s += `<line x1="${area + 12}" y1="14" x2="${area + 12}" y2="${yl + 10}" class="ink-s" stroke-width="1.2"/><text x="${area + 8}" y="${yl - 26}" class="faint" text-anchor="end">log₂n levels</text>`;
  el.innerHTML = s + `</svg><figcaption>Each box is one call; the number inside is the work that call does itself (the merge cost). The right column adds each level.</figcaption>`;
};

/* ---------- uneven recursion tree as proportional bars ---------- */
STATIC["rtree-uneven"] = el => {
  const W = 620, X0 = 20, BW = 520, H = 34;
  let s = `<svg viewBox="0 0 ${W} 250" width="${W}" role="img" aria-label="Recursion tree of T(n/4)+T(3n/4)+n drawn as bars: every complete level has total width n">`;
  let level = [{ f: 1, lab: "n" }];
  const lab = (num, den) => num === den ? "n" : `${num}n/${den}`;
  let nums = [[1, 1]];
  for (let L = 0; L < 4; L++) {
    let x = X0; const y = 14 + L * 50;
    nums.forEach(([a, b]) => {
      const w = BW * a / b;
      s += `<g class="n ${L === 0 ? "" : ""}"><rect x="${x + 1}" y="${y}" width="${Math.max(w - 2, 1)}" height="${H}" rx="3"/></g>`;
      if (w > 44) s += `<text class="mono" x="${x + w / 2}" y="${y + 22}" text-anchor="middle" style="font-size:12px">${lab(a, b)}</text>`;
      x += w;
    });
    s += `<text x="${X0 + BW + 12}" y="${y + 22}" class="mono t-acc" style="font-weight:700;font-size:13px">= n</text>`;
    nums = nums.flatMap(([a, b]) => [[a, b * 4], [3 * a, b * 4]]);
  }
  s += `<text x="${X0}" y="232" class="faint">shortest branch (always n/4) ends after log₄n levels</text><text x="${X0 + BW}" y="232" class="faint" text-anchor="end">longest branch (always 3n/4) lasts log₄⁄₃n levels</text>`;
  el.innerHTML = s + `</svg><figcaption>Each bar's width is the size of that subproblem. Splitting never loses width, so every complete level costs exactly n; only the depth differs between branches.</figcaption>`;
};

/* ---------- rotation diagrams ---------- */
STATIC["avl-rot"] = el => {
  const node = (x, y, t, cls = "") => `<g class="n ${cls}"><circle cx="${x}" cy="${y}" r="17"/><text class="lbl" x="${x}" y="${y + 5}" text-anchor="middle">${t}</text></g>`;
  const tri = (x, y, t, hot) => `<path d="M${x},${y} L${x - 16},${y + 34} L${x + 16},${y + 34} Z" class="${hot ? "vio-f vio-s" : "soft-f line-s"}" stroke-width="1.4"/><text x="${x}" y="${y + 28}" text-anchor="middle" style="font-size:11px" class="mono">${t}</text>`;
  const ln = (a, b, c, d) => `<line class="e" x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`;
  const arrowR = (x, y, t) => `<line x1="${x}" y1="${y}" x2="${x + 60}" y2="${y}" class="acc-s" stroke-width="2.2"/><path d="M${x + 60},${y - 6} L${x + 72},${y} L${x + 60},${y + 6} Z" class="acc-f"/><text x="${x + 36}" y="${y - 10}" text-anchor="middle" class="t-acc" style="font-size:12px;font-weight:700">${t}</text>`;
  // LL
  let s = `<svg viewBox="0 0 640 430" width="640" role="img" aria-label="LL case fixed by one right rotation; LR case fixed by a double rotation">`;
  s += `<text x="10" y="18" style="font-weight:700">LL case</text>`;
  s += ln(150, 40, 100, 90) + ln(150, 40, 200, 90) + ln(100, 90, 60, 140) + ln(100, 90, 130, 140) + ln(60, 140, 40, 175) + ln(60, 140, 80, 175);
  s += node(150, 40, "z", "bad") + node(100, 90, "y", "cur") + node(60, 140, "x", "cur") + tri(200, 90 + 18, "T4") + tri(130, 140 + 2, "T3") + tri(40, 175, "T1", 1) + tri(80, 175, "T2");
  s += `<text x="178" y="36" class="sub hot">+2</text><text x="122" y="84" class="sub">+1</text>`;
  s += arrowR(255, 110, "rotate right at z");
  const ox = 360;
  s += ln(ox + 130, 60, ox + 80, 110) + ln(ox + 130, 60, ox + 180, 110) + ln(ox + 80, 110, ox + 55, 145) + ln(ox + 80, 110, ox + 105, 145) + ln(ox + 180, 110, ox + 155, 145) + ln(ox + 180, 110, ox + 205, 145);
  s += node(ox + 130, 60, "y", "done") + node(ox + 80, 110, "x", "done") + node(ox + 180, 110, "z", "done") + tri(ox + 55, 145, "T1", 1) + tri(ox + 105, 145, "T2") + tri(ox + 155, 145, "T3") + tri(ox + 205, 145, "T4");
  s += `<text x="${ox + 130}" y="205" text-anchor="middle" class="faint">y's right subtree T3 moves across to become z's left subtree</text>`;
  // LR
  const oy = 220;
  s += `<text x="10" y="${oy + 18}" style="font-weight:700">LR case</text>`;
  s += ln(150, oy + 40, 90, oy + 90) + ln(150, oy + 40, 210, oy + 90) + ln(90, oy + 90, 55, oy + 125) + ln(90, oy + 90, 130, oy + 140) + ln(130, oy + 140, 105, oy + 175) + ln(130, oy + 140, 155, oy + 175);
  s += node(150, oy + 40, "z", "bad") + node(90, oy + 90, "y", "cur") + node(130, oy + 140, "x", "cur") + tri(210, oy + 108, "T4") + tri(55, oy + 125, "T1") + tri(105, oy + 175, "T2", 1) + tri(155, oy + 175, "T3", 1);
  s += `<text x="178" y="${oy + 36}" class="sub hot">+2</text><text x="58" y="${oy + 84}" class="sub">−1</text>`;
  s += arrowR(255, oy + 110, "left at y, right at z");
  s += ln(ox + 130, oy + 60, ox + 80, oy + 110) + ln(ox + 130, oy + 60, ox + 180, oy + 110) + ln(ox + 80, oy + 110, ox + 55, oy + 145) + ln(ox + 80, oy + 110, ox + 105, oy + 145) + ln(ox + 180, oy + 110, ox + 155, oy + 145) + ln(ox + 180, oy + 110, ox + 205, oy + 145);
  s += node(ox + 130, oy + 60, "x", "done") + node(ox + 80, oy + 110, "y", "done") + node(ox + 180, oy + 110, "z", "done") + tri(ox + 55, oy + 145, "T1") + tri(ox + 105, oy + 145, "T2", 1) + tri(ox + 155, oy + 145, "T3", 1) + tri(ox + 205, oy + 145, "T4");
  s += `<text x="${ox + 130}" y="${oy + 205}" text-anchor="middle" class="faint">x rises two levels; its subtrees T2, T3 are shared out to y and z</text>`;
  el.innerHTML = s + `</svg><figcaption>T1…T4 are whole subtrees (possibly empty), shown in in-order sequence. In-order is preserved by every rotation: T1 &lt; x &lt; T2 &lt; y &lt; T3 &lt; z &lt; T4 in LL. RR and RL are mirror images of these two pictures.</figcaption>`;
};

/* ---------- AVL engine ---------- */
const AVL = (() => {
  let nid = 0;
  const mk = k => ({ id: ++nid, k, l: null, r: null, p: null, h: 1 });
  const H = n => n ? n.h : 0;
  const upd = n => { n.h = 1 + Math.max(H(n.l), H(n.r)); };
  const bf = n => H(n.l) - H(n.r);
  const bfs = v => v > 0 ? "+" + v : v < 0 ? "−" + (-v) : "0";
  function replace(T, old, nw) { if (!old.p) T.root = nw; else if (old.p.l === old) old.p.l = nw; else old.p.r = nw; if (nw) nw.p = old.p; }
  function rotR(T, z) { const y = z.l; z.l = y.r; if (y.r) y.r.p = z; replace(T, z, y); y.r = z; z.p = y; upd(z); upd(y); return y; }
  function rotL(T, z) { const y = z.r; z.r = y.l; if (y.l) y.l.p = z; replace(T, z, y); y.l = z; z.p = y; upd(z); upd(y); return y; }
  function upChain(n) { while (n) { upd(n); n = n.p; } }
  function snap(n, marks) {
    if (!n) return null;
    const b = bf(n);
    return { k: n.k, l: snap(n.l, marks), r: snap(n.r, marks), cls: marks.get(n) || "", note: bfs(b), noteHot: Math.abs(b) > 1 };
  }
  function fix(T, z, frames, why) {
    const left = bf(z) > 1;
    const y = left ? z.l : z.r;
    const by = bf(y);
    let kind;
    if (left) kind = by >= 0 ? "LL" : "LR"; else kind = by <= 0 ? "RR" : "RL";
    if (why === "ins") { /* insertion: decided by path, equivalent to the BF test */ }
    const x = kind === "LL" ? y.l : kind === "RR" ? y.r : kind === "LR" ? y.r : y.l;
    const marks = new Map([[z, "bad"], [y, "cur"]]); if (x) marks.set(x, "cur");
    const desc = { LL: "single right rotation at " + z.k, RR: "single left rotation at " + z.k, LR: `left rotation at ${y.k}, then right rotation at ${z.k}`, RL: `right rotation at ${y.k}, then left rotation at ${z.k}` }[kind];
    const alt = why === "del" ? { LL: by === 0 ? " (R0)" : " (R1)", LR: " (R−1)", RR: by === 0 ? " (L0)" : " (L−1)", RL: " (L1)" }[kind] : "";
    frames.push({ tree: snap(T.root, marks), msg: `Node <b>${esc(z.k)}</b> has BF ${bfs(bf(z))}. Its taller child <b>${esc(y.k)}</b> has BF ${bfs(by)}${x ? `, next node <b>${esc(x.k)}</b>` : ""}. Case <b>${kind}</b>${alt}: ${desc}.` });
    let top;
    if (kind === "LL") top = rotR(T, z);
    else if (kind === "RR") top = rotL(T, z);
    else if (kind === "LR") { rotL(T, y); top = rotR(T, z); }
    else { rotR(T, y); top = rotL(T, z); }
    upChain(top.p);
    const m2 = new Map([[z, "done"], [y, "done"]]); if (x) m2.set(x, "done");
    frames.push({ tree: snap(T.root, m2), msg: `After the ${kind} rotation <b>${esc(top.k)}</b> is the root of this subtree. In-order order is unchanged and all balance factors here are back in {−1, 0, +1}.`, rot: kind, at: z.k });
    return top;
  }
  function insert(T, k, cmp, frames) {
    if (!T.root) { T.root = mk(k); frames.push({ tree: snap(T.root, new Map([[T.root, "new"]])), msg: `Insert <b>${esc(k)}</b>: the tree is empty, so ${esc(k)} becomes the root.`, ins: k }); return; }
    let cur = T.root, path = [];
    for (;;) {
      const c = cmp(k, cur.k);
      if (c === 0) { frames.push({ tree: snap(T.root, new Map([[cur, "cur"]])), msg: `${esc(k)} is already in the tree. Duplicates are ignored.` }); return; }
      path.push(`${esc(k)} ${c < 0 ? "&lt;" : "&gt;"} ${esc(cur.k)}: go ${c < 0 ? "left" : "right"}`);
      const nx = c < 0 ? cur.l : cur.r;
      if (!nx) { const n = mk(k); n.p = cur; if (c < 0) cur.l = n; else cur.r = n; upChain(cur); cur = n; break; }
      cur = nx;
    }
    const nn = cur;
    let z = nn.p; while (z && Math.abs(bf(z)) <= 1) z = z.p;
    frames.push({ tree: snap(T.root, new Map([[nn, "new"], ...(z ? [[z, "bad"]] : [])])), msg: `Insert <b>${esc(k)}</b>: ${path.join("; ")}. ` + (z ? `Walking back up, <b>${esc(z.k)}</b> is the first node with BF ${bfs(bf(z))}, so it is the pivot.` : "Every balance factor is still −1, 0 or +1. No rotation needed."), ins: k, ok: !z });
    if (z) fix(T, z, frames, "ins");
  }
  function del(T, k, cmp, frames) {
    let n = T.root; while (n && cmp(k, n.k) !== 0) n = cmp(k, n.k) < 0 ? n.l : n.r;
    if (!n) { frames.push({ tree: snap(T.root, new Map()), msg: `${esc(k)} is not in the tree, nothing to delete.` }); return; }
    let target = n;
    if (n.l && n.r) {
      let s = n.r; while (s.l) s = s.l;
      frames.push({ tree: snap(T.root, new Map([[n, "bad"], [s, "front"]])), msg: `Delete <b>${esc(k)}</b>: it has two children, so copy in its in-order successor <b>${esc(s.k)}</b> (smallest key in the right subtree) and delete that node instead.` });
      n.k = s.k; target = s;
    } else frames.push({ tree: snap(T.root, new Map([[n, "bad"]])), msg: `Delete <b>${esc(k)}</b>: it has ${n.l || n.r ? "one child, which takes its place" : "no children, so just remove it"}.` });
    const child = target.l || target.r, par = target.p;
    replace(T, target, child);
    upChain(par);
    const bad = [];
    for (let a = par; a; a = a.p) if (Math.abs(bf(a)) > 1) bad.push(a);
    frames.push({ tree: snap(T.root, new Map(bad.map(b => [b, "bad"]))), msg: `Removed. Now walk up from ${par ? "<b>" + esc(par.k) + "</b>" : "the root"} checking balance factors. ` + (bad.length ? `<b>${esc(bad[0].k)}</b> is unbalanced.` : "Everything is balanced."), ok: !bad.length });
    let a = par;
    while (a) {
      upd(a);
      if (Math.abs(bf(a)) > 1) { const top = fix(T, a, frames, "del"); a = top.p; } else a = a.p;
    }
  }
  function run(ins, dels) {
    const all = [...ins, ...dels];
    const numeric = all.every(x => !isNaN(Number(x)));
    const cmp = numeric ? (a, b) => Number(a) - Number(b) : (a, b) => String(a).localeCompare(String(b));
    const T = { root: null }, frames = [];
    ins.forEach(k => insert(T, numeric ? Number(k) : k, cmp, frames));
    dels.forEach(k => del(T, numeric ? Number(k) : k, cmp, frames));
    return frames;
  }
  return { run };
})();

bench("w-avl", {
  build(el) {
    const ins = parseList($("#avl-ins", el).value), dels = parseList($("#avl-del", el).value);
    if (!ins.length) throw new Error("Enter at least one key to insert.");
    if (ins.length > 40) throw new Error("Keep it to 40 keys or fewer so the tree fits.");
    const fr = AVL.run(ins, dels);
    const rots = fr.filter(f => f.rot).map(f => `${f.rot} at ${f.at}`);
    fr.push({ tree: fr[fr.length - 1].tree, msg: `Done. Rotations used: ${rots.length ? rots.map(esc).join(", ") : "none"}.` });
    return fr;
  },
  render: f => drawBinTree(f.tree, { maxW: 860 })
});

STATIC["avl-walk"] = el => {
  const fr = AVL.run(["30", "10", "20", "40", "50", "35", "5"], []);
  // group frames by insertion
  const cards = []; let cur = null;
  fr.forEach(f => { if (f.ins !== undefined) { cur = { k: f.ins, frames: [f] }; cards.push(cur); } else cur.frames.push(f); });
  el.innerHTML = `<div class="cols">${cards.map(c => {
    const last = c.frames[c.frames.length - 1];
    const rot = c.frames.find(f => f.rot);
    const before = c.frames.length > 1 ? c.frames[1] : null;
    return `<div class="card"><h4>Insert ${esc(c.k)}${rot ? ` → <span style="color:var(--red)">${rot.rot} at ${esc(rot.at)}</span>` : ""}</h4>
      ${before ? `<p class="panel-title">before</p>${drawBinTree(before.tree, { maxW: 230, r: 15, dx: 34, dy: 50 })}<p class="panel-title">after</p>` : ""}
      ${drawBinTree(last.tree, { maxW: 230, r: 15, dx: 34, dy: 50 })}</div>`;
  }).join("")}</div>`;
};

/* ---------- linear search ---------- */
bench("w-lsearch", {
  build(el) {
    const A = parseList($("#ls-a", el).value), key = $("#ls-k", el).value.trim();
    if (!A.length) throw new Error("Enter some array elements.");
    if (A.length > 24) throw new Error("Use 24 elements or fewer.");
    const fr = [];
    let found = -1;
    for (let i = 0; i < A.length; i++) {
      const hit = A[i] === key;
      fr.push({ A, i, hit, msg: `Comparison ${i + 1}: is A[${i + 1}] = ${esc(A[i])} equal to ${esc(key)}? <b>${hit ? "Yes, found." : "No."}</b>` });
      if (hit) { found = i; break; }
    }
    const n = A.length;
    fr.push({ A, i: found, hit: found >= 0, chart: true, msg: found >= 0 ? `Found at position ${found + 1} after <b>${found + 1}</b> comparisons. Best case 1, worst case ${n}, average over all positions (n+1)/2 = <b>${(n + 1) / 2}</b>.` : `Not found after <b>${n}</b> comparisons: an unsuccessful search is always a worst case.` });
    return fr;
  },
  render(f) {
    const n = f.A.length;
    const cls = f.A.map((_, j) => j === f.i ? (f.hit ? "ok" : "cur") : j < f.i || (f.i < 0 && f.chart) ? "dim" : "");
    let h = `<div class="arr-idx">${f.A.map((_, j) => `<span>${j + 1}</span>`).join("")}</div><br>${arr(f.A, cls)}`;
    if (f.chart) {
      const bw = 26, H = 120, W = n * bw + 60;
      let s = `<svg viewBox="0 0 ${W} ${H + 40}" width="${W}" role="img" aria-label="Comparisons needed for a key at each position"><text x="0" y="12" class="faint">comparisons if the key were at position i</text>`;
      for (let j = 0; j < n; j++) {
        const h2 = (j + 1) / n * (H - 20);
        s += `<rect x="${40 + j * bw}" y="${H - h2 + 10}" width="${bw - 6}" height="${h2}" class="${j === f.i ? "grn-f grn-s" : "soft-f line-s"}"/><text x="${40 + j * bw + (bw - 6) / 2}" y="${H + 26}" text-anchor="middle" class="sub">${j + 1}</text>`;
      }
      const ay = H + 10 - ((n + 1) / 2) / n * (H - 20);
      s += `<line x1="36" x2="${40 + n * bw}" y1="${ay}" y2="${ay}" class="acc-s" stroke-width="2" stroke-dasharray="6 4"/><text x="${40 + n * bw}" y="${ay - 6}" text-anchor="end" class="t-acc" style="font-size:12px;font-weight:700">average (n+1)/2</text></svg>`;
      h += `<div style="margin-top:16px">${s}</div>`;
    }
    return h;
  }
});

/* ---------- growth race ---------- */
const GROWTH = [
  { lab: "log n", f: n => Math.log10(Math.max(Math.log2(n), 1e-9)), col: "--muted" },
  { lab: "n", f: n => Math.log10(n), col: "--sky" },
  { lab: "n log n", f: n => Math.log10(n * Math.max(Math.log2(n), 1e-9)), col: "--green" },
  { lab: "n²", f: n => 2 * Math.log10(n), col: "--accent" },
  { lab: "n³", f: n => 3 * Math.log10(n), col: "--violet" },
  { lab: "2ⁿ", f: n => n * Math.log10(2), col: "--amber" },
  { lab: "n!", f: n => { let s = 0; for (let k = 2; k <= n; k++) s += Math.log10(k); return s; }, col: "--red" }
];
bench("w-growth", {
  build(el) {
    const N = +$("#gr-n", el).value;
    const W = 640, H = 300, L = 48, R = 70, T = 14, B = 34;
    const maxY = Math.max(...GROWTH.map(g => g.f(N))), top = Math.max(2, Math.ceil(maxY));
    const X = n => L + (n - 1) / (N - 1) * (W - L - R), Y = v => T + (1 - Math.max(v, 0) / top) * (H - T - B);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Growth of common functions up to n = ${N}, log scale">`;
    const step = top <= 12 ? 1 : top <= 40 ? 5 : top <= 120 ? 10 : 20;
    for (let v = 0; v <= top; v += step) s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="line-s" stroke-width=".6" opacity=".6"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" class="sub">10<tspan dy="-4.5" font-size="8.5">${v}</tspan></text>`;
    for (let n = 1; n <= N; n += Math.max(1, Math.round(N / 10))) s += `<text x="${X(n)}" y="${H - B + 16}" text-anchor="middle" class="sub">${n}</text>`;
    s += `<text x="${W - R}" y="${H - 4}" text-anchor="end" class="faint">n</text>`;
    const ends = [];
    GROWTH.forEach(g => {
      let d = ""; for (let n = 1; n <= N; n += 0.25) d += (d ? "L" : "M") + X(n).toFixed(1) + "," + Y(g.f(n)).toFixed(1);
      s += `<path d="${d}" fill="none" stroke-width="2.2" style="stroke:var(${g.col})"/>`;
      ends.push({ y: Y(g.f(N)), g });
    });
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
    ends.forEach(e => s += `<text x="${W - R + 6}" y="${e.y + 4}" style="fill:var(${e.g.col});font-weight:700;font-size:12.5px">${e.g.lab}</text>`);
    s += `</svg>`;
    const vals = GROWTH.map(g => { const v = g.f(N); return v < 15 ? Math.round(10 ** v).toLocaleString() : `≈ 10<sup>${Math.floor(v)}</sup>`; });
    $(".out", el).innerHTML = s + table(GROWTH.map(g => g.lab), [vals.map(v => ({ v, raw: true }))], { cls: "num" }) + `<p class="faint" style="font-size:13px;margin:4px 0 0">Values at n = ${N}.</p>`;
  }
});
function sup(v) { return String(v).split("").map(c => "⁰¹²³⁴⁵⁶⁷⁸⁹"["0123456789".indexOf(c)] || c).join(""); }

/* ---------- limit-test helper ---------- */
/* ln f(n) ≈ A·n ln n + B·n + E·(ln n)² + C·ln n + D·ln ln n + K */
const FUNCS = {
  "1": [0, 0, 0, 0, 0, 0], "log n": [0, 0, 0, 0, 1, -Math.log(Math.LN2)], "(log n)²": [0, 0, 0, 0, 2, -2 * Math.log(Math.LN2)], "√n": [0, 0, 0, .5, 0, 0], "n": [0, 0, 0, 1, 0, 0],
  "n log n": [0, 0, 0, 1, 1, -Math.log(Math.LN2)], "log(n!)": [0, 0, 0, 1, 1, -Math.log(Math.LN2)], "n^1.5": [0, 0, 0, 1.5, 0, 0], "n²": [0, 0, 0, 2, 0, 0], "n³": [0, 0, 0, 3, 0, 0],
  "n^(log n)": [0, 0, 1 / Math.LN2, 0, 0, 0], "2ⁿ": [0, Math.LN2, 0, 0, 0, 0], "2ⁿ⁺¹": [0, Math.LN2, 0, 0, 0, Math.LN2], "2²ⁿ": [0, 2 * Math.LN2, 0, 0, 0, 0], "3ⁿ": [0, Math.log(3), 0, 0, 0, 0],
  "n!": [1, -1, 0, .5, 0, .5 * Math.log(2 * Math.PI)], "nⁿ": [1, 0, 0, 0, 0, 0]
};
function lnF(name, n) {
  const x = Math.log(n);
  if (name === "log(n!)") { const lf = lgam(n); return Math.log(lf / Math.LN2); }
  if (name === "n!") return lgam(n);
  const [A, B, E, C, D, K] = FUNCS[name];
  return A * n * x + B * n + E * x * x + C * x + D * Math.log(x) + K;
}
function lgam(n) { if (n < 200) { let s = 0; for (let k = 2; k <= n; k++) s += Math.log(k); return s; } return n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n); }
function sci(lnv) {
  const l10 = lnv / Math.LN10;
  if (l10 > -4 && l10 < 7) { const v = Math.exp(lnv); return v >= 100 ? Math.round(v).toLocaleString() : v.toPrecision(4); }
  const e = Math.floor(l10), m = 10 ** (l10 - e);
  return `${m.toFixed(2)} × 10<sup>${e < 0 ? "−" + (-e) : e}</sup>`;
}
bench("w-ratio", {
  init(el) {
    const opts = Object.keys(FUNCS).map(k => `<option>${k}</option>`).join("");
    $("#ra-f", el).innerHTML = opts; $("#ra-g", el).innerHTML = opts;
    $("#ra-f", el).value = "n log n"; $("#ra-g", el).value = "n^1.5";
  },
  build(el) {
    const f = $("#ra-f", el).value, g = $("#ra-g", el).value;
    const ns = [10, 100, 1e3, 1e4, 1e6, 1e9];
    const rows = ns.map(n => [{ v: n >= 1e4 ? `10<sup>${Math.round(Math.log10(n))}</sup>` : n, raw: true }, { v: sci(lnF(f, n) - lnF(g, n)), raw: true }]);
    const a = FUNCS[f], b = FUNCS[g];
    let sign = 0;
    for (let i = 0; i < 5; i++) { const d = a[i] - b[i]; if (Math.abs(d) > 1e-12) { sign = Math.sign(d); break; } }
    const verdict = sign < 0 ? `f(n)/g(n) → 0, so <b>f = o(g)</b> (and therefore f = O(g), but not Ω or Θ).`
      : sign > 0 ? `f(n)/g(n) → ∞, so <b>f = ω(g)</b> (and therefore f = Ω(g), but not O or Θ).`
        : `f(n)/g(n) tends to a positive constant, so <b>f = Θ(g)</b> (both O and Ω).`;
    const note = (f === "log(n!)" || g === "log(n!)") ? `<p class="faint" style="font-size:13.5px">log(n!) = Θ(n log n): n! ≤ nⁿ gives log n! ≤ n log n, and the largest n/2 factors are each ≥ n/2, so log n! ≥ (n/2) log(n/2).</p>` : "";
    $(".out", el).innerHTML = `<div class="row"><div>${table(["n", "f(n) / g(n)"], rows.map(r => r))}</div><div style="flex:1 1 260px"><div class="result">${verdict}</div>${note}</div></div>`;
  }
});

/* ---------- loop builder ---------- */
const LOOP = {
  outer: { inc: n => { const a = []; for (let i = 1; i <= n; i++) a.push(i); return a; }, dbl: n => { const a = []; for (let i = 1; i <= n; i *= 2) a.push(i); return a; }, half: n => { const a = []; for (let i = n; i >= 1; i = Math.floor(i / 2)) a.push(i); return a; } },
  inner: {
    toN: (i, n) => n, toI: (i, n) => i, iToN: (i, n) => Math.max(0, n - i + 1), dblN: (i, n) => Math.floor(Math.log2(n)) + 1, dblI: (i, n) => Math.floor(Math.log2(i)) + 1,
    stepI: (i, n) => Math.floor((n - 1) / i) + 1, sqrtI: (i, n) => Math.floor(Math.sqrt(i) + 1e-9), none: () => 1
  }
};
const CANDS = [["log n", n => Math.log2(n)], ["√n", n => Math.sqrt(n)], ["n", n => n], ["n log n", n => n * Math.log2(n)], ["n√n", n => n ** 1.5], ["n²", n => n * n], ["n² log n", n => n * n * Math.log2(n)]];
bench("w-loops", {
  build(el) {
    const o = $("#lp-o", el).value, inn = $("#lp-i", el).value, n = +$("#lp-n", el).value;
    const count = N => LOOP.outer[o](N).reduce((s, i) => s + LOOP.inner[inn](i, N), 0);
    const oTxt = $("#lp-o", el).selectedOptions[0].textContent, iTxt = $("#lp-i", el).selectedOptions[0].textContent;
    const code = `${oTxt}\n${inn === "none" ? "    count++;" : "    " + iTxt + "\n        count++;"}`;
    // dots
    const rowsI = LOOP.outer[o](n);
    const maxC = Math.max(...rowsI.map(i => LOOP.inner[inn](i, n)), 1);
    const d = Math.max(5, Math.min(12, Math.floor(420 / Math.max(maxC, 1))));
    const W = 70 + maxC * d + 10, Hh = rowsI.length * (d + 1) + 26;
    let s = `<svg viewBox="0 0 ${W} ${Hh}" width="${Math.min(W, 620)}" role="img" aria-label="One row of dots per outer iteration">`;
    rowsI.forEach((i, r) => {
      const c = LOOP.inner[inn](i, n), y = 16 + r * (d + 1);
      if (rowsI.length <= 40) s += `<text x="60" y="${y + d - 1}" text-anchor="end" class="sub" style="font-size:${Math.min(11, d + 1)}px">i=${i}</text>`;
      for (let j = 0; j < c; j++) s += `<rect x="${66 + j * d}" y="${y}" width="${d - 1.5}" height="${d - 1.5}" rx="1.5" class="acc-f" opacity=".75"/>`;
    });
    s += `<text x="66" y="10" class="faint">each dot = one execution of count++ (n = ${n}, total ${count(n)})</text></svg>`;
    // fit
    const Ns = [2 ** 10, 2 ** 12, 2 ** 14, 2 ** 16, 2 ** 18];
    const cs = Ns.map(count);
    let best = 0, bestErr = Infinity;
    CANDS.forEach(([_, g], k) => { const r1 = cs[3] / g(Ns[3]), r2 = cs[4] / g(Ns[4]); const err = Math.abs(Math.log(r2 / r1)); if (err < bestErr) { bestErr = err; best = k; } });
    const head = ["n", "count", ...CANDS.map(c => "count / " + c[0])];
    const rows = Ns.map((N, r) => [{ v: `2<sup>${Math.log2(N)}</sup>`, raw: true }, cs[r].toLocaleString(), ...CANDS.map(([_, g], k) => ({ v: r2(cs[r] / g(N)) < 0.01 ? "≈0" : r2(cs[r] / g(N)).toLocaleString(), raw: true, c: k === best ? "ok" : "" }))]);
    $(".out", el).innerHTML = `<div class="row"><pre class="code" style="margin:0">${esc(code)}</pre><div class="result" style="margin:0;align-self:center">Fits <b>Θ(${CANDS[best][0]})</b>: the green column settles to a constant.</div></div>
      <div style="margin-top:14px;overflow-x:auto">${s}</div>${table(head, rows)}`;
  }
});

/* ---------- iteration checker ---------- */
const FN = { "1": n => 1, "n": n => n, "n2": n => n * n, "logn": n => Math.log2(n) };
const GUESS = { "2n": n => 2 ** n - 1, "n": n => n, "nlogn": n => n * Math.log2(n), "n2": n => n * n, "n2h": n => n * (n + 1) / 2, "logn": n => Math.log2(n) + 1, "n3": n => n ** 3 };
bench("w-iter", {
  build(el) {
    const form = $("#it-form", el).value, a = +$("#it-a", el).value, b = +$("#it-b", el).value, f = FN[$("#it-f", el).value], t1 = +$("#it-t1", el).value, g = GUESS[$("#it-g", el).value];
    if (a < 1) throw new Error("a must be at least 1.");
    const memo = {};
    const T = n => { if (n <= 1) return t1; if (memo[n] !== undefined) return memo[n]; return memo[n] = form === "sub" ? a * T(n - 1) + f(n) : a * T(n / b) + f(n); };
    if (form === "div" && b < 2) throw new Error("b must be at least 2.");
    const ns = form === "sub" ? [1, 2, 3, 4, 5, 6, 8, 10, 15, 20] : [0, 1, 2, 3, 4, 5, 6, 8, 10, 12].map(e => b ** e);
    let exact = true;
    const rows = ns.map(n => { const t = T(n), gg = g(n); if (Math.abs(t - gg) > 1e-6 * Math.max(1, Math.abs(t))) exact = false; return [n.toLocaleString(), r2(t).toLocaleString(), r2(gg).toLocaleString(), gg ? r2(t / gg) : "–"]; });
    const ratios = ns.slice(-3).map(n => T(n) / g(n));
    const steady = Math.abs(ratios[2] / ratios[1] - 1) < 0.05;
    $(".out", el).innerHTML = table(["n", "T(n) from the recurrence", "your guess", "ratio"], rows) +
      `<div class="result" style="${exact || steady ? "" : "background:var(--red-soft)"}">${exact ? "The guess matches T(n) exactly at every tested n." : steady ? "The ratio settles to a constant, so the guess has the right growth rate (Θ), though not the exact constant." : "The ratio keeps changing, so the guess has the wrong growth rate."}</div>`;
  }
});

/* ---------- master theorem lab ---------- */
bench("w-master", {
  build(el) {
    const a = +$("#ms-a", el).value, b = +$("#ms-b", el).value, k = +$("#ms-k", el).value, p = +$("#ms-p", el).value;
    if (!(a >= 1)) throw new Error("a must be at least 1.");
    if (!(b > 1)) throw new Error("b must be greater than 1.");
    const x = Math.log(a) / Math.log(b), xs = r2(x);
    const nx = Math.abs(x - Math.round(x)) < 1e-9 ? (Math.round(x) === 0 ? "1" : Math.round(x) === 1 ? "n" : "n" + sup(Math.round(x))) : `n^${xs}`;
    const lg = q => q === 0 ? "" : q === 1 ? " log n" : ` log${sup(String(q).replace("-", "⁻"))} n`;
    const fn = (k === 0 ? (p === 0 ? "1" : "") : k === 1 ? "n" : "n" + (Number.isInteger(k) ? sup(k) : "^" + k)) + lg(p);
    const pw = q => q === 0 ? "1" : q === 1 ? "n" : (Number.isInteger(q) ? "n" + sup(q) : "n^" + r2(q));
    let cs, ans, why;
    const eq = Math.abs(x - k) < 1e-9;
    if (!eq && x > k) { cs = "Case 1"; ans = `Θ(${nx})`; why = `f(n) = ${fn} is polynomially smaller than n^(log_b a) = ${nx} (by a factor n^${r2(x - k)}). The leaves dominate.`; }
    else if (eq) {
      if (p > -1) { cs = "Case 2"; ans = `Θ(${pw(k)}${lg(p + 1)})`; why = `f(n) matches n^(log_b a) = ${nx}${p ? ` up to log${sup(p)} n` : ""}. Every level costs about the same, and there are log n levels.` + (p > 0 ? " (Extended case 2: f = Θ(n^(log_b a) logᵏ n) gives an extra log.)" : ""); }
      else if (p === -1) { cs = "Gap (extended form)"; ans = `Θ(${pw(k)} log log n)`; why = `f(n) is smaller than ${nx} only by a log factor, not by a polynomial. The standard theorem does not apply; the extended form gives this answer.`; }
      else { cs = "Gap (extended form)"; ans = `Θ(${nx})`; why = `The standard theorem does not apply (log-factor gap). The extended form gives Θ(n^(log_b a)).`; }
    } else {
      const c = a / b ** k;
      cs = "Case 3"; ans = `Θ(${fn})`;
      why = `f(n) = ${fn} is polynomially larger than ${nx}. Regularity: a·f(n/b) ≈ (a/bᵏ)·f(n) = ${r2(c)}·f(n), and ${r2(c)} &lt; 1 ✓. The root dominates.`;
    }
    // level bars for n = b^10
    const Lv = 10, n = b ** Lv, f = m => m ** k * (m > 1 ? Math.log2(m) ** p : 1);
    const costs = []; for (let i = 0; i < Lv; i++) costs.push(a ** i * f(n / b ** i)); costs.push(a ** Lv);
    const mx = Math.max(...costs);
    const W = 600, Hh = 190, bw = (W - 60) / costs.length;
    let s = `<svg viewBox="0 0 ${W} ${Hh}" width="${W}" role="img" aria-label="Total work per level of the recursion tree">`;
    costs.forEach((c, i) => {
      const h = Math.max(1.5, c / mx * (Hh - 50));
      s += `<rect x="${40 + i * bw}" y="${Hh - 28 - h}" width="${bw - 8}" height="${h}" rx="2" class="${i === Lv ? "amb-f amb-s" : "acc-f"}" opacity="${i === Lv ? 1 : .8}"/><text x="${40 + i * bw + (bw - 8) / 2}" y="${Hh - 12}" text-anchor="middle" class="sub">${i === Lv ? "leaves" : i}</text>`;
    });
    s += `<text x="40" y="14" class="faint">total work per level (level 0 = root), n = ${b}<tspan dy="-4" font-size="8.5">10</tspan></text></svg>`;
    $(".out", el).innerHTML = `<div class="big-math" style="white-space:normal">T(n) = ${a}·T(n/${b}) + ${fn || "1"}     ·     n^(log_${b} ${a}) = ${nx}</div>
      <div class="result"><b>${cs}</b>: T(n) = <b>${ans}</b><br><span style="font-size:15px">${why}</span></div><div style="margin-top:14px;overflow-x:auto">${s}</div>`;
  }
});
