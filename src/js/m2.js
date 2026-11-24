/* ======================= MODULE 2 ======================= */

/* ---------- linked-list union figure ---------- */
STATIC["ll-union"] = el => {
  const box = (x, y, t, cls = "") => `<g class="n ${cls}"><rect x="${x}" y="${y}" width="40" height="28" rx="4"/><text class="lbl" x="${x + 20}" y="${y + 19}" text-anchor="middle">${t}</text></g>`;
  const arrow = (x1, y, x2, cls = "ink") => `<line x1="${x1}" y1="${y}" x2="${x2 - 3}" y2="${y}" class="e" style="stroke:var(--ink-2)"/><path d="M${x2 - 8},${y - 4} L${x2},${y} L${x2 - 8},${y + 4} Z" class="ink-f"/>`;
  const list = (ox, oy, items, name, upd = []) => {
    let s = `<rect x="${ox}" y="${oy}" width="${items.length * 60 - 20}" height="24" rx="4" class="soft-f line-s" stroke-width="1.3"/><text x="${ox + 8}" y="${oy + 16}" style="font-size:12.5px;font-weight:700">${name}</text>
      <text x="${ox + items.length * 60 - 28}" y="${oy + 16}" text-anchor="end" class="faint">head · tail</text>`;
    items.forEach((t, i) => {
      const x = ox + i * 60;
      s += `<line x1="${x + 20}" y1="${oy + 60}" x2="${x + 20}" y2="${oy + 26}" class="${upd.includes(t) ? "amb-s" : "line-s"}" stroke-width="${upd.includes(t) ? 2.4 : 1.2}" stroke-dasharray="3 3"/>`;
      s += box(x, oy + 60, t, upd.includes(t) ? "cur" : "");
      if (i < items.length - 1) s += arrow(x + 40, oy + 74, x + 60);
    });
    return s;
  };
  let s = `<svg viewBox="0 0 640 260" width="640" role="img" aria-label="Linked-list sets before and after a weighted union">`;
  s += `<text x="0" y="14" class="faint">before</text>` + list(0, 24, ["a", "b", "c"], "S₁ (size 3)") + list(230, 24, ["d", "e"], "S₂ (size 2)");
  s += `<text x="0" y="146" class="faint">after UNION: the shorter list S₂ is appended to S₁</text>` + list(0, 156, ["a", "b", "c", "d", "e"], "S₁ (size 5)", ["d", "e"]);
  el.innerHTML = s + `</svg><figcaption>Dashed lines are the back pointers to the set object, whose head is the representative. Only the two moved elements (amber) needed their back pointer rewritten. Appending S₁ onto S₂ instead would have rewritten three.</figcaption>`;
};

/* ---------- array representation figure ---------- */
STATIC["ds-array"] = el => {
  const T = (k, ch = []) => ({ label: String(k), children: ch.map(c => T(c)) });
  const forest = [T(1, [7, 8, 9]), T(5, [2, 10]), T(3, [4, 6])];
  forest.forEach(r => r.cls = "done");
  const p = { 1: -1, 2: 5, 3: -1, 4: 3, 5: -1, 6: 3, 7: 1, 8: 1, 9: 1, 10: 5 };
  const idx = Object.keys(p);
  el.innerHTML = `<div class="row"><div>${drawTree(forest, { gap: 26, maxW: 420 })}</div><div>${table(["i", ...idx], [["p[i]", ...idx.map(i => ({ v: p[i], c: p[i] < 0 ? "ok" : "" }))]])}</div></div>
  <figcaption>Three sets {1, 7, 8, 9}, {2, 5, 10}, {3, 4, 6}. Roots (green) store −1. FIND(10): p[10] = 5, p[5] = −1, so the representative is 5.</figcaption>`;
};

