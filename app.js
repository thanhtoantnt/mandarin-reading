const KEY = "mandarin-reading";
const LEVELS = [4, 5, 6];
const GH = "https://github.com/thanhtoantnt/mandarin-reading";

function loadState() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}
function saveState(s) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

const state = Object.assign({ done: [], pinyin: false, english: false }, loadState());
const known = new Set(TEXTS.map((t) => t.id));
state.done = state.done.filter((id) => known.has(id));

function textsAt(level) {
  return TEXTS.filter((t) => t.level === level);
}
function byId(id) {
  return TEXTS.find((t) => t.id === id);
}
function href(path) {
  return window.BASE + path;
}
function route() {
  const p = location.pathname.replace(/\/index\.html$/, "");
  if (/\/hsk4-textbook\/?$/.test(p)) return { kind: "textbook" };
  const m = p.match(/\/hsk([456])\/?$/);
  if (m) return { kind: "level", level: Number(m[1]) };
  if (/\/lesson\/?$/.test(p)) {
    return { kind: "read", id: new URLSearchParams(location.search).get("id") };
  }
  return { kind: "home" };
}

function nav(active) {
  const links = LEVELS.map((n) => {
    const on = active === n ? " active" : "";
    return `<a class="${on}" href="${href("/hsk" + n + "/")}">HSK ${n}</a>`;
  }).join("") +
    `<a class="${active === "tb4" ? " active" : ""}" href="${href("/hsk4-textbook/")}">HSK4 Textbook</a>`;
  return `
    <nav class="nav">
      <div class="nav-inner">
        <div style="display:flex;align-items:center;gap:2rem">
          <a class="brand" href="${href("/")}">
            <span class="gem">◆</span> 读中文
          </a>
          <div class="nav-links">${links}</div>
        </div>
        <a class="nav-gh" href="${GH}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          GitHub
        </a>
      </div>
    </nav>`;
}

function lessonRow(t) {
  const done = state.done.includes(t.id)
    ? `<span class="badge done">Read</span>` : "";
  return `
    <a class="row" href="${href("/lesson/?id=" + t.id)}">
      <div>
        ${done}<span class="badge level">HSK ${t.level}</span>
        <span class="title">${t.title}</span>
      </div>
      <div class="meta">
        <span>${t.titleEn}</span>
        <span>${t.paragraphs.reduce((n, p) => n + p.filter((w) => w.py).length, 0)} words</span>
        <span>source: ${t.source.name}</span>
      </div>
    </a>`;
}

function renderHome() {
  const cards = LEVELS.map((n) => {
    const list = textsAt(n);
    const read = list.filter((t) => state.done.includes(t.id)).length;
    return `
      <a class="stat" href="${href("/hsk" + n + "/")}">
        <div class="label">HSK ${n}</div>
        <div class="value">${list.length}</div>
        <div class="sub">${read} / ${list.length} read</div>
      </a>`;
  }).join("");
  document.getElementById("app").innerHTML = `
    ${nav(null)}
    <div class="wrap">
      <div class="page-head">
        <h1>Mandarin Reading</h1>
        <p>Graded readers for HSK 4, 5, and 6. Tap a word for pinyin and meaning.</p>
      </div>
      <div class="stats">${cards}</div>
      <div class="list">
        <div class="list-head"><h2>All lessons</h2></div>
        <div>${TEXTS.map(lessonRow).join("")}</div>
      </div>
    </div>`;
}

function renderLevel(level) {
  const list = textsAt(level);
  const read = list.filter((t) => state.done.includes(t.id)).length;
  document.getElementById("app").innerHTML = `
    ${nav(level)}
    <div class="wrap">
      <div class="page-head">
        <h1>HSK ${level}</h1>
        <p>${list.length} lessons · ${read} read</p>
      </div>
      <div class="list">
        <div>${list.map(lessonRow).join("")}</div>
      </div>
    </div>`;
}

function isWord(tok) {
  return Boolean(tok.py || tok.en);
}

const QTYPE = { choice: "选词填空", tf: "判断正误", order: "连词成句" };

