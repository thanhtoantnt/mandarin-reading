const KEY = "mandarin-reading";

function loadState() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

const state = Object.assign(
  { textId: TEXTS[0].id, done: [], pinyin: false, english: false },
  loadState()
);
const known = new Set(TEXTS.map((t) => t.id));
if (!known.has(state.textId)) state.textId = TEXTS[0].id;
state.done = state.done.filter((id) => known.has(id));

const $ = (id) => document.getElementById(id);
const lessonsEl = $("lessons");
const textEl = $("text");
const cardEl = $("word-card");
const englishEl = $("english");
const markBtn = $("mark-done");

function currentText() {
  return TEXTS.find((t) => t.id === state.textId) || TEXTS[0];
}

function isWord(tok) {
  return Boolean(tok.py || tok.en);
}

function renderLessons() {
  lessonsEl.replaceChildren(...TEXTS.map((t) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `${t.title} · HSK ${t.level}`;
    if (t.id === state.textId) b.classList.add("active");
    if (state.done.includes(t.id)) b.classList.add("done");
    b.onclick = () => {
      state.textId = t.id;
      saveState(state);
      render();
    };
    return b;
  }));
}

function renderText() {
  const text = currentText();
  $("title").textContent = text.title;
  $("meta").textContent = `${text.titleEn} · HSK ${text.level}`;
  englishEl.textContent = text.english;
  englishEl.hidden = !state.english;

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
      span.onclick = () => showWord(tok, span);
      p.append(span);
    });
    return p;
  }));
}

function showWord(tok, span) {
  textEl.querySelectorAll(".word.selected").forEach((el) => el.classList.remove("selected"));
  span.classList.add("selected");
  cardEl.innerHTML = `
    <p class="zh">${tok.zh}</p>
    <p class="py">${tok.py}</p>
    <p class="en">${tok.en}</p>
  `;
}

function renderProgress() {
  $("progress").textContent = `${state.done.length} / ${TEXTS.length} read`;
  const done = state.done.includes(state.textId);
  markBtn.textContent = done ? "Mark unread" : "Mark as read";
}

function render() {
  document.body.classList.toggle("pinyin-on", state.pinyin);
  $("show-pinyin").checked = state.pinyin;
  $("show-english").checked = state.english;
  renderLessons();
  renderText();
  renderProgress();
  cardEl.innerHTML = `<p class="hint">Tap a word to see pinyin and meaning.</p>`;
}

$("show-pinyin").onchange = (e) => {
  state.pinyin = e.target.checked;
  saveState(state);
  document.body.classList.toggle("pinyin-on", state.pinyin);
};

$("show-english").onchange = (e) => {
  state.english = e.target.checked;
  saveState(state);
  englishEl.hidden = !state.english;
};

markBtn.onclick = () => {
  const id = currentText().id;
  state.done = state.done.includes(id)
    ? state.done.filter((x) => x !== id)
    : state.done.concat(id);
  saveState(state);
  renderLessons();
  renderProgress();
};

render();