/* ---------- union-find engine ---------- */
function parseOps(text) {
  const ops = [];
  for (const raw of text.split(/\n|;/)) {
    const t = raw.replace(/[(),]/g, " ").trim().split(/\s+/).filter(Boolean);
    if (!t.length) continue;
    const c = t[0].toLowerCase();
    if (/^(u|union|link)$/.test(c) && t.length >= 3) ops.push({ op: "u", args: [t[1], t[2]] });
    else if (/^(f|find|find-set|findset)$/.test(c) && t.length >= 2) ops.push({ op: "f", args: [t[1]] });
    else if (/^(m|make|make-set|makeset)$/.test(c) && t.length >= 2) ops.push({ op: "m", args: [t[1]] });
    else throw new Error(`Could not read "${raw.trim()}". Use "union a b" or "find a".`);
  }
  return ops;
}
function dsuForest(st, hl = {}) {
  const kids = {}; st.order.forEach(x => kids[x] = []);
  const roots = [];
  st.order.forEach(x => { if (st.par[x] === x) roots.push(x); else kids[st.par[x]].push(x); });
  const mk = x => ({ label: x, cls: hl[x] || "", children: kids[x].map(mk), under: st.par[x] === x ? (st.showRank ? "r=" + st.rk[x] : "root") : undefined });
  return roots.map(mk);
}
bench("w-dsu", {
  build(el) {
    const ops = parseOps($("#ds-ops", el).value);
    const useRank = $("#ds-rank", el).checked, pc = $("#ds-pc", el).checked, tie = $("#ds-tie", el).value;
    const par = {}, rk = {}, order = [];
    const make = x => { if (!(x in par)) { par[x] = x; rk[x] = 0; order.push(x); } };
    ops.forEach(o => o.args.forEach(make));
    if (order.length > 30) throw new Error("Use at most 30 different items.");
    const snap = (hl, msg) => ({ st: { par: { ...par }, rk: { ...rk }, order: [...order], showRank: useRank }, hl, msg });
    const fr = [snap({}, `MAKE-SET for each of the ${order.length} items: ${order.length} separate one-node trees.`)];
    const pathOf = x => { const p = [x]; while (par[p[p.length - 1]] !== p[p.length - 1]) p.push(par[p[p.length - 1]]); return p; };
    const find = x => { const p = pathOf(x), r = p[p.length - 1]; if (pc) p.forEach(v => par[v] = r); return { r, p }; };
    for (const o of ops) {
      if (o.op === "m") continue;
      if (o.op === "f") {
        const p = pathOf(o.args[0]), r = p[p.length - 1];
        const hl = {}; p.forEach(v => hl[v] = "front"); hl[r] = "cur";
        fr.push(snap(hl, `FIND(${esc(o.args[0])}): walk up ${p.map(esc).join(" → ")}. The representative is <b>${esc(r)}</b>.`));
        find(o.args[0]);
        if (pc && p.length > 2) { const h2 = {}; p.forEach(v => h2[v] = "done"); fr.push(snap(h2, `Path compression: ${p.slice(0, -1).map(esc).join(", ")} now point directly to ${esc(r)}.`)); }
        continue;
      }
      const [x, y] = o.args;
      const px = pathOf(x), py = pathOf(y), rx = px[px.length - 1], ry = py[py.length - 1];
      const hl = {}; px.concat(py).forEach(v => hl[v] = "front"); hl[rx] = "cur"; hl[ry] = "cur";
      fr.push(snap(hl, `UNION(${esc(x)}, ${esc(y)}): FIND(${esc(x)}) = <b>${esc(rx)}</b>${px.length > 1 ? ` via ${px.map(esc).join("→")}` : ""}, FIND(${esc(y)}) = <b>${esc(ry)}</b>${py.length > 1 ? ` via ${py.map(esc).join("→")}` : ""}.`));
      find(x); find(y);
      if (rx === ry) { fr.push(snap({ [rx]: "bad" }, `${esc(x)} and ${esc(y)} are already in the same set. Nothing to do.`)); continue; }
      let child, parent, why;
      const firstUnderSecond = tie === "first";
      if (useRank && rk[rx] !== rk[ry]) {
        [child, parent] = rk[rx] < rk[ry] ? [rx, ry] : [ry, rx];
        why = `rank(${esc(child)}) = ${rk[child]} &lt; rank(${esc(parent)}) = ${rk[parent]}, so ${esc(child)} goes under ${esc(parent)}. Ranks do not change.`;
        par[child] = parent;
      } else {
        [child, parent] = firstUnderSecond ? [rx, ry] : [ry, rx];
        par[child] = parent;
        if (useRank) { rk[parent]++; why = `Equal ranks, so by the tie rule ${esc(child)} goes under ${esc(parent)}, and rank(${esc(parent)}) rises to ${rk[parent]}.`; }
        else why = `No ranks: ${esc(child)} goes under ${esc(parent)} as the rule says.`;
      }
      fr.push(snap({ [parent]: "done", [child]: "new" }, (pc && (px.length > 2 || py.length > 2) ? "The finds compressed their paths. " : "") + why));
    }
    const sets = {}; order.forEach(x => { const r = pathOf(x).pop(); (sets[r] = sets[r] || []).push(x); });
    fr.push(snap({}, `Final sets: ${Object.values(sets).map(s => "{" + s.map(esc).join(", ") + "}").join("  ")}`));
    return fr;
  },
  render(f) {
    const roots = dsuForest(f.st, f.hl);
    const rows = [["parent", ...f.st.order.map(x => ({ v: f.st.par[x], c: f.st.par[x] === x ? "ok" : "" }))]];
    if (f.st.showRank) rows.push(["rank", ...f.st.order.map(x => f.st.rk[x])]);
    return drawTree(roots, { gap: 22, maxW: 860 }) + table(["item", ...f.st.order], rows);
  }
});