function renderQuiz(qs) {
  const sec = document.createElement("section");
  sec.className = "quiz";
  const h = document.createElement("h2");
  h.textContent = "练习 · Exercises";
  sec.append(h);
  const scoreEl = document.createElement("p");
  scoreEl.className = "score";
  let done = 0, score = 0;
  const finish = () => {
    if (done === qs.length) scoreEl.textContent = `得分：${score} / ${qs.length}`;
  };

  qs.forEach((q, i) => {
    const box = document.createElement("div");
    box.className = "q";
    box.innerHTML = `
      <div class="q-head"><span class="q-no">第${i + 1}题</span><span class="q-type">${QTYPE[q.type]}</span></div>`;
    if (q.q) {
      const t = document.createElement("p");
      t.className = "q-text";
      t.textContent = q.q;
      box.append(t);
    }

    if (q.type === "order") {
      let finished = false;
      const chosen = [];
      const pool = document.createElement("div");
      pool.className = "chips";
      const line = document.createElement("div");
      line.className = "chips ans";
      const note = document.createElement("p");
      note.className = "note";
      const check = () => {
        if (finished || chosen.length !== q.words.length) return;
        finished = true;
        done++;
        if (chosen.join("") === q.a.join("")) {
          score++;
          line.classList.add("ok");
          note.textContent = "✓ 对";
        } else {
          line.classList.add("no");
          note.textContent = "✗ 正确答案：" + q.a.join("");
        }
        finish();
      };
      const words = q.words.slice();
      do {
        for (let k = words.length - 1; k > 0; k--) {
          const r = Math.floor(Math.random() * (k + 1));
          [words[k], words[r]] = [words[r], words[k]];
        }
      } while (words.join("") === q.a.join(""));
      words.forEach((w) => {
        const c = document.createElement("button");
        c.type = "button";
        c.className = "chip";
        c.textContent = w;
        c.onclick = () => {
          if (finished || c.disabled) return;
          c.disabled = true;
          c.classList.add("used");
          chosen.push(w);
          const a = document.createElement("button");
          a.type = "button";
          a.className = "chip";
          a.textContent = w;
          a.onclick = () => {
            if (finished) return;
            a.remove();
            chosen.splice(chosen.indexOf(w), 1);
            c.disabled = false;
            c.classList.remove("used");
          };
          line.append(a);
          check();
        };
        pool.append(c);
      });
      box.append(pool, line, note);
    } else {
      const opts = q.type === "tf" ? ["对", "不对"] : q.opts;
      const right = q.type === "tf" ? (q.a ? 0 : 1) : q.a;
      const wrap = document.createElement("div");
      wrap.className = "opts";
      opts.forEach((o, j) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "opt";
        b.textContent = o;
        b.onclick = () => {
          if (wrap.classList.contains("done")) return;
          wrap.classList.add("done");
          done++;
          if (j === right) {
            score++;
            b.classList.add("ok");
          } else {
            b.classList.add("no");
            wrap.children[right].classList.add("ok");
          }
          finish();
        };
        wrap.append(b);
      });
      box.append(wrap);
    }
    sec.append(box);
  });
  sec.append(scoreEl);
  return sec;
}

