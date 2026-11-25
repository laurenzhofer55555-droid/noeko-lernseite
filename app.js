(function () {
  const K = window.KAPITEL, C = window.CHARTS;
  const $ = (s, el = document) => el.querySelector(s);
  const store = {
    get() { try { return JSON.parse(localStorage.getItem("noeko-gewusst") || "{}"); } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem("noeko-gewusst", JSON.stringify(v)); } catch (e) { /* ohne Speicher weiter */ } }
  };
  let done = store.get();
  let idx = 0;
  let params = {};

  const nav = $("#nav"), main = $("#main");

  function fortschritt(c) {
    return c.fragen.filter((_, i) => done[c.id + "-" + i]).length;
  }

  function buildNav() {
    let html = "", mod = 0;
    K.forEach((c, i) => {
      if (c.mod !== mod) {
        if (mod) html += "</ul></section>";
        mod = c.mod;
        html += `<section><h2>Modul ${c.mod}<span>${c.modName}</span></h2><ul>`;
      }
      const n = fortschritt(c), t = c.fragen.length;
      html += `<li><a href="#${c.id}" data-i="${i}" class="${n === t ? "fertig" : ""}"><b>${c.nr}</b><span>${c.title}</span><i>${n}/${t}</i></a></li>`;
    });
    nav.innerHTML = html + "</ul></section>";
  }

  function markNav() {
    nav.querySelectorAll("a").forEach(a => {
      const i = +a.dataset.i, c = K[i];
      a.classList.toggle("aktiv", i === idx);
      a.classList.toggle("fertig", fortschritt(c) === c.fragen.length);
      a.querySelector("i").textContent = fortschritt(c) + "/" + c.fragen.length;
      if (i === idx) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }

  function controlsHtml(def) {
    return (def.controls || []).map(c => {
      if (c.type === "select") {
        return `<label class="ctl"><span>${c.label}</span><select data-id="${c.id}">${c.options.map(o => `<option value="${o[0]}"${o[0] === params[c.id] ? " selected" : ""}>${o[1]}</option>`).join("")}</select></label>`;
      }
      return `<label class="ctl"><span>${c.label}</span><input type="range" data-id="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${params[c.id]}"><output data-out="${c.id}">${c.show(params[c.id])}</output></label>`;
    }).join("");
  }

  function drawChart(c) {
    const def = C[c.nr];
    const box = $("#bild");
    box.innerHTML = def.html ? def.html(params) : window.renderAxes(def.draw(params));
    $("#lesen").innerHTML = def.read(params);
  }

  function render() {
    const c = K[idx], def = C[c.nr];
    params = {};
    (def.controls || []).forEach(x => (params[x.id] = x.value));
    document.title = `VL${String(c.nr).padStart(2, "0")} ${c.title}, Nachhaltige Ökonomie`;
    const prev = K[idx - 1], next = K[idx + 1];

    main.innerHTML = `
      <header class="kopf">
        <p class="kontext">Modul ${c.mod}, ${c.modName}</p>
        <h1><span class="nr">${c.nr}</span>${c.title}</h1>
      </header>
      ${c.audio ? `<section class="hoer" aria-label="Hörbuch"><h2>Hörbuch</h2><audio controls preload="metadata" src="${c.audio}"></audio></section>` : ""}
      <div class="oben">
        <section class="bild" aria-label="Visualisierung">
          <p class="hint">${def.hint}</p>
          <div id="bild" class="canvas"></div>
          <div class="ctls">${controlsHtml(def)}</div>
          <div id="lesen" class="lesen" aria-live="polite"></div>
        </section>
        <section class="merk">
          <h2>Merkpunkte</h2>
          <ul>${c.merk.map(m => `<li>${m}</li>`).join("")}</ul>
        </section>
      </div>
      <section class="fragen">
        <div class="fkopf"><h2>Fragen</h2><p id="stand"></p></div>
        <ol>${c.fragen.map((f, i) => `<li><label><input type="checkbox" data-q="${c.id}-${i}"${done[c.id + "-" + i] ? " checked" : ""}><span class="box"></span><span class="ft">${f}</span></label></li>`).join("")}</ol>
        ${c.pdf ? `<p class="pdf">Weitere Fragen aus der Übung: <a href="${c.pdf}" target="_blank" rel="noopener">Fragen zu Kapitel ${c.nr} als PDF</a></p>` : ""}
      </section>
      <nav class="blatt" aria-label="Kapitel wechseln">
        ${prev ? `<a href="#${prev.id}" class="zurueck"><small>Vorherige Vorlesung</small>${prev.nr} ${prev.title}</a>` : "<span></span>"}
        ${next ? `<a href="#${next.id}" class="weiter"><small>Nächste Vorlesung</small>${next.nr} ${next.title}</a>` : "<span></span>"}
      </nav>`;

    drawChart(c);
    stand();
    markNav();
    window.scrollTo(0, 0);
  }

  function stand() {
    const c = K[idx], n = fortschritt(c);
    $("#stand").textContent = `${n} von ${c.fragen.length} beantwortet`;
  }

  main.addEventListener("input", e => {
    const t = e.target, id = t.dataset.id;
    if (!id) return;
    const def = C[K[idx].nr];
    const ctl = def.controls.find(x => x.id === id);
    params[id] = ctl.type === "select" ? t.value : parseFloat(t.value);
    if (ctl.type !== "select") {
      const out = main.querySelector(`[data-out="${id}"]`);
      if (out) out.textContent = ctl.show(params[id]);
    }
    drawChart(K[idx]);
  });

  main.addEventListener("change", e => {
    const q = e.target.dataset.q;
    if (!q) return;
    if (e.target.checked) done[q] = 1; else delete done[q];
    store.set(done);
    stand();
    markNav();
  });

  function route() {
    const h = location.hash.replace("#", "");
    const i = K.findIndex(c => c.id === h);
    idx = i >= 0 ? i : 0;
    render();
    $("#side").classList.remove("offen");
  }

  document.addEventListener("keydown", e => {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== "checkbox") return;
    if (e.key === "ArrowRight" && K[idx + 1]) location.hash = K[idx + 1].id;
    if (e.key === "ArrowLeft" && K[idx - 1]) location.hash = K[idx - 1].id;
  });

  $("#menue").addEventListener("click", () => $("#side").classList.toggle("offen"));
  buildNav();
  window.addEventListener("hashchange", route);
  route();
})();