/* ---------- connected components ---------- */
function pairsOf(s) {
  return s.split(/[,;\n]/).map(x => x.trim()).filter(Boolean).map(x => {
    const t = x.split(/\s+/); if (t.length !== 2) throw new Error(`"${x}" should be two vertex names, like "a b".`); return t;
  });
}
bench("w-cc", {
  build(el) {
    const V = parseList($("#cc-v", el).value), E = pairsOf($("#cc-e", el).value), Q = $("#cc-q", el).value.trim() ? pairsOf($("#cc-q", el).value) : [];
    E.forEach(([a, b]) => { if (!V.includes(a)) V.push(a); if (!V.includes(b)) V.push(b); });
    const par = {}; V.forEach(v => par[v] = v);
    const find = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
    const pos = circleLayout(V, 200, 170, Math.max(100, 26 * V.length / Math.PI));
    const status = {};
    const G = { nodes: V, edges: E.map(([u, v]) => ({ u, v })), directed: false };
    const snap = (cur, msg) => {
      const groups = {}; V.forEach(v => (groups[find(v)] = groups[find(v)] || []).push(v));
      const list = Object.values(groups);
      const colour = {}; let ci = 0; list.forEach(g => { if (g.length > 1) { g.forEach(v => colour[v] = "c" + (ci % 6)); ci++; } });
      return { view: viewGraph(G, pos, { ncls: colour, ecls: e => { const k = e.u + "|" + e.v; return k === cur ? "hi" : status[k] === "u" ? "ok" : status[k] === "s" ? "bad" : "dim"; } }), sets: list.map(g => "{" + g.join(", ") + "}"), msg };
    };
    const fr = [snap(null, `MAKE-SET(v) for all ${V.length} vertices: ${V.length} sets.`)];
    for (const [u, v] of E) {
      const ru = find(u), rv = find(v), k = u + "|" + v;
      if (ru !== rv) { par[ru] = rv; status[k] = "u"; fr.push(snap(k, `Edge (${esc(u)}, ${esc(v)}): FIND gives different sets, so UNION them.`)); }
      else { status[k] = "s"; fr.push(snap(k, `Edge (${esc(u)}, ${esc(v)}): both already in the same set. Skip (this edge closes a cycle).`)); }
    }
    const n = new Set(V.map(find)).size;
    const qa = Q.map(([a, b]) => `SAME-COMPONENT(${esc(a)}, ${esc(b)}) = <b>${V.includes(a) && V.includes(b) && find(a) === find(b) ? "TRUE" : "FALSE"}</b>`);
    fr.push(snap(null, `Done: <b>${n}</b> connected component${n > 1 ? "s" : ""}.${qa.length ? "<br>" + qa.join(" · ") : ""}`));
    return fr;
  },
  render: f => `<div class="row"><div>${drawGraph(f.view, { maxW: 440 })}</div><div><p class="panel-title">Current sets</p>${f.sets.map(s => `<span class="pill">${esc(s)}</span>`).join(" ")}</div></div>`
});

/* ---------- representation builder ---------- */
bench("w-repr", {
  build(el) {
    const G = parseGraph($("#rp-e", el).value.replace(/,/g, "\n"), { directed: $("#rp-dir", el).checked });
    const V = [...G.nodes].sort(natCmp), adj = adjOf(G);
    const M = V.map(u => V.map(v => G.edges.some(e => (e.u === u && e.v === v) || (!G.directed && e.u === v && e.v === u)) ? 1 : 0));
    const indeg = V.map((_, j) => M.reduce((s, r) => s + r[j], 0)), outdeg = M.map(r => r.reduce((a, b) => a + b, 0));
    const lists = V.map(u => `<div class="mono" style="margin:3px 0"><span class="pill cur">${esc(u)}</span> → ${adj[u].length ? adj[u].map(x => `<span class="pill">${esc(x.v)}</span>`).join(" → ") : "<span class='faint'>/</span>"}</div>`).join("");
    const pos = circleLayout(V, 160, 140, Math.max(80, 26 * V.length / Math.PI));
    $(".out", el).innerHTML = `<div class="row">
      <div>${drawGraph(viewGraph(G, pos), { maxW: 320 })}</div>
      <div><p class="panel-title">Adjacency matrix</p>${table(["", ...V, G.directed ? "out" : "deg"], M.map((r, i) => [...r.map(v => ({ v, c: v ? "ok" : "dim" })), { v: outdeg[i], c: "kk" }]), { rowHead: V })}
      ${G.directed ? `<p class="faint" style="font-size:13.5px">In-degrees (column sums): ${V.map((v, j) => esc(v) + "=" + indeg[j]).join(", ")}</p>` : ""}</div>
      <div><p class="panel-title">Adjacency list</p>${lists}<p class="faint" style="font-size:13.5px">${G.directed ? G.edges.length : 2 * G.edges.length} list entries for ${G.edges.length} edges.</p></div></div>`;
  }
});

/* ---------- layered layout for DAG-ish drawings ---------- */
function layeredLayout(G) {
  const V = [...G.nodes].sort(natCmp), adj = adjOf(G), indeg = {}; V.forEach(v => indeg[v] = 0);
  G.edges.forEach(e => indeg[e.v]++);
  const layer = {}, q = V.filter(v => !indeg[v]), d = { ...indeg }; q.forEach(v => layer[v] = 0);
  const seen = [];
  while (q.length) { const u = q.shift(); seen.push(u); for (const { v } of adj[u]) { layer[v] = Math.max(layer[v] ?? 0, layer[u] + 1); if (--d[v] === 0) q.push(v); } }
  if (seen.length < V.length) return circleLayout(V, 220, 170);
  const by = {}; V.forEach(v => (by[layer[v]] = by[layer[v]] || []).push(v));
  const maxN = Math.max(...Object.values(by).map(a => a.length));
  const pos = {};
  Object.entries(by).forEach(([L, vs]) => vs.forEach((v, i) => pos[v] = { x: 60 + L * 115, y: 50 + (i + (maxN - vs.length) / 2) * 78 }));
  return pos;
}

