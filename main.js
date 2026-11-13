/* ============================================================
   吧檯筆記 — 共用腳本
   讀取 data/*.json，依 <body data-page="..."> 渲染對應頁面。
   調酒資料一律來自 data/drinks.json，不要寫死在 HTML 裡。
   ============================================================ */

const ROOT = document.body.dataset.root || ".";

const AXES = [
  ["technique", "技法"],
  ["base", "基底"],
  ["family", "家族"],
];

/* ---------- 工具 ---------- */

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadData() {
  const get = async (path) => {
    const res = await fetch(`${ROOT}/${path}`);
    if (!res.ok) throw new Error(`${path}：${res.status}`);
    return res.json();
  };
  const [tags, drinks] = await Promise.all([get("data/tags.json"), get("data/drinks.json")]);
  return { tags, drinks };
}

function showLoadError(target, err) {
  const isFile = location.protocol === "file:";
  target.innerHTML = `
    <div class="load-error">
      <p>讀不到調酒資料（${esc(err.message)}）。</p>
      ${
        isFile
          ? `<p>直接打開 HTML 檔案時瀏覽器會擋下讀取。請在專案資料夾執行 <code>python3 -m http.server 8000</code>，再打開 <code>http://localhost:8000</code>。</p>`
          : `<p>請確認 <code>data/drinks.json</code> 和 <code>data/tags.json</code> 存在，而且是合法的 JSON。</p>`
      }
    </div>`;
}

function lookup(tags, axis, id) {
  return (tags[axis] || []).find((t) => t.id === id) || { id, zh: id };
}

function hasTag(drink, axis, id) {
  return axis === "family" ? drink.family === id : (drink[axis] || []).includes(id);
}

function formatAmount(ing, tags) {
  if (ing.unit === "top") return "補滿";
  if (ing.amount === null || ing.amount === undefined) return "適量";
  return `${ing.amount} ${lookup(tags, "unit", ing.unit).zh}`;
}

/* ---------- 杯子圖示 ----------
   viewBox 為 60 × 80。bowl 是可以裝酒的範圍，top / bottom 是它的上下緣。 */

const GLASSES = {
  rocks: { bowl: "M9 22 H51 L49 73 Q48.8 76 46 76 H14 Q11.2 76 11 73 Z", top: 22, bottom: 76, extra: "" },
  highball: { bowl: "M17 4 H43 L41 74 Q40.9 76 39 76 H21 Q19.1 76 19 74 Z", top: 4, bottom: 76, extra: "" },
  martini: { bowl: "M4 12 H56 L30 46 Z", top: 12, bottom: 46, extra: "M30 46 V75 M19 76 H41" },
  coupe: { bowl: "M5 22 H55 Q55 46 30 48 Q5 46 5 22 Z", top: 22, bottom: 48, extra: "M30 48 V75 M19 76 H41" },
  "nick-and-nora": { bowl: "M12 16 H48 Q48 46 30 48 Q12 46 12 16 Z", top: 16, bottom: 48, extra: "M30 48 V75 M20 76 H40" },
  flute: { bowl: "M22 4 H38 L36.5 48 Q30 53 23.5 48 Z", top: 4, bottom: 51, extra: "M30 51 V75 M21 76 H39" },
};

/** 只有能換算成容量的材料會變成杯中的一層（ml、吧匙）。 */
function layerVolume(ing) {
  if (typeof ing.amount !== "number") return 0;
  if (ing.unit === "ml") return ing.amount;
  if (ing.unit === "barspoon") return ing.amount * 5;
  return 0;
}

/** 回傳每個材料對應的顏色編號（沒有分層的材料為 null）。 */
function layerColors(drink) {
  let n = 0;
  return drink.ingredients.map((ing) => (layerVolume(ing) > 0 ? (n++ % 4) + 1 : null));
}

let glassCount = 0;

function glassSVG(drink, { large = false } = {}) {
  const g = GLASSES[drink.glass] || GLASSES.rocks;
  const id = `bowl-${++glassCount}`;
  const colors = layerColors(drink);
  const total = drink.ingredients.reduce((sum, ing) => sum + layerVolume(ing), 0);
  const fillTop = g.top + (g.bottom - g.top) * 0.18;
  const height = g.bottom - fillTop;

  let y = g.bottom;
  const layers = drink.ingredients
    .map((ing, i) => {
      const vol = layerVolume(ing);
      if (!vol || !total) return "";
      const h = (height * vol) / total;
      y -= h;
      return `<rect x="0" y="${y.toFixed(2)}" width="60" height="${(h + 0.3).toFixed(2)}" style="fill: var(--pour-${colors[i]})"></rect>`;
    })
    .join("");

  return `
    <svg class="glass${large ? " glass--large" : ""}" viewBox="0 0 60 80" role="img" aria-label="${esc(drink.name)} 的材料比例示意">
      <defs><clipPath id="${id}"><path d="${g.bowl}"></path></clipPath></defs>
      <g clip-path="url(#${id})"><g class="liquid">${layers}</g></g>
      <path class="outline" d="${g.bowl}"></path>
      ${g.extra ? `<path class="outline" d="${g.extra}"></path>` : ""}
    </svg>`;
}

/* ---------- 首頁 ---------- */

function renderIndex({ tags, drinks }) {
  const filtersEl = document.getElementById("filters");
  const resultEl = document.getElementById("result-bar");
  const listEl = document.getElementById("drink-list");
  const techEl = document.getElementById("technique-index");

  const params = new URLSearchParams(location.search);
  const state = {};
  for (const [axis] of AXES) {
    const value = params.get(axis);
    state[axis] = tags[axis].some((t) => t.id === value) ? value : null;
  }

  const matches = (drink, st) => AXES.every(([axis]) => !st[axis] || hasTag(drink, axis, st[axis]));
  const countWith = (axis, id) => drinks.filter((d) => matches(d, { ...state, [axis]: id })).length;

  function chip(axis, id, label, count) {
    const pressed = state[axis] === id;
    return `<button type="button" class="chip${count === 0 ? " is-empty" : ""}" data-axis="${axis}" data-id="${id ?? ""}" aria-pressed="${pressed}">${esc(label)}<span class="count">${count}</span></button>`;
  }

  function draw() {
    filtersEl.innerHTML = AXES.map(
      ([axis, label]) => `
        <div class="filter-row" role="group" aria-label="${label}">
          <span class="filter-label">${label}</span>
          <div class="chips">
            ${chip(axis, null, "全部", countWith(axis, null))}
            ${tags[axis].map((t) => chip(axis, t.id, t.zh, countWith(axis, t.id))).join("")}
          </div>
        </div>`
    ).join("");

    const list = drinks.filter((d) => matches(d, state));
    const filtered = AXES.some(([axis]) => state[axis]);
    resultEl.innerHTML = `
      <span>${filtered ? `符合條件的調酒 ${list.length} 杯` : `共 ${list.length} 杯調酒`}</span>
      ${filtered ? `<button type="button" class="text-btn" data-clear>清除篩選</button>` : ""}`;

    listEl.innerHTML = list.length
      ? list.map((d) => drinkRow(d, tags)).join("")
      : `<li class="empty">沒有符合條件的調酒。換一個分類，或按「清除篩選」。</li>`;

    const next = new URLSearchParams();
    for (const [axis] of AXES) if (state[axis]) next.set(axis, state[axis]);
    const qs = next.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }

  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state[btn.dataset.axis] = btn.dataset.id || null;
    draw();
    filtersEl.querySelector(`.chip[data-axis="${btn.dataset.axis}"][data-id="${btn.dataset.id}"]`)?.focus();
  });

  resultEl.addEventListener("click", (e) => {
    if (!e.target.closest("[data-clear]")) return;
    for (const [axis] of AXES) state[axis] = null;
    draw();
  });

  draw();

  const withPages = tags.technique.filter((t) => t.page);
  if (techEl && withPages.length) {
    techEl.hidden = false;
    techEl.querySelector("ul").innerHTML = withPages
      .map((t) => `<li><a href="techniques/${t.id}.html">${esc(t.zh)}</a><p>${esc(t.desc)}</p></li>`)
      .join("");
  }
}

function drinkRow(d, tags) {
  const family = lookup(tags, "family", d.family);
  const chips = [
    ...d.base.map((id) => lookup(tags, "base", id).zh),
    ...d.technique.map((id) => lookup(tags, "technique", id).zh),
  ];
  return `
    <li>
      <a class="drink-link" href="drink.html?d=${encodeURIComponent(d.slug)}">
        <span class="drink-glass" aria-hidden="true">${glassSVG(d)}</span>
        <span class="drink-main">
          <span class="drink-name">${esc(d.name)}</span>
          ${d.name_zh ? `<span class="drink-zh">${esc(d.name_zh)}</span>` : ""}
          <span class="tags">${chips.map((c) => `<span class="tag">${esc(c)}</span>`).join("")}</span>
        </span>
        <span class="drink-family">${esc(family.zh)}家族<small>${esc(family.formula || "")}</small></span>
      </a>
    </li>`;
}

/* ---------- 單杯頁 ---------- */

function renderDrink({ tags, drinks }) {
  const target = document.getElementById("drink");
  const slug = new URLSearchParams(location.search).get("d");
  const d = drinks.find((x) => x.slug === slug);

  if (!d) {
    target.innerHTML = `
      <a class="back" href="index.html">回到所有調酒</a>
      <div class="empty"><p>找不到這杯調酒${slug ? `（${esc(slug)}）` : ""}。請從調酒清單重新選一杯。</p></div>`;
    return;
  }

  document.title = `${d.name}｜吧檯筆記`;
  const family = lookup(tags, "family", d.family);
  const glass = lookup(tags, "glass", d.glass);
  const colors = layerColors(d);

  const tagLinks = [
    ...d.base.map((id) => `<li><a class="tag" href="index.html?base=${id}">${esc(lookup(tags, "base", id).zh)}</a></li>`),
    ...d.technique.map((id) => {
      const t = lookup(tags, "technique", id);
      const href = t.page ? `techniques/${id}.html` : `index.html?technique=${id}`;
      return `<li><a class="tag" href="${href}" title="${esc(t.desc || "")}">${esc(t.zh)}</a></li>`;
    }),
  ].join("");

  const rows = d.ingredients
    .map(
      (ing, i) => `
      <tr>
        <td class="swatch-cell">${colors[i] ? `<span class="swatch" style="background: var(--pour-${colors[i]})"></span>` : ""}</td>
        <td>${esc(ing.item)}${ing.optional ? ` <span class="optional">（可省略）</span>` : ""}</td>
        <td class="amount">${esc(formatAmount(ing, tags))}</td>
      </tr>`
    )
    .join("");

  target.innerHTML = `
    <a class="back" href="index.html">回到所有調酒</a>
    <header class="drink-head">
      <h1>${esc(d.name)}</h1>
      ${d.name_zh ? `<p class="drink-zh">${esc(d.name_zh)}</p>` : ""}
      <p class="family-line"><a href="index.html?family=${d.family}"><strong>${esc(family.zh)}家族</strong></a>　${esc(family.formula || "")}</p>
      <ul class="tags">${tagLinks}</ul>
    </header>

    <section class="spec">
      <div class="spec-glass">
        ${glassSVG(d, { large: true })}
        <p>${esc(glass.zh)}</p>
      </div>
      <div class="spec-body">
        <h2>材料</h2>
        <table class="ingredients"><tbody>${rows}</tbody></table>

        <h2>做法</h2>
        <ol class="steps">${d.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>

        <h2>上桌</h2>
        <dl class="facts">
          <dt>杯型</dt><dd>${esc(glass.zh)}</dd>
          ${d.garnish ? `<dt>裝飾</dt><dd>${esc(d.garnish)}</dd>` : ""}
        </dl>

        ${d.note ? `<p class="note">${esc(d.note)}</p>` : ""}
        <p class="source">配方來源：<a href="${esc(d.source)}" target="_blank" rel="noopener">${esc(d.source)}</a></p>
      </div>
    </section>`;
}

/* ---------- 技法頁：自動列出用到這個技法的調酒 ---------- */

function renderTechnique({ drinks }) {
  const id = document.body.dataset.technique;
  const target = document.getElementById("technique-drinks");
  const list = drinks.filter((d) => d.technique.includes(id));
  target.innerHTML = list.length
    ? `<ul>${list
        .map(
          (d) =>
            `<li><a href="${ROOT}/drink.html?d=${encodeURIComponent(d.slug)}">${esc(d.name)}</a>${
              d.name_zh ? `　<span class="drink-zh">${esc(d.name_zh)}</span>` : ""
            }</li>`
        )
        .join("")}</ul>`
    : `<p class="empty">目前還沒有用到這個技法的調酒。</p>`;
}

/* ---------- 啟動 ---------- */

const PAGES = { index: renderIndex, drink: renderDrink, technique: renderTechnique };

(async () => {
  const render = PAGES[document.body.dataset.page];
  if (!render) return;
  try {
    render(await loadData());
  } catch (err) {
    const target = document.querySelector("[data-error-target]") || document.querySelector("main .wrap");
    showLoadError(target, err);
    console.error(err);
  }
})();
