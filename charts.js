/* Diagramme je Vorlesung. Jede Definition: hint, controls, draw(p) und read(p). */
(function () {
  const W = 440, H = 330, L = 50, R = 424, T = 18, B = 282;
  const X = v => L + (v / 100) * (R - L);
  const Y = v => B - (v / 100) * (B - T);
  const r1 = v => Math.round(v * 10) / 10;
  const r0 = v => Math.round(v);
  const fmt = v => String(r1(v)).replace(".", ",");

  const fn = (f, cls, lab, lx, o = {}) => ({ k: "fn", f, cls, lab, lx, ...o });
  const poly = (pts, cls) => ({ k: "area", pts, cls });
  const dot = (x, y, s, o = {}) => ({ k: "dot", x, y, s, ...o });
  const txt = (x, y, s, o = {}) => ({ k: "text", x, y, s, ...o });
  const seg = (a, b, cls, o = {}) => ({ k: "line", pts: [a, b], cls, ...o });

  const D0 = x => 95 - 0.8 * x;
  const S0 = x => 10 + 0.8 * x;

  function sample(f, x0 = 0, x1 = 100, n = 80) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      pts.push([x, f(x)]);
    }
    return pts;
  }

  /* Zeichnet eine Achsen-Spezifikation als SVG. */
  function renderAxes(spec) {
    let g = "";
    for (let i = 0; i <= 10; i++) {
      const v = i * 10;
      g += `<line class="grid" x1="${X(v)}" y1="${T}" x2="${X(v)}" y2="${B}"/>`;
      g += `<line class="grid" x1="${L}" y1="${Y(v)}" x2="${R}" y2="${Y(v)}"/>`;
    }
    let body = "";
    for (const it of spec.items) {
      if (it.k === "area") {
        body += `<polygon class="area f-${it.cls}" points="${it.pts.map(p => X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join(" ")}"/>`;
      }
    }
    for (const it of spec.items) {
      if (it.k === "fn" || it.k === "line") {
        const pts = it.k === "fn" ? sample(it.f, it.x0 ?? 0, it.x1 ?? 100, it.n ?? 80) : it.pts;
        body += `<polyline class="ln c-${it.cls.split(" ").join(" c-")}" points="${pts.map(p => X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join(" ")}"/>`;
        if (it.lab) {
          let lx, ly;
          if (it.k === "fn") { lx = it.lx; ly = it.f(lx); }
          else { lx = it.lx ?? it.pts[1][0]; ly = it.ly ?? it.pts[1][1]; }
          const cl = it.cls.split(" ")[0];
          body += `<text class="lab t-${cl}" x="${X(lx) + (it.dx ?? 6)}" y="${Y(ly) + (it.dy ?? -6)}">${it.lab}</text>`;
        }
      }
    }
    for (const it of spec.items) {
      if (it.k === "dot") {
        const cx = X(it.x), cy = Y(it.y);
        if (it.guides) {
          body += `<line class="guide" x1="${cx}" y1="${cy}" x2="${cx}" y2="${B}"/><line class="guide" x1="${cx}" y1="${cy}" x2="${L}" y2="${cy}"/>`;
        }
        body += `<circle class="pt${it.ghost ? " ghost" : ""}" cx="${cx}" cy="${cy}" r="${it.small ? 2.6 : 4}"/>`;
        if (it.s) body += `<text class="lab pl${it.ghost ? " ghost" : ""}" x="${cx + (it.dx ?? 7)}" y="${cy + (it.dy ?? -7)}">${it.s}</text>`;
      } else if (it.k === "text") {
        body += `<text class="lab t-${it.cls || "k"}" x="${X(it.x)}" y="${Y(it.y)}" text-anchor="${it.anchor || "start"}">${it.s}</text>`;
      }
    }
    const ax = `<line class="axis" x1="${L}" y1="${T - 4}" x2="${L}" y2="${B}"/><line class="axis" x1="${L}" y1="${B}" x2="${R + 4}" y2="${B}"/>` +
      `<text class="axl" x="${R}" y="${B + 22}" text-anchor="end">${spec.x}</text>` +
      `<text class="axl" x="6" y="10">${spec.y}</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${spec.aria || "Diagramm"}"><defs><clipPath id="cp"><rect x="${L}" y="${T - 4}" width="${R - L + 4}" height="${B - T + 4}"/></clipPath></defs>${g}<g clip-path="url(#cp)">${body}</g>${ax}</svg>`;
  }

  const ax = (x, y, items, aria) => ({ x, y, items, aria });

  /* ---------- Diagramme ---------- */
  const C = {};

  C[1] = {
    hint: "Wähle eine Säule und sieh, was sie verlangt.",
    controls: [{ id: "f", type: "select", label: "Säule", options: [["alle", "Alle drei"], ["oek", "ökologisch"], ["soz", "sozial"], ["wir", "ökonomisch"]], value: "alle" }],
    html(p) {
      const on = k => (p.f === "alle" || p.f === k ? 1 : 0.18);
      const txtMap = {
        alle: "Nachhaltig ist, was alle drei Säulen zugleich trägt. Hans Carlowitz forderte schon 1713, nur so viel Holz zu schlagen, wie nachwächst.",
        oek: "Natur und Ressourcen nur im Maß ihrer Erneuerung nutzen. Carlowitz und das Holz.",
        soz: "Gerechte Teilhabe, heute und für künftige Generationen. Brundtland 1987.",
        wir: "Wirtschaften, das dauerhaft trägt. Knappheit, Anreize und Effizienz bleiben der Maßstab."
      };
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Drei Säulen der Nachhaltigkeit">
        <circle class="venn v-g" style="opacity:${on("oek")}" cx="170" cy="130" r="92"/>
        <circle class="venn v-d" style="opacity:${on("soz")}" cx="270" cy="130" r="92"/>
        <circle class="venn v-a" style="opacity:${on("wir")}" cx="220" cy="214" r="92"/>
        <text class="lab big" x="128" y="108" text-anchor="middle">ökologisch</text>
        <text class="lab big" x="312" y="108" text-anchor="middle">sozial</text>
        <text class="lab big" x="220" y="262" text-anchor="middle">ökonomisch</text>
        <text class="lab mid" x="220" y="160" text-anchor="middle">nachhaltig</text></svg>
        <p class="venn-note">${txtMap[p.f]}</p>`;
    },
    read: () => ""
  };

  C[2] = {
    hint: "Verschiebe Nachfrage und Angebot. Was passiert mit Preis und Menge?",
    controls: [
      { id: "d", label: "Nachfrage verschieben", min: -25, max: 25, step: 1, value: 0, show: v => (v > 0 ? "rechts" : v < 0 ? "links" : "keine") },
      { id: "s", label: "Angebot verschieben", min: -25, max: 25, step: 1, value: 0, show: v => (v > 0 ? "rechts" : v < 0 ? "links" : "keine") }
    ],
    draw(p) {
      const D1 = x => 95 - 0.8 * (x - p.d), S1 = x => 10 + 0.8 * (x - p.s);
      const x0 = 85 / 1.6, y0 = D0(x0);
      const x1 = (85 + 0.8 * p.d + 0.8 * p.s) / 1.6, y1 = D1(x1);
      return ax("Menge", "Preis", [
        fn(D0, "d ghost"), fn(S0, "s ghost"),
        fn(D1, "d", "D", 90), fn(S1, "s", "S", 88),
        dot(x0, y0, "E1", { ghost: true }), dot(x1, y1, "E2", { guides: true })
      ], "Angebot und Nachfrage");
    },
    read(p) {
      const x0 = 85 / 1.6, x1 = (85 + 0.8 * p.d + 0.8 * p.s) / 1.6;
      const y0 = D0(x0), y1 = 95 - 0.8 * (x1 - p.d);
      const dir = (a, b) => (Math.abs(b - a) < 0.5 ? "unverändert" : b > a ? "höher" : "niedriger");
      let m = "";
      if (p.d && p.s) m = p.d * p.s > 0 ? "Gleiche Richtung: die Menge ist eindeutig, der Preis hängt von der Stärke ab." : "Gegenläufig: der Preis ist eindeutig, die Menge hängt von der Stärke ab.";
      return `<p>Menge ${dir(x0, x1)}, Preis ${dir(y0, y1)}.</p><p>${m}</p>`;
    }
  };

  C[3] = {
    hint: "Mache die Nachfragekurve steiler oder flacher. Wo kippt der Erlös?",
    controls: [{ id: "k", label: "Steigung der Kurve", min: 0.3, max: 3, step: 0.1, value: 0.8, show: v => fmt(v) }],
    draw(p) {
      const f = x => 50 - p.k * (x - 50);
      return ax("Menge", "Preis", [
        seg([50, 0], [50, 50], "x dash"), seg([0, 50], [50, 50], "x dash"),
        fn(f, "d", "D", 90), dot(50, 50, "", {})
      ], "Nachfragekurve und Elastizität");
    },
    read(p) {
      const e = 1 / p.k;
      const t = Math.abs(e - 1) < 0.06 ? "einheitselastisch: der Erlös bleibt gleich" : e > 1 ? "elastisch: steigt der Preis, sinkt der Erlös" : "unelastisch: steigt der Preis, steigt der Erlös";
      return `<p>Elastizität im Punkt: ${fmt(e)}.</p><p>Die Nachfrage ist ${t}.</p>`;
    }
  };

  C[4] = {
    hint: "Führe eine Steuer ein. Wer trägt sie, und was geht verloren?",
    controls: [
      { id: "t", label: "Steuer je Stück", min: 0, max: 30, step: 1, value: 15, show: v => v },
      { id: "sl", label: "Steigung des Angebots", min: 0.3, max: 2, step: 0.1, value: 0.8, show: v => fmt(v) }
    ],
    draw(p) {
      const S = x => 52.5 + p.sl * (x - 53.125);
      const xn = (42.5 + 53.125 * p.sl - p.t) / (0.8 + p.sl);
      const pb = D0(xn), ps = pb - p.t, xe = 53.125;
      return ax("Menge", "Preis", [
        poly([[0, ps], [xn, ps], [xn, pb], [0, pb]], "a"),
        poly([[xn, pb], [xn, ps], [xe, 52.5]], "s"),
        fn(D0, "d", "D", 92), fn(S, "s ghost"), fn(x => S(x) + p.t, "s", "S + Steuer", 78),
        dot(xe, 52.5, "E1", { ghost: true }), dot(xn, pb, "", { small: true }), dot(xn, ps, "", { small: true })
      ], "Steuer im Markt");
    },
    read(p) {
      const xn = (42.5 + 53.125 * p.sl - p.t) / (0.8 + p.sl);
      const pb = D0(xn), xe = 53.125;
      const kaeufer = p.t ? ((pb - 52.5) / p.t) * 100 : 0;
      return `<p>Einnahmen (Rechteck): ${r0(xn * p.t)}. Zusatzlast (Dreieck): ${r0(0.5 * p.t * (xe - xn))}.</p><p>Käufer tragen ${r0(kaeufer)} Prozent der Steuer, Verkäufer ${r0(100 - kaeufer)} Prozent. Die unelastischere Seite trägt mehr.</p>`;
    }
  };

  C[5] = {
    hint: "Setze einen Preis. Wo ist die Rente am größten?",
    controls: [{ id: "p", label: "Preis", min: 25, max: 80, step: 0.5, value: 52.5, show: v => fmt(v) }],
    draw(p) {
      const qd = (95 - p.p) / 0.8, qs = (p.p - 10) / 0.8, q = Math.min(qd, qs);
      const items = [
        poly([[0, 95], [q, D0(q)], [q, p.p], [0, p.p]], "d"),
        poly([[0, p.p], [q, p.p], [q, S0(q)], [0, 10]], "s")
      ];
      if (q < 53.12) items.push(poly([[q, D0(q)], [q, S0(q)], [53.125, 52.5]], "k"));
      items.push(fn(D0, "d", "D", 92), fn(S0, "s", "S", 90), seg([0, p.p], [100, p.p], "g dash"));
      items.push(txt(10, 72, "Konsumentenrente", { cls: "d" }), txt(6, 24, "Produzentenrente", { cls: "s" }));
      return ax("Menge", "Preis", items, "Konsumenten und Produzentenrente");
    },
    read(p) {
      const qd = (95 - p.p) / 0.8, qs = (p.p - 10) / 0.8, q = Math.min(qd, qs);
      const kr = ((95 - p.p) + (D0(q) - p.p)) / 2 * q, pr = ((p.p - 10) + (p.p - S0(q))) / 2 * q;
      const max = 42.5 * 53.125;
      const ges = kr + pr;
      return `<p>Konsumentenrente ${r0(kr)}, Produzentenrente ${r0(pr)}, zusammen ${r0(ges)}.</p><p>${max - ges > 1 ? "Verlorene Rente: " + r0(max - ges) + " (graues Dreieck)." : "Im Gleichgewicht ist die Gesamtrente am größten."}</p>`;
    }
  };

  const AVC = x => 14 + 0.002 * x * x, MC = x => 14 + 0.006 * x * x;
  C[6] = {
    hint: "Ändere die Fixkosten. Welche Kurve bewegt sich, welche nicht?",
    controls: [{ id: "F", label: "Fixkosten", min: 100, max: 800, step: 50, value: 400, show: v => v }],
    draw(p) {
      const ATC = x => AVC(x) + p.F / x;
      const xs = Math.cbrt(p.F / 0.004);
      return ax("Menge", "Kosten je Stück", [
        fn(MC, "s", "MC", 90, { x0: 0, x1: 100 }),
        fn(ATC, "a", "ATC", 86, { x0: 4, x1: 100, n: 140 }),
        fn(AVC, "k", "AVC", 90, { dy: 12 }),
        dot(xs, ATC(xs), "Minimum ATC", { guides: true, dx: 8, dy: -10 })
      ], "Kostenkurven");
    },
    read(p) {
      const xs = Math.cbrt(p.F / 0.004);
      return `<p>MC schneidet ATC im Minimum bei Menge ${r0(xs)} und Kosten ${fmt(MC(xs))}.</p><p>Höhere Fixkosten verschieben nur ATC, MC und AVC bleiben.</p>`;
    }
  };

  C[7] = {
    hint: "Ändere den Marktpreis. Wann produziert die Firma, wann steigt sie aus?",
    controls: [{ id: "p", label: "Marktpreis", min: 8, max: 60, step: 1, value: 40, show: v => v }],
    draw(p) {
      const F = 400, ATC = x => AVC(x) + F / x;
      const xs = p.p > 14 ? Math.sqrt((p.p - 14) / 0.006) : 0;
      const items = [];
      if (xs > 0) items.push(poly([[0, ATC(xs)], [xs, ATC(xs)], [xs, p.p], [0, p.p]], p.p >= ATC(xs) ? "g" : "s"));
      items.push(fn(MC, "s", "MC", 88), fn(ATC, "a", "ATC", 88, { x0: 4, n: 140, dy: -8 }), fn(AVC, "k", "AVC", 92, { dy: 12 }), seg([0, p.p], [100, p.p], "g dash", { lab: "P = MR", lx: 6, ly: p.p, dx: 4, dy: -6 }));
      if (xs > 0) items.push(dot(xs, p.p, "Optimum", { guides: true, dy: -10 }));
      return ax("Menge", "Preis und Kosten", items, "Firma im Wettbewerb");
    },
    read(p) {
      const F = 400, xs = p.p > 14 ? Math.sqrt((p.p - 14) / 0.006) : 0;
      let t;
      if (p.p < 14) t = "Der Preis liegt unter der minimalen AVC (14). Die Firma legt still.";
      else if (p.p < 26.9) t = "Der Preis deckt die variablen, aber nicht alle Kosten. Kurzfristig weiter produzieren, langfristig austreten.";
      else t = "Der Preis liegt über der minimalen ATC (27). Die Firma macht Gewinn, neue Anbieter treten ein.";
      const gew = xs ? (p.p - (AVC(xs) + F / xs)) * xs : 0;
      return `<p>${t}</p><p>Menge beim Optimum: ${r0(xs)}. ${xs ? "Gewinn: " + r0(gew) + "." : ""}</p>`;
    }
  };

  C[8] = {
    hint: "Ändere Einkommen und Preis. Was verschiebt, was dreht die Budgetgerade?",
    controls: [
      { id: "I", label: "Einkommen", min: 40, max: 160, step: 10, value: 100, show: v => v },
      { id: "pa", label: "Preis von Gut A", min: 1.6, max: 4, step: 0.2, value: 2, show: v => fmt(v) }
    ],
    draw(p) {
      return ax("Gut A", "Gut B", [
        seg([0, 50], [50, 0], "x dash"),
        seg([0, p.I / 2], [p.I / p.pa, 0], "d", { lab: "Budgetgerade", lx: Math.max(6, (p.I / p.pa) / 2 - 10), ly: p.I / 4, dx: 8, dy: -8 })
      ], "Budgetgerade");
    },
    read(p) {
      return `<p>Höchstmenge A: ${fmt(p.I / p.pa)}, Höchstmenge B: ${fmt(p.I / 2)}.</p><p>Preis von B ist fest bei 2. Die Steigung ist ${fmt(p.pa / 2)}, das relative Preisverhältnis.</p>`;
    }
  };

  C[9] = {
    hint: "Ändere den Preis von A. Wo liegt das Optimum?",
    controls: [{ id: "pa", label: "Preis von Gut A", min: 1, max: 4, step: 0.1, value: 2, show: v => fmt(v) }],
    draw(p) {
      const a = 50 / p.pa, b = 25, U = a * b;
      return ax("Gut A", "Gut B", [
        fn(x => 625 / x, "x ghost", "", 0, { x0: 8, n: 100 }), seg([0, 50], [50, 0], "x dash"),
        fn(x => U / x, "g", "Indifferenzkurve", 62, { x0: 5, n: 120, dy: -10 }),
        seg([0, 50], [100 / p.pa, 0], "d", { lab: "Budget", lx: 10, ly: 50 - 10 * p.pa / 2, dx: 8, dy: -4 }),
        dot(a, b, "Optimum", { guides: true, dx: 8, dy: -9 })
      ], "Konsumoptimum");
    },
    read(p) {
      return `<p>Bündel im Optimum: ${fmt(50 / p.pa)} von A, 25 von B.</p><p>Die Grenzrate der Substitution entspricht dem Preisverhältnis ${fmt(p.pa / 2)}.</p>`;
    }
  };

  C[10] = {
    hint: "Ändere den Lohn. Wie viele Arbeiter stellt die Firma ein?",
    controls: [{ id: "w", label: "Lohn", min: 10, max: 80, step: 1, value: 40, show: v => v }],
    draw(p) {
      const L1 = (90 - p.w) / 0.8;
      return ax("Arbeiter", "Wert und Lohn", [
        poly([[0, 90], [L1, p.w], [0, p.w]], "g"),
        fn(x => 90 - 0.8 * x, "d", "VMPL", 80),
        seg([0, p.w], [100, p.w], "s dash", { lab: "Lohn", lx: 92, ly: p.w, dx: 0, dy: -6 }),
        dot(L1, p.w, "", { guides: true })
      ], "Arbeitsnachfrage");
    },
    read(p) {
      return `<p>Die Firma stellt ${r0((90 - p.w) / 0.8)} Arbeiter ein.</p><p>Sie stellt ein, bis der Wert des Grenzprodukts (VMPL gleich Preis mal MPL) dem Lohn entspricht.</p>`;
    }
  };

  C[11] = {
    hint: "Ändere die Grenzkosten. Vergleiche Monopol und Wettbewerb.",
    controls: [{ id: "c", label: "Höhe der Grenzkosten", min: 5, max: 40, step: 1, value: 20, show: v => v }],
    draw(p) {
      const Dm = x => 95 - 0.9 * x, MR = x => 95 - 1.8 * x, MCm = x => p.c + 0.4 * x;
      const qm = (95 - p.c) / 2.2, pm = Dm(qm), qc = (95 - p.c) / 1.3, pc = Dm(qc);
      return ax("Menge", "Preis", [
        poly([[qm, pm], [qm, MCm(qm)], [qc, pc]], "k"),
        fn(Dm, "d", "D", 90), fn(MR, "x dash", "MR", 40, { dy: 14 }), fn(MCm, "s", "MC", 88),
        dot(qm, pm, "Monopol", { guides: true, dx: 8, dy: -9 }), dot(qm, MCm(qm), "", { small: true }), dot(qc, pc, "Wettbewerb", { dx: 8, dy: 18 })
      ], "Monopol");
    },
    read(p) {
      const qm = (95 - p.c) / 2.2, qc = (95 - p.c) / 1.3;
      return `<p>Monopol: Menge ${r0(qm)}, Preis ${r0(95 - 0.9 * qm)}. Wettbewerb: Menge ${r0(qc)}, Preis ${r0(95 - 0.9 * qc)}.</p><p>Das graue Dreieck ist der Nettowohlfahrtsverlust. Das Monopol produziert, wo MR gleich MC.</p>`;
    }
  };

  C[12] = {
    hint: "Wähle die Strategie von Firma A. Was ist die beste Antwort von B?",
    controls: [{ id: "a", type: "select", label: "Firma A wählt", options: [["", "noch offen"], ["n", "niedrige Menge"], ["h", "hohe Menge"]], value: "" }],
    html(p) {
      const pay = { nn: [10, 10], nh: [4, 12], hn: [12, 4], hh: [6, 6] };
      const best = p.a === "n" ? "nh" : p.a === "h" ? "hh" : null;
      const cell = (k) => {
        const [a, b] = pay[k];
        const cls = (k === "hh" ? " nash" : "") + (k === best ? " best" : "");
        return `<td class="${cls}"><span class="pa">${a}</span><span class="pb">${b}</span></td>`;
      };
      const note = p.a === "" ? "Beide wählen hohe Menge, obwohl beide mit niedriger Menge besser stünden. Das ist das Nash-Gleichgewicht." : p.a === "n" ? "Wählt A niedrig, antwortet B mit hoch (12 statt 10)." : "Wählt A hoch, antwortet B mit hoch (6 statt 4). Hoch ist für beide dominant.";
      return `<div class="matrix"><table><thead><tr><th></th><th colspan="2" class="colh">Firma B</th></tr><tr><th></th><th>niedrig</th><th>hoch</th></tr></thead>
      <tbody><tr><th class="rowh">A niedrig</th>${cell("nn")}${cell("nh")}</tr><tr><th class="rowh">A hoch</th>${cell("hn")}${cell("hh")}</tr></tbody></table>
      <p class="mnote"><span class="pa">Gewinn A</span> <span class="pb">Gewinn B</span></p></div><p class="venn-note">${note}</p>`;
    },
    read: () => ""
  };

  C[13] = {
    hint: "Verschiebe die Nachfrage nach dem eigenen Produkt. Wohin führt der Zutritt neuer Anbieter?",
    controls: [{ id: "a", label: "Nachfrage nach dem Produkt", min: 55, max: 95, step: 1, value: 85, show: v => (v <= 64 ? "niedrig" : v >= 85 ? "hoch" : "mittel") }],
    draw(p) {
      const Dn = x => p.a - 0.8 * x, ATC = x => 20 + 600 / x, x1 = (p.a - 20) / 1.6, pr = Dn(x1);
      return ax("Menge", "Preis und Kosten", [
        poly([[0, ATC(x1)], [x1, ATC(x1)], [x1, pr], [0, pr]], pr >= ATC(x1) - 0.3 ? "g" : "s"),
        fn(Dn, "d", "D", 82), fn(x => p.a - 1.6 * x, "x dash", "MR", 30, { dy: 14 }), seg([0, 20], [100, 20], "s", { lab: "MC", lx: 92, ly: 20, dx: 0, dy: -6 }),
        fn(ATC, "a", "ATC", 86, { x0: 7, n: 140, dy: -10 }), dot(x1, pr, "", { guides: true })
      ], "Monopolistische Konkurrenz");
    },
    read(p) {
      const x1 = (p.a - 20) / 1.6, pr = p.a - 0.8 * x1, atc = 20 + 600 / x1, g = (pr - atc) * x1;
      let t = Math.abs(g) < 15 ? "Gewinn null: D berührt ATC, die Anbieter bleiben im Gleichgewicht." : g > 0 ? "Gewinn lockt neue Anbieter an. D wandert nach links." : "Verlust treibt Anbieter aus dem Markt. D wandert nach rechts.";
      return `<p>${t}</p><p>Der Preis (${r0(pr)}) liegt über den Grenzkosten (20). Dafür gibt es Vielfalt.</p>`;
    }
  };

  C[14] = {
    hint: "Senke den Weltmarktpreis. Wer gewinnt, wer verliert?",
    controls: [{ id: "w", label: "Weltmarktpreis", min: 20, max: 52, step: 1, value: 35, show: v => v }],
    draw(p) {
      const pa = 52.5, qa = 53.125, qd = (95 - p.w) / 0.8, qs = (p.w - 10) / 0.8;
      return ax("Menge", "Preis", [
        poly([[0, pa], [qa, pa], [qd, p.w], [0, p.w]], "d"),
        poly([[qs, p.w], [qa, pa], [0, pa], [0, p.w]], "s"),
        poly([[qs, p.w], [qa, pa], [qd, p.w]], "g"),
        fn(D0, "d", "D", 92), fn(S0, "s", "S", 90),
        seg([0, p.w], [100, p.w], "g dash", { lab: "Weltmarktpreis", lx: 70, ly: p.w, dx: 0, dy: -6 }),
        seg([0, pa], [qa, pa], "x dash", { lab: "Autarkie", lx: 2, ly: pa, dx: 2, dy: -5 })
      ], "Importfall");
    },
    read(p) {
      const qd = (95 - p.w) / 0.8, qs = (p.w - 10) / 0.8;
      return `<p>Importe: ${r0(qd - qs)} Stück.</p><p>Blau: Konsumenten gewinnen. Rot: Produzenten verlieren. Grün: der Nettogewinn des Landes ist positiv.</p>`;
    }
  };

  C[15] = {
    hint: "Füge externe Kosten hinzu. Wie weit liegt der Markt vom Optimum entfernt?",
    controls: [{ id: "e", label: "Externe Grenzkosten", min: 0, max: 40, step: 1, value: 25, show: v => v }],
    draw(p) {
      const xs = (85 - p.e) / 1.6, xm = 53.125, ds = D0(xs);
      return ax("Menge", "Preis und Kosten", [
        poly([[xs, ds], [xm, 52.5], [xm, S0(xm) + p.e]], "k"),
        fn(D0, "d", "D", 92), fn(S0, "s", "MPC", 88), fn(x => S0(x) + p.e, "s dash", "MSC", 70, { dy: -8 }),
        dot(xm, 52.5, "Markt", { dx: 8, dy: 15 }), dot(xs, ds, "Optimum", { guides: true, dx: -4, dy: -10 })
      ], "Negative Externalität");
    },
    read(p) {
      return `<p>Markt: Menge ${r0(53.125)}. Gesellschaftliches Optimum: Menge ${r0((85 - p.e) / 1.6)}.</p><p>Eine Pigou-Steuer von ${p.e} je Einheit bringt den Markt ins Optimum. Optimum heißt nicht null Verschmutzung.</p>`;
    }
  };

  C[16] = {
    hint: "Wähle ein Gut und sieh, wo es in der Tafel liegt.",
    controls: [{ id: "g", type: "select", label: "Beispiel", options: [["", "keins"], ["brot", "Brot"], ["fisch", "Fischbestand im Meer"], ["netflix", "Netflix"], ["leucht", "Leuchtturm"]], value: "" }],
    html(p) {
      const hit = k => (p.g === k ? " hit" : "");
      return `<div class="matrix goods"><table><thead><tr><th></th><th>rivalisierend</th><th>nicht rivalisierend</th></tr></thead><tbody>
      <tr><th class="rowh">ausschließbar</th><td class="${hit("brot")}"><b>Privatgut</b><span>Brot</span></td><td class="${hit("netflix")}"><b>Klubgut</b><span>Netflix</span></td></tr>
      <tr><th class="rowh">nicht ausschließbar</th><td class="${hit("fisch")}"><b>Allmendegut</b><span>Fischbestand</span></td><td class="${hit("leucht")}"><b>Öffentliches Gut</b><span>Leuchtturm</span></td></tr></tbody></table></div>
      <p class="venn-note">${{ "": "Zwei Fragen genügen: Kann man Nichtzahler ausschließen? Schmälert mein Konsum den Konsum anderer?", brot: "Wer nicht zahlt, bekommt kein Brot. Und jedes Brot gibt es nur einmal.", fisch: "Jeder darf fischen, aber jeder gefangene Fisch fehlt den anderen. Die Folge ist Übernutzung.", netflix: "Nichtzahler lassen sich sperren, ein weiterer Zuschauer kostet fast nichts.", leucht: "Kein Schiff lässt sich ausschließen, und sein Licht wird nicht weniger. Trittbrettfahrer sind die Folge." }[p.g]}</p>`;
    },
    read: () => ""
  };

  C[17] = {
    hint: "Ändere die Stärke der Schwankung. Wann ist es eine Rezession?",
    controls: [{ id: "a", label: "Stärke der Schwankung", min: 6, max: 28, step: 1, value: 16, show: v => v }],
    draw(p) {
      const f = x => 45 + 0.12 * x + p.a * Math.sin((x / 100) * 4 * Math.PI);
      const t = x => 45 + 0.12 * x;
      return ax("Zeit", "Reales BIP", [
        fn(t, "x dash", "Trend", 82, { dy: 16 }), fn(f, "d", "", 0, { n: 160 }),
        dot(12.5, f(12.5), "Hochpunkt", { small: true, dx: -20, dy: -9 }), dot(37.5, f(37.5), "Tiefpunkt", { small: true, dx: -20, dy: 16 }),
        dot(62.5, f(62.5), "Hochpunkt", { small: true, dx: -20, dy: -9 }), dot(87.5, f(87.5), "Tiefpunkt", { small: true, dx: -20, dy: 16 }),
        txt(25, f(25) + 3, "Rezession", { cls: "s", anchor: "start" }), txt(50, f(50) - 10, "Expansion", { cls: "g", anchor: "start" })
      ], "Konjunkturzyklus");
    },
    read: () => "<p>Eine Rezession liegt vor, wenn die Produktion mindestens zwei Quartale in Folge sinkt. Eine Expansion beginnt am Tiefpunkt.</p>"
  };

  C[18] = {
    hint: "Mache die Verteilung ungleicher. Wie verändert sich der Gini?",
    controls: [{ id: "k", label: "Ungleichheit", min: 1, max: 6, step: 0.1, value: 2, show: v => fmt(v) }],
    draw(p) {
      const f = x => 100 * Math.pow(x / 100, p.k);
      const pts = sample(x => x, 0, 100, 60).concat(sample(f, 100, 0, 60));
      return ax("Anteil der Haushalte", "Anteil am Einkommen", [
        poly(pts, "a"), seg([0, 0], [100, 100], "x dash", { lab: "Gleichverteilung", lx: 55, ly: 55, dx: -8, dy: -10 }),
        fn(f, "d", "Lorenzkurve", 82, { n: 120, dy: 16 })
      ], "Lorenzkurve");
    },
    read(p) {
      const g = ((p.k - 1) / (p.k + 1)).toFixed(2).replace(".", ",");
      return `<p>Gini-Koeffizient: ${g}. Die untere Hälfte der Haushalte erhält ${r0(100 * Math.pow(0.5, p.k))} Prozent des Einkommens.</p><p>Der Gini ist die gelbe Fläche im Verhältnis zur Fläche unter der Diagonalen.</p>`;
    }
  };

  C[19] = {
    hint: "Verändere die Komponenten. Wie groß wird das BIP?",
    controls: [
      { id: "c", label: "Konsum C", min: 1000, max: 3000, step: 100, value: 2000, show: v => v },
      { id: "i", label: "Investitionen I", min: 200, max: 1000, step: 100, value: 600, show: v => v },
      { id: "g", label: "Staat G", min: 300, max: 1200, step: 100, value: 800, show: v => v },
      { id: "x", label: "Exporte X", min: 300, max: 1500, step: 100, value: 900, show: v => v },
      { id: "m", label: "Importe IM", min: 300, max: 1500, step: 100, value: 700, show: v => v }
    ],
    html(p) {
      const rows = [["C", p.c, "d"], ["I", p.i, "g"], ["G", p.g, "a"], ["X", p.x, "k"]];
      const sc = 350 / 5000;
      let x = 40, bars = "";
      for (const [n, v, c] of rows) {
        const w = v * sc;
        bars += `<rect class="bar b-${c}" x="${x}" y="70" width="${w}" height="46"/><text class="lab" x="${x + w / 2}" y="98" text-anchor="middle">${n}</text>`;
        x += w;
      }
      const total = p.c + p.i + p.g + p.x;
      const bip = total - p.m, wm = p.m * sc;
      bars += `<rect class="bar b-s" x="${40 + total * sc - wm}" y="130" width="${wm}" height="46"/><text class="lab" x="${40 + total * sc - wm / 2}" y="158" text-anchor="middle">IM</text>`;
      bars += `<rect class="bar b-out" x="40" y="214" width="${bip * sc}" height="50"/><text class="lab big" x="${40 + bip * sc / 2}" y="245" text-anchor="middle">BIP ${bip}</text>`;
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="BIP aus Verwendungskomponenten"><text class="axl" x="40" y="54">Ausgaben</text><text class="axl" x="40" y="198">Abzug und Ergebnis</text>${bars}</svg>`;
    },
    read(p) { return `<p>BIP gleich C plus I plus G plus X minus IM gleich ${p.c + p.i + p.g + p.x - p.m}.</p>`; }
  };

  C[20] = {
    hint: "Ändere die Wachstumsrate. Wann hat sich die Wirtschaft verdoppelt?",
    controls: [{ id: "g", label: "Wachstumsrate pro Jahr", min: 1, max: 8, step: 0.5, value: 3.5, show: v => fmt(v) + " Prozent" }],
    draw(p) {
      const Yf = f => ((f - 1) / 7) * 100, f = x => Yf(Math.pow(1 + p.g / 100, x * 0.7));
      const td = 70 / p.g / 0.7;
      return ax("Jahre (0 bis 70)", "Niveau (Faktor)", [
        seg([0, Yf(2)], [100, Yf(2)], "x dash"), seg([0, Yf(4)], [100, Yf(4)], "x dash"),
        txt(1, Yf(2) + 3, "mal 2", { cls: "k" }), txt(1, Yf(4) + 3, "mal 4", { cls: "k" }), txt(1, 96, "mal 8", { cls: "k" }),
        fn(f, "d", "", 0, { n: 140 }), dot(Math.min(td, 100), Yf(2), "Verdopplung", { guides: true, dx: 8, dy: -9 })
      ], "Wachstum");
    },
    read(p) {
      const ex = Math.log(2) / Math.log(1 + p.g / 100);
      return `<p>Siebzigerregel: 70 geteilt durch ${fmt(p.g)} gleich ${fmt(70 / p.g)} Jahre bis zur Verdopplung.</p><p>Exakt gerechnet sind es ${fmt(ex)} Jahre.</p>`;
    }
  };

  C[21] = {
    hint: "Erhöhe das Budgetdefizit. Was passiert mit Zins und Investitionen?",
    controls: [{ id: "g", label: "Budgetdefizit", min: 0, max: 30, step: 1, value: 15, show: v => v }],
    draw(p) {
      const x1 = (85 - 0.8 * p.g) / 1.6, y1 = D0(x1);
      return ax("Kreditvolumen", "Zinssatz", [
        fn(D0, "d", "Investitionen", 70, { dy: -9 }), fn(S0, "s ghost"), fn(x => 10 + 0.8 * (x + p.g), "s", "Sparen", 78, { dy: -8 }),
        dot(53.125, 52.5, "E1", { ghost: true }), dot(x1, y1, "E2", { guides: true })
      ], "Kreditmarkt");
    },
    read(p) {
      const x1 = (85 - 0.8 * p.g) / 1.6;
      return `<p>Der Zins steigt von 52 auf ${r0(D0(x1))}. Das Kreditvolumen fällt um ${r0(53.125 - x1)}.</p><p>Der Staat verdrängt private Investitionen: Crowding out.</p>`;
    }
  };

  C[22] = {
    hint: "Löse einen Nachfrageschock aus. Schalte dann auf lang und sieh die Selbstheilung.",
    controls: [
      { id: "s", label: "Nachfrageschock", min: -15, max: 15, step: 1, value: 10, show: v => (v > 0 ? "positiv" : v < 0 ? "negativ" : "keiner") },
      { id: "t", type: "select", label: "Zeithorizont", options: [["k", "kurzfristig"], ["l", "langfristig"]], value: "k" }
    ],
    draw(p) {
      const AD1 = x => 100 - 0.9 * (x - p.s), lr = p.t === "l";
      const SR = x => 55 + 0.7 * (x - 50) + (lr ? 0.9 * p.s : 0);
      const x1 = lr ? 50 : (80 + 0.9 * p.s) / 1.6, y1 = lr ? 55 + 0.9 * p.s : 55 + 0.7 * (x1 - 50);
      return ax("Reales BIP", "Preisniveau", [
        seg([50, 0], [50, 100], "k", { lab: "LRAS", lx: 50, ly: 94, dx: 6, dy: 0 }),
        fn(x => 100 - 0.9 * x, "d ghost"), fn(x => 55 + 0.7 * (x - 50), "s ghost"),
        fn(AD1, "d", "AD", 90), fn(SR, "s", "SRAS", 88),
        dot(50, 55, "E1", { ghost: true, dx: -22, dy: 14 }), dot(x1, y1, "E2", { guides: true })
      ], "AD AS Modell");
    },
    read(p) {
      const lr = p.t === "l";
      const x1 = lr ? 50 : (80 + 0.9 * p.s) / 1.6, y1 = lr ? 55 + 0.9 * p.s : 55 + 0.7 * (x1 - 50);
      return `<p>${lr ? "Löhne passen sich an, SRAS wandert, die Produktion kehrt zum Potenzial zurück. Nur das Preisniveau bleibt verändert." : "Kurzfristig steigen Produktion und Preisniveau in gleicher Richtung."}</p><p>BIP ${r0(x1)}, Preisniveau ${r0(y1)}.</p>`;
    }
  };

  C[23] = {
    hint: "Erhöhe die Staatsausgaben und die Konsumneigung. Wie groß wird die Wirkung?",
    controls: [
      { id: "g", label: "Mehr Staatsausgaben", min: 10, max: 100, step: 10, value: 40, show: v => v },
      { id: "m", label: "Konsumneigung MPC", min: 0.5, max: 0.9, step: 0.05, value: 0.75, show: v => fmt(v) }
    ],
    html(p) {
      const sc = 330 / Math.max(p.g / (1 - p.m), 1);
      let rows = "", s = 0;
      for (let i = 0; i < 7; i++) {
        const v = p.g * Math.pow(p.m, i); s += v;
        rows += `<rect class="bar b-d" x="60" y="${34 + i * 28}" width="${Math.max(v * sc, 1)}" height="20"/><text class="lab" x="52" y="${49 + i * 28}" text-anchor="end">${i + 1}</text><text class="lab" x="${66 + v * sc}" y="${49 + i * 28}">${r0(v)}</text>`;
      }
      const tot = p.g / (1 - p.m);
      rows += `<rect class="bar b-out" x="60" y="236" width="${tot * sc}" height="26"/><text class="lab big" x="${60 + tot * sc / 2}" y="255" text-anchor="middle">${r0(tot)}</text>`;
      return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Multiplikatorrunden"><text class="axl" x="60" y="20">Zusätzliche Ausgaben je Runde</text><text class="axl" x="60" y="228">Gesamteffekt</text>${rows}</svg>`;
    },
    read(p) { return `<p>Multiplikator gleich 1 geteilt durch (1 minus MPC) gleich ${fmt(1 / (1 - p.m))}. Das BIP steigt um ${r0(p.g / (1 - p.m))}.</p>`; }
  };

  C[25] = {
    hint: "Verändere die Geldmenge. Was geschieht mit dem Zins?",
    controls: [{ id: "m", label: "Geldmenge", min: 30, max: 70, step: 1, value: 60, show: v => v }],
    draw(p) {
      const i1 = D0(p.m), i0 = D0(50);
      return ax("Geldmenge", "Zins", [
        fn(D0, "d", "Geldnachfrage", 82, { dy: -9 }), seg([50, 0], [50, 100], "s ghost"),
        seg([p.m, 0], [p.m, 100], "s", { lab: "Geldangebot", lx: p.m, ly: 96, dx: 6, dy: 0 }),
        dot(50, i0, "E1", { ghost: true }), dot(p.m, i1, "E2", { guides: true })
      ], "Geldmarkt");
    },
    read(p) {
      return `<p>Zins: ${r0(D0(50))} auf ${r0(D0(p.m))}.</p><p>${p.m > 50 ? "Mehr Geld senkt den Zins. Investitionen und AD steigen." : p.m < 50 ? "Weniger Geld hebt den Zins. Investitionen und AD sinken." : "Keine Änderung."}</p>`;
    }
  };

  C[26] = {
    hint: "Hebe die erwartete Inflation an. Was passiert mit der kurzfristigen Phillips Kurve?",
    controls: [{ id: "e", label: "Erwartete Inflation, Anstieg", min: 0, max: 30, step: 1, value: 0, show: v => v }],
    draw(p) {
      const f = x => 50 - 0.9 * (x - 40) + p.e;
      return ax("Arbeitslosigkeit", "Inflation", [
        seg([40, 0], [40, 100], "k", { lab: "Langfristig (NAIRU)", lx: 40, ly: 6, dx: 6, dy: 0 }),
        fn(x => 50 - 0.9 * (x - 40), "s ghost"), fn(f, "s", "Kurzfristig", 70, { dy: -8 }),
        dot(40, 50 + p.e, "", { guides: true })
      ], "Phillips Kurve");
    },
    read(p) {
      return `<p>${p.e ? "Die kurzfristige Kurve wandert nach oben. Bei gleicher Arbeitslosigkeit gibt es mehr Inflation." : "Kurzfristig tauschen sich Inflation und Arbeitslosigkeit gegeneinander."}</p><p>Langfristig ist die Kurve senkrecht bei der NAIRU. Es gibt keinen dauerhaften Zielkonflikt.</p>`;
    }
  };

  C[27] = {
    hint: "Wähle Klassik oder Keynes und verschiebe die Nachfrage.",
    controls: [
      { id: "m", type: "select", label: "Schule", options: [["k", "Klassik"], ["y", "Keynes"]], value: "y" },
      { id: "s", label: "Nachfrageschock", min: -15, max: 15, step: 1, value: 10, show: v => (v > 0 ? "positiv" : v < 0 ? "negativ" : "keiner") }
    ],
    draw(p) {
      const AD1 = x => 100 - 0.9 * (x - p.s), cl = p.m === "k";
      const x1 = cl ? 50 : (80 + 0.9 * p.s) / 1.6, y1 = cl ? 55 + 0.9 * p.s : 55 + 0.7 * (x1 - 50);
      const sras = cl ? seg([50, 0], [50, 100], "s", { lab: "SRAS", lx: 50, ly: 94, dx: 6, dy: 0 }) : fn(x => 55 + 0.7 * (x - 50), "s", "SRAS", 88);
      return ax("Reales BIP", "Preisniveau", [fn(x => 100 - 0.9 * x, "d ghost"), sras, fn(AD1, "d", "AD", 90), dot(x1, y1, "", { guides: true })], "Klassik und Keynes");
    },
    read(p) {
      const cl = p.m === "k";
      return `<p>${cl ? "Klassik: Preise sind flexibel, SRAS ist senkrecht. Ein Nachfrageschock ändert nur das Preisniveau, Politik bewirkt nichts am BIP." : "Keynes: SRAS steigt, ein Nachfrageschock ändert BIP und Preisniveau. Aktive Politik kann stabilisieren."}</p>`;
    }
  };

  window.CHARTS = C;
  window.renderAxes = renderAxes;
})();