/* ---------- BFS / DFS stepper ---------- */
bench("w-trav", {
  build(el) {
    const directed = $("#tv-dir", el).checked;
    const G = parseGraph($("#tv-e", el).value, { directed });
    const adj = adjOf(G), V = [...G.nodes].sort(natCmp), s = $("#tv-s", el).value.trim();
    if (!adj[s]) throw new Error(`Start vertex "${s}" is not in the graph.`);
    const pos = positionsFor(G, null);
    const alg = $("#tv-alg", el).value;
    return alg === "bfs" ? bfsFrames(G, adj, V, s, pos) : dfsFrames(G, adj, V, s, pos, directed);
  },
  render(f) {
    return `<div class="row"><div>${drawGraph(f.view, { maxW: 470 })}</div><div style="flex:1 1 220px">${f.side}</div></div>`;
  }
});
function bfsFrames(G, adj, V, s, pos) {
  const color = {}, d = {}, pi = {}, tree = new Set(); V.forEach(v => { color[v] = "w"; d[v] = INF; pi[v] = "–"; });
  const fr = [];
  const snap = (cur, msg, Q) => {
    const ncls = {}; V.forEach(v => ncls[v] = color[v] === "g" ? "front" : color[v] === "b" ? "done" : ""); if (cur) ncls[cur] = "cur";
    const nsub = {}; V.forEach(v => nsub[v] = d[v] === INF ? "" : "d=" + d[v]);
    fr.push({
      view: viewGraph(G, pos, { ncls, nsub, ecls: e => tree.has(ekey(e.u, e.v, G.directed)) ? "tree" : "" }),
      side: `<p class="panel-title">Queue (front → back)</p><div>${Q.length ? Q.map(x => `<span class="pill">${esc(x)}</span>`).join("") : "<span class='faint'>empty</span>"}</div>
        ${table(["v", "d", "π"], V.map(v => [v, d[v], pi[v]]))}`, msg
    });
  };
  color[s] = "g"; d[s] = 0; const Q = [s];
  snap(null, `Start: colour ${esc(s)} gray, d[${esc(s)}] = 0, and enqueue it.`, Q);
  const order = [];
  while (Q.length) {
    const u = Q.shift(); order.push(u);
    const found = [], skip = [];
    for (const { v } of adj[u]) {
      if (color[v] === "w") { color[v] = "g"; d[v] = d[u] + 1; pi[v] = u; tree.add(ekey(u, v, G.directed)); Q.push(v); found.push(v); }
      else skip.push(v);
    }
    color[u] = "b";
    snap(u, `Dequeue <b>${esc(u)}</b>. ${found.length ? `New (white) neighbours ${found.map(esc).join(", ")} get d = ${d[u] + 1} and join the queue.` : "No white neighbours."}${skip.length ? ` Already seen: ${skip.map(esc).join(", ")}.` : ""} ${esc(u)} turns black.`, Q);
  }
  const un = V.filter(v => d[v] === INF);
  snap(null, `BFS order: <b>${order.map(esc).join(", ")}</b>.${un.length ? ` Not reachable from ${esc(s)}: ${un.map(esc).join(", ")}.` : ""} Green edges form the BFS tree.`, []);
  return fr;
}
function dfsFrames(G, adj, V, s, pos, directed, opts = {}) {
  const color = {}, d = {}, f = {}, pi = {}, kind = {}; V.forEach(v => { color[v] = "w"; pi[v] = null; });
  let time = 0; const fr = [], stack = [], finishOrder = [];
  const snap = (cur, msg, extra = "") => {
    const ncls = {}; V.forEach(v => ncls[v] = color[v] === "g" ? "front" : color[v] === "b" ? "done" : ""); if (cur) ncls[cur] = "cur";
    const nsub = {}; V.forEach(v => nsub[v] = d[v] ? `${d[v]}/${f[v] ?? "–"}` : "");
    fr.push({
      view: viewGraph(G, pos, { ncls, nsub, ecls: e => kind[ekey(e.u, e.v, directed)] || "" }),
      side: `<p class="panel-title">Recursion stack (bottom → top)</p><div>${stack.length ? stack.map(x => `<span class="pill">${esc(x)}</span>`).join("") : "<span class='faint'>empty</span>"}</div>
        ${table(["v", "d", "f", "π"], V.map(v => [v, d[v] ?? "–", f[v] ?? "–", pi[v] ?? "–"]))}${extra}`, msg
    });
  };
  const visit = u => {
    color[u] = "g"; d[u] = ++time; stack.push(u);
    snap(u, `Discover <b>${esc(u)}</b> at time ${time}${pi[u] ? ` (tree edge ${esc(pi[u])} → ${esc(u)})` : " (start of a new DFS tree)"}.`);
    for (const { v } of adj[u]) {
      const k = ekey(u, v, directed);
      if (!directed && kind[k]) continue;
      if (color[v] === "w") { kind[k] = "tree"; pi[v] = u; visit(v); continue; }
      if (!directed && pi[u] === v) continue;
      let t;
      if (color[v] === "g") t = "back"; else t = d[u] < d[v] ? "fwd" : "cross";
      kind[k] = t;
      const nm = { back: "back edge (v is gray: a cycle!)", fwd: "forward edge (v is a finished descendant)", cross: "cross edge (v is finished, in another branch)" }[t];
      snap(u, `Edge ${esc(u)} → ${esc(v)}: ${esc(v)} is ${color[v] === "g" ? "gray" : "black"}, so it is a <b>${nm}</b>.`);
    }
    color[u] = "b"; f[u] = ++time; stack.pop(); finishOrder.push(u);
    snap(u, `All neighbours of <b>${esc(u)}</b> done. Finish it at time ${time}.` + (opts.onFinish ? opts.onFinish(u, finishOrder) : ""), opts.extra ? opts.extra(finishOrder) : "");
  };
  const roots = [s, ...V.filter(v => v !== s)];
  snap(null, `All vertices white, time = 0. Start DFS at ${esc(s)}.`);
  for (const r of roots) if (color[r] === "w") visit(r);
  const counts = {}; Object.values(kind).forEach(k => counts[k] = (counts[k] || 0) + 1);
  snap(null, `DFS finished. Edge counts: ${["tree", "back", "fwd", "cross"].filter(k => counts[k]).map(k => `${counts[k]} ${({ tree: "tree", back: "back", fwd: "forward", cross: "cross" })[k]}`).join(", ")}.` + (counts.back ? " A back edge exists, so the graph has a cycle." : directed ? " No back edges: the graph is acyclic." : ""), opts.extra ? opts.extra(finishOrder) : "");
  fr.result = { d, f, finishOrder, hasCycle: !!counts.back };
  return fr;
}