function renderRead(id) {
  const text = byId(id);
  if (!text) {
    location.replace(href("/"));
    return;
  }
  document.body.classList.toggle("pinyin-on", state.pinyin);
  const done = state.done.includes(text.id);
  const sourceNote = text.license === "原创"
    ? `本文为原创阅读，主题来自<a href="${text.source.url}" target="_blank" rel="noopener">${text.source.name}</a>`
    : `本文改写自：<a href="${text.source.url}" target="_blank" rel="noopener">${text.source.name}</a>（${text.license}）— 阅读原文`;
  document.getElementById("app").innerHTML = `
    ${nav(text.level)}
    <div class="wrap narrow">
      <a class="back" href="${href("/hsk" + text.level + "/")}">&larr; HSK ${text.level}</a>
      <div class="toggles">
        <label><input type="checkbox" id="show-pinyin"${state.pinyin ? " checked" : ""}> 拼音</label>
        <label><input type="checkbox" id="show-english"${state.english ? " checked" : ""}> English</label>
      </div>
      <article class="reader">
        <header class="reader-head">
          <h1>${text.title}</h1>
          <p class="meta">${text.titleEn} · HSK ${text.level}</p>
          <p class="source">${sourceNote}</p>
        </header>
        <div id="text" class="text"></div>
        <p id="english" class="english"${state.english ? "" : " hidden"}>${text.english}</p>
      </article>
      <aside class="card" id="word-card">
        <p class="hint">Tap a word to see pinyin and meaning.</p>
      </aside>
      <div class="actions">
        <button type="button" id="mark-done">${done ? "Mark unread" : "Mark as read"}</button>
        <span id="progress">${state.done.length} / ${TEXTS.length} read</span>
      </div>
    </div>`;

  const textEl = document.getElementById("text");
  textEl.replaceChildren(...text.paragraphs.map((para) => {
    const p = document.createElement("p");
    para.forEach((tok) => {
      if (!isWord(tok)) {
        p.append(tok.zh);
        return;
      }
      const span = document.createElement("span");
      span.className = "word";
      const ruby = document.createElement("ruby");
      ruby.append(tok.zh);
      const rt = document.createElement("rt");
      rt.textContent = tok.py;
      ruby.append(rt);
      span.append(ruby);
      span.onclick = () => {
        textEl.querySelectorAll(".word.selected").forEach((el) => el.classList.remove("selected"));
        span.classList.add("selected");
        document.getElementById("word-card").innerHTML =
          `<p class="zh">${tok.zh}</p><p class="py">${tok.py}</p><p class="en">${tok.en}</p>`;
      };
      p.append(span);
    });
    return p;
  }));

  document.getElementById("show-pinyin").onchange = (e) => {
    state.pinyin = e.target.checked;
    saveState(state);
    document.body.classList.toggle("pinyin-on", state.pinyin);
  };
  document.getElementById("show-english").onchange = (e) => {
    state.english = e.target.checked;
    saveState(state);
    document.getElementById("english").hidden = !state.english;
  };
  document.getElementById("mark-done").onclick = () => {
    state.done = state.done.includes(text.id)
      ? state.done.filter((x) => x !== text.id)
      : state.done.concat(text.id);
    saveState(state);
    renderRead(id);
  };
  if (text.quiz) {
    document.querySelector(".wrap.narrow").append(renderQuiz(text.quiz));
  }
}

function esc(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
}
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
function md(src) {
  const out = [];
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  const flushP = (buf) => {
    if (buf.length) out.push("<p>" + inline(buf.join(" ")) + "</p>");
    buf.length = 0;
  };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith("# ")) { out.push("<h1>" + inline(line.slice(2)) + "</h1>"); i++; continue; }
    if (line.startsWith("## ")) { out.push("<h2>" + inline(line.slice(3)) + "</h2>"); i++; continue; }
    if (line.startsWith("### ")) { out.push("<h3>" + inline(line.slice(4)) + "</h3>"); i++; continue; }
    if (line.startsWith("---")) { out.push("<hr>"); i++; continue; }
    if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
        i++;
      }
      const body = rows.filter((r) => !r.every((c) => /^[-:]+$/.test(c)));
      if (body.length) {
        const [head, ...rest] = body;
        out.push("<table><thead><tr>" + head.map((c) => "<th>" + inline(c) + "</th>").join("") + "</tr></thead><tbody>" +
          rest.map((r) => "<tr>" + r.map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>").join("") +
          "</tbody></table>");
      }
      continue;
    }
    if (/^\d+\. /.test(line) || line.startsWith("- ")) {
      const ol = /^\d+\. /.test(line);
      const items = [];
      while (i < lines.length && (ol ? /^\d+\. /.test(lines[i]) : lines[i].startsWith("- "))) {
        items.push("<li>" + inline(lines[i].replace(ol ? /^\d+\. / : /^- /, "")) + "</li>");
        i++;
      }
      out.push((ol ? "<ol>" : "<ul>") + items.join("") + (ol ? "</ol>" : "</ul>"));
      continue;
    }
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^#{1,3} |^---|^\||^\d+\. |^- /.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    flushP(buf);
  }
  return out.join("");
}

function renderTextbook() {
  document.getElementById("app").innerHTML = `
    ${nav("tb4")}
    <div class="wrap narrow">
      <article class="md" id="tb">Loading…</article>
    </div>`;
  fetch(href("/HSK-4A-Textbook.md"))
    .then((r) => r.ok ? r.text() : Promise.reject())
    .then((t) => { document.getElementById("tb").innerHTML = md(t); })
    .catch(() => { document.getElementById("tb").textContent = "Could not load HSK-4A-Textbook.md"; });
}

const r = route();
if (r.kind === "level") renderLevel(r.level);
else if (r.kind === "read") renderRead(r.id);
else if (r.kind === "textbook") renderTextbook();
else renderHome();
