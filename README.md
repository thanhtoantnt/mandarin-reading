# 读中文 · Mandarin Reading

Tap-to-gloss graded readers for HSK 4, 5, and 6.

**Live site:** https://thanhtoantnt.github.io/mandarin-reading/

- [HSK 4](https://thanhtoantnt.github.io/mandarin-reading/hsk4/)
- [HSK 5](https://thanhtoantnt.github.io/mandarin-reading/hsk5/)
- [HSK 6](https://thanhtoantnt.github.io/mandarin-reading/hsk6/)

## Use

Open a level, pick a lesson, tap a word for pinyin + English. Toggle 拼音 to show readings above the line.

Progress is stored in the browser (`localStorage`).

## Add a text

Append an object to `TEXTS` in `texts.js`:

```js
{
  id: "park",
  title: "公园",
  titleEn: "The park",
  level: 4,
  english: "Full English translation.",
  paragraphs: [
    [
      { zh: "今天", py: "jīntiān", en: "today" },
      { zh: "。", py: "", en: "" }
    ]
  ]
}
```

Keep words as words (`学生`, not `学` + `生`). Punctuation is a token with empty `py` / `en`.

## Deploy

Push to `main`. GitHub Actions publishes a static export to GitHub Pages, same pattern as [pbt-findings](https://github.com/fermat-hkrc/pbt-findings).