/* ---------- topological sort ---------- */
bench("w-topo", {
  build(el) {
    const G = parseGraph($("#tp-e", el).value, { directed: true });
    const adj = adjOf(G), V = [...G.nodes].sort(natCmp), pos = layeredLayout(G);
    if ($("#tp-m", el).value === "dfs") {
      const front = [];
      const fr = dfsFrames(G, adj, V, V[0], pos, true, {
        onFinish: (u) => { front.unshift(u); return ` Insert it at the front of the list.`; },
        extra: fo => `<p class="panel-title" style="margin-top:10px">List so far</p><div>${[...fo].reverse().map(x => `<span class="pill ok">${esc(x)}</span>`).join("")}</div>`
      });
      const last = fr[fr.length - 1];
      last.msg += fr.result.hasCycle ? " <b>So no topological order exists.</b>" : ` Topological order: <b>${[...fr.result.finishOrder].reverse().map(esc).join(" → ")}</b>`;
      return fr;
    }
    const indeg = {}; V.forEach(v => indeg[v] = 0); G.edges.forEach(e => indeg[e.v]++);
    const out = [], done = new Set(), fr = [];
    let Q = V.filter(v => indeg[v] === 0);
    const snap = (cur, msg) => {
      const ncls = {}; V.forEach(v => ncls[v] = done.has(v) ? "done" : Q.includes(v) ? "front" : ""); if (cur) ncls[cur] = "cur";
      const nsub = {}; V.forEach(v => nsub[v] = done.has(v) ? "" : "in=" + indeg[v]);
      fr.push({ view: viewGraph(G, pos, { ncls, nsub, ecls: e => done.has(e.u) ? "dim" : "" }), side: `<p class="panel-title">Sources available (in-degree 0)</p><div>${Q.map(x => `<span class="pill">${esc(x)}</span>`).join("") || "<span class='faint'>none</span>"}</div><p class="panel-title" style="margin-top:10px">Output</p><div>${out.map(x => `<span class="pill ok">${esc(x)}</span>`).join("")}</div>`, msg });
    };
    snap(null, `In-degrees computed. Vertices with in-degree 0: ${Q.map(esc).join(", ") || "none"}.`);
    while (Q.length) {
      Q.sort(natCmp); const u = Q.shift();
      out.push(u); done.add(u);
      const freed = [];
      for (const { v } of adj[u]) { indeg[v]--; if (indeg[v] === 0) { Q.push(v); freed.push(v); } }
      snap(u, `Remove source <b>${esc(u)}</b> and output it. Decrease the in-degree of ${adj[u].map(x => esc(x.v)).join(", ") || "nothing"}.${freed.length ? ` Now in-degree 0: ${freed.map(esc).join(", ")}.` : ""}`);
    }
    snap(null, out.length === V.length ? `Topological order: <b>${out.map(esc).join(" → ")}</b>` : `Stuck: ${V.filter(v => !done.has(v)).map(esc).join(", ")} never reach in-degree 0. <b>The graph has a cycle</b>, so no topological order exists.`);
    return fr;
  },
  render: f => `<div class="row"><div>${drawGraph(f.view, { maxW: 560 })}</div><div style="flex:1 1 220px">${f.side}</div></div>`
});

/* ---------- Kosaraju ---------- */
bench("w-scc", {
  build(el) {
    const G = parseGraph($("#sc-e", el).value, { directed: true });
    const adj = adjOf(G), V = [...G.nodes].sort(natCmp), s = $("#sc-s", el).value.trim() || V[0];
    if (!adj[s]) throw new Error(`"${s}" is not a vertex.`);
    const pos = circleLayout(V, 220, 180, Math.max(110, 30 * V.length / Math.PI));
    // pass 1
    const d = {}, f = {}; let t = 0; const seen = new Set(), fin = [];
    const fr = [];
    const p1 = u => { seen.add(u); d[u] = ++t; for (const { v } of adj[u]) if (!seen.has(v)) p1(v); f[u] = ++t; fin.push(u); };
    const sub = () => { const o = {}; V.forEach(v => o[v] = d[v] ? `${d[v]}/${f[v] ?? "–"}` : ""); return o; };
    let k = 0;
    const roots = [s, ...V.filter(v => v !== s)];
    // frame per pass-1 tree
    for (const r of roots) if (!seen.has(r)) {
      const before = fin.length; p1(r);
      const ncls = {}; V.forEach(v => ncls[v] = seen.has(v) ? "done" : ""); fin.slice(before).forEach(v => ncls[v] = "cur");
      fr.push({ view: viewGraph(G, pos, { ncls, nsub: sub() }), side: finSide(fin, f), msg: `Pass 1: DFS from <b>${esc(r)}</b> visits ${fin.slice(before).map(esc).join(", ")}. Labels show discovery/finish times.` });
    }
    const order = [...fin].reverse();
    const GT = { nodes: G.nodes, edges: G.edges.map(e => ({ u: e.v, v: e.u })), directed: true };
    const adjT = adjOf(GT);
    fr.push({ view: viewGraph(GT, pos, { nsub: sub() }), side: finSide(fin, f), msg: `Build Gᵀ by reversing every edge. Pass 2 takes vertices in decreasing finish time: <b>${order.map(esc).join(", ")}</b>.` });
    const comp = {}, comps = [];
    for (const r of order) if (comp[r] === undefined) {
      const c = []; const st = [r]; comp[r] = comps.length;
      while (st.length) { const u = st.pop(); c.push(u); for (const { v } of adjT[u]) if (comp[v] === undefined) { comp[v] = comps.length; st.push(v); } }
      comps.push(c);
      const ncls = {}; V.forEach(v => { if (comp[v] !== undefined) ncls[v] = "c" + (comp[v] % 6); });
      fr.push({ view: viewGraph(GT, pos, { ncls, nsub: sub() }), side: compSide(comps), msg: `Pass 2: DFS in Gᵀ from <b>${esc(r)}</b> (highest finish time still unvisited) reaches only {${c.map(esc).join(", ")}}. That is one SCC.` });
    }
    // final on G with component colours + condensation
    const ncls = {}; V.forEach(v => ncls[v] = "c" + (comp[v] % 6));
    const cEdges = new Set(); G.edges.forEach(e => { if (comp[e.u] !== comp[e.v]) cEdges.add(comp[e.u] + ">" + comp[e.v]); });
    const cg = { directed: true, nodes: comps.map((c, i) => ({ id: "C" + (i + 1), x: 60 + i * 95, y: 60 + (i % 2) * 70, cls: "c" + (i % 6) })), edges: [...cEdges].map(x => { const [a, b] = x.split(">"); return { u: "C" + (+a + 1), v: "C" + (+b + 1) }; }) };
    fr.push({ view: viewGraph(G, pos, { ncls, ecls: e => comp[e.u] === comp[e.v] ? "" : "dim" }), side: compSide(comps) + `<p class="panel-title" style="margin-top:12px">Component graph (always a DAG)</p>${drawGraph(cg, { maxW: 320 })}`, msg: `<b>${comps.length}</b> strongly connected components. Edges between different components (faded) form the component DAG.` });
    return fr;
  },
  render: f => `<div class="row"><div>${drawGraph(f.view, { maxW: 470 })}</div><div style="flex:1 1 220px">${f.side}</div></div>`
});
function finSide(fin, f) { return `<p class="panel-title">Finish order (pass 1)</p><div>${fin.map(v => `<span class="pill">${esc(v)}:${f[v]}</span>`).join("")}</div>`; }
function compSide(comps) { return `<p class="panel-title">SCCs found</p>${comps.map((c, i) => `<div style="margin:4px 0"><svg width="14" height="14" style="vertical-align:-2px"><g class="n c${i % 6}"><circle cx="7" cy="7" r="6"/></g></svg> C${i + 1} = {${c.map(esc).join(", ")}}</div>`).join("")}`; }

/* ---------- merge sort tree ---------- */
bench("w-msort", {
  build(el) {
    const A = parseNums($("#ms2-a", el).value);
    if (A.length < 2 || A.length > 16) throw new Error("Use between 2 and 16 numbers.");
    const segs = [];
    let comps = 0;
    const rec = (lo, hi, dep) => {
      const node = { lo, hi, dep, vals: A.slice(lo, hi + 1) };
      segs.push(node);
      if (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        node.kids = [rec(lo, mid, dep + 1), rec(mid + 1, hi, dep + 1)];
        const [L, R] = node.kids.map(k => k.sorted); let i = 0, j = 0, c = 0; const out = [];
        while (i < L.length && j < R.length) { c++; out.push(L[i] <= R[j] ? L[i++] : R[j++]); }
        node.sorted = out.concat(L.slice(i), R.slice(j)); node.comps = c; comps += c;
      } else node.sorted = node.vals;
      return node;
    };
    rec(0, A.length - 1, 0);
    const D = Math.max(...segs.map(s => s.dep));
    const rowSegs = d => segs.filter(s => s.dep === d || (s.dep < d && s.lo === s.hi)).sort((a, b) => a.lo - b.lo);
    const fr = [];
    for (let d = 0; d <= D; d++) fr.push({ A, D, rowSegs, show: { split: d, merge: D }, msg: d === 0 ? `Start with the whole array of ${A.length} elements.` : `Divide level ${d}: split every part with more than one element at mid = ⌊(low+high)/2⌋.` + (d === D ? " Every part now has one element, which is sorted by definition." : "") });
    for (let d = D - 1; d >= 0; d--) {
      const merged = segs.filter(s => s.dep === d && s.kids);
      fr.push({ A, D, rowSegs, show: { split: D, merge: d }, msg: `Merge level ${d}: ${merged.map(s => `[${s.kids[0].sorted.join(" ")}] + [${s.kids[1].sorted.join(" ")}] → ${s.comps} comparisons`).join("; ")}.` + (d === 0 ? ` <b>Sorted.</b> Total comparisons: ${comps}.` : "") });
    }
    return fr;
  },
  render(f) {
    const cell = 30, gap = 16, rh = 50;
    const rows = [];
    for (let d = 0; d <= f.show.split; d++) rows.push({ d, segs: f.rowSegs(d), sorted: false });
    if (f.show.split === f.D) for (let d = f.D - 1; d >= f.show.merge; d--) rows.push({ d, segs: f.rowSegs(d), sorted: true });
    const width = r => r.segs.reduce((s, g) => s + (g.hi - g.lo + 1) * cell, 0) + (r.segs.length - 1) * gap;
    const W = Math.max(...[...Array(f.D + 1).keys()].map(d => width({ segs: f.rowSegs(d) }))) + 40;
    const H = (2 * f.D + 1) * rh + 20;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Merge sort split and merge tree">`;
    const place = r => { const off = (W - width(r)) / 2; let x = off; const m = new Map(); r.segs.forEach(g => { m.set(g, { x, w: (g.hi - g.lo + 1) * cell }); x += (g.hi - g.lo + 1) * cell + gap; }); return m; };
    const placed = rows.map(place);
    rows.forEach((r, ri) => {
      const y = 10 + ri * rh;
      if (ri > 0) {
        const prev = rows[ri - 1], pm = placed[ri - 1];
        r.segs.forEach(g => {
          const me = placed[ri].get(g);
          const parent = !r.sorted ? prev.segs.find(p => p.lo <= g.lo && p.hi >= g.hi) : null;
          if (!r.sorted && parent) { const pp = pm.get(parent); s += `<line class="e" x1="${pp.x + pp.w / 2}" y1="${y - rh + 28}" x2="${me.x + me.w / 2}" y2="${y}"/>`; }
          if (r.sorted) prev.segs.filter(c => c.lo >= g.lo && c.hi <= g.hi).forEach(c => { const pp = pm.get(c); s += `<line class="e ok" style="stroke-width:1.8" x1="${pp.x + pp.w / 2}" y1="${y - rh + 28}" x2="${me.x + me.w / 2}" y2="${y}"/>`; });
        });
      }
      r.segs.forEach(g => {
        const p = placed[ri].get(g), vals = r.sorted || (ri === f.D && f.show.split === f.D && false) ? g.sorted : g.vals;
        const isNewMerge = r.sorted && ri === rows.length - 1;
        vals.forEach((v, k) => s += `<g class="n ${r.sorted ? (isNewMerge ? "done" : "") : (ri === rows.length - 1 && !r.sorted && f.show.split < f.D ? "front" : "")}"><rect x="${p.x + k * cell}" y="${y}" width="${cell}" height="28"/><text class="mono" x="${p.x + k * cell + cell / 2}" y="${y + 19}" text-anchor="middle" style="font-size:13px">${v}</text></g>`);
      });
    });
    return s + `</svg>`;
  }
});

/* ---------- single merge ---------- */
bench("w-merge", {
  build(el) {
    const L = parseNums($("#mg-a", el).value), R = parseNums($("#mg-b", el).value);
    const sorted = a => a.every((x, i) => !i || a[i - 1] <= x);
    if (!sorted(L) || !sorted(R)) throw new Error("Both lists must already be sorted in increasing order.");
    let i = 0, j = 0, c = 0; const out = [], fr = [];
    const snap = (msg, pick) => fr.push({ L, R, i, j, out: [...out], msg, pick });
    snap(`Pointers i and j start at the front of each list.`);
    while (i < L.length && j < R.length) {
      c++;
      if (L[i] <= R[j]) { out.push(L[i]); snap(`Comparison ${c}: ${L[i]} ≤ ${R[j]}, so output ${L[i]} from the left list.`, "L"); i++; }
      else { out.push(R[j]); snap(`Comparison ${c}: ${L[i]} &gt; ${R[j]}, so output ${R[j]} from the right list.`, "R"); j++; }
      fr[fr.length - 1].i = i; fr[fr.length - 1].j = j;
    }
    const rest = i < L.length ? L.slice(i) : R.slice(j);
    out.push(...rest); i = L.length; j = R.length;
    snap(`One list is used up. Copy the rest (${rest.join(", ") || "nothing"}) with no comparisons. Total: <b>${c}</b> comparisons for ${L.length} + ${R.length} elements (maximum possible is ${L.length + R.length - 1}).`);
    return fr;
  },
  render: f => `<p class="panel-title">Left</p>${arr(f.L, f.L.map((_, k) => k < f.i ? "dim" : k === f.i ? "cur" : ""))}
    <p class="panel-title" style="margin-top:10px">Right</p>${arr(f.R, f.R.map((_, k) => k < f.j ? "dim" : k === f.j ? "cur" : ""))}
    <p class="panel-title" style="margin-top:10px">Output</p>${f.out.length ? arr(f.out, f.out.map((_, k) => k === f.out.length - 1 && f.pick ? "ok" : "")) : "<span class='faint'>empty</span>"}`
});

/* ---------- strassen ---------- */
bench("w-strassen", {
  build(el) {
    const a = parseNums($("#st-a", el).value), b = parseNums($("#st-b", el).value);
    if (a.length !== 4 || b.length !== 4) throw new Error("Enter exactly four numbers for each matrix.");
    const [a11, a12, a21, a22] = a, [b11, b12, b21, b22] = b;
    const n = x => x < 0 ? `(${x})` : x;
    const P = [
      ["P", `(A11 + A22)(B11 + B22)`, `(${a11} + ${n(a22)})(${b11} + ${n(b22)})`, (a11 + a22) * (b11 + b22)],
      ["Q", `(A21 + A22) B11`, `(${a21} + ${n(a22)}) · ${n(b11)}`, (a21 + a22) * b11],
      ["R", `A11 (B12 − B22)`, `${a11} · (${b12} − ${n(b22)})`, a11 * (b12 - b22)],
      ["S", `A22 (B21 − B11)`, `${a22} · (${b21} − ${n(b11)})`, a22 * (b21 - b11)],
      ["T", `(A11 + A12) B22`, `(${a11} + ${n(a12)}) · ${n(b22)}`, (a11 + a12) * b22],
      ["U", `(A21 − A11)(B11 + B12)`, `(${a21} − ${n(a11)})(${b11} + ${n(b12)})`, (a21 - a11) * (b11 + b12)],
      ["V", `(A12 − A22)(B21 + B22)`, `(${a12} − ${n(a22)})(${b21} + ${n(b22)})`, (a12 - a22) * (b21 + b22)]
    ];
    const v = Object.fromEntries(P.map(r => [r[0], r[3]]));
    const C = [[v.P + v.S - v.T + v.V, v.R + v.T], [v.Q + v.S, v.P + v.R - v.Q + v.U]];
    const N = [[a11 * b11 + a12 * b21, a11 * b12 + a12 * b22], [a21 * b11 + a22 * b21, a21 * b12 + a22 * b22]];
    const ok = JSON.stringify(C) === JSON.stringify(N);
    const mat = (M, lab) => `<div><p class="panel-title">${lab}</p>${table(null, M)}</div>`;
    $(".out", el).innerHTML = `<div class="row">${mat([[a11, a12], [a21, a22]], "A")}${mat([[b11, b12], [b21, b22]], "B")}${mat(C, "C = A·B (Strassen)")}</div>
      ${table(["", "Formula", "Substituted", "Value"], P.map(r => [{ v: r[0], raw: true }, { v: r[1], raw: true }, { v: r[2], raw: true }, { v: r[3], c: "ok" }]), { cls: "" })}
      ${table(["Entry", "Combination", "Value"], [
      ["C11", `P + S − T + V = ${v.P} + ${n(v.S)} − ${n(v.T)} + ${n(v.V)}`, C[0][0]],
      ["C12", `R + T = ${v.R} + ${n(v.T)}`, C[0][1]],
      ["C21", `Q + S = ${v.Q} + ${n(v.S)}`, C[1][0]],
      ["C22", `P + R − Q + U = ${v.P} + ${n(v.R)} − ${n(v.Q)} + ${n(v.U)}`, C[1][1]]].map(r => r.map(x => ({ v: x, raw: false }))), { cls: "" })}
      <div class="result" style="${ok ? "" : "background:var(--red-soft)"}">${ok ? `Matches ordinary multiplication: 7 multiplications instead of 8.` : "Mismatch with ordinary multiplication (this should never happen)."}</div>`;
  }
});
