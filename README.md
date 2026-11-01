<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:050505,35:171717,70:303030,100:050505&height=190&section=header&text=Lost%20Internet&fontSize=54&fontColor=ffffff&fontAlignY=38&desc=A%20WEB%20MYSTERY%20FROM%202005%20TO%202015&descAlignY=62&descSize=13" width="100%" />

<br/>

<img src="https://img.shields.io/badge/ARG-111111?style=for-the-badge&logo=ghost&logoColor=white" /> <img src="https://img.shields.io/badge/WINDOWS%20XP-111111?style=for-the-badge&logo=windowsxp&logoColor=white" /> <img src="https://img.shields.io/badge/NOSTALGIA-111111?style=for-the-badge&logo=internetarchive&logoColor=white" /> <img src="https://img.shields.io/github/stars/TheROMZ52/lost-internet?style=for-the-badge&color=111111&labelColor=050505&logo=github" /> <img src="https://img.shields.io/github/last-commit/TheROMZ52/lost-internet?style=for-the-badge&color=111111&labelColor=050505" />

<br/>

## 🕵️ Lost Internet

[English](README.md) · [فارسی](README.fa.md)

### A little digital time machine for people who miss the web before everything became an app. Expect nostalgia; watch out for secrets.

<img src="https://skillicons.dev/icons?i=html,css,js&theme=dark" />

</div>

---

A website that feels like a piece of the internet from 2005–2015 that you found by accident: a Windows XP desktop, folders with secrets, lost videos, an encrypted chat, fake old websites in Internet Explorer, and a hidden password that opens a new section. Everything connects to one hidden story (a small ARG).

No build step, no dependencies, no downloads. Pure HTML/CSS/JS.

---

## 01 / RUN IT

Open `index.html` in a browser, or serve the folder with any static host (Vercel, GitHub Pages, Netlify).

```bash
npx serve .
```

---

## 02 / WHAT'S INSIDE

- XP-style boot, login, desktop, draggable windows, taskbar and Start menu
- Folders (My Documents, Recycle Bin), Notepad, Media Player, Messenger, Internet Explorer
- A fake web: a Geocities-style club page, guestbook, forum, a personal homepage and a search page
- `mystery.dat`: different content every time you open it
- `Vault.exe`: a password that unlocks a hidden archive and the full story
- Synthesised sound effects (no audio files), progress saved in `localStorage`

---

<details>
<summary><b>03 / FILES</b></summary>
<br/>

| File | Purpose |
| --- | --- |
| `index.html` | Page shell (boot, login, desktop, taskbar) |
| `style.css` | XP look and feel |
| `app.js` | Window manager, apps, puzzles, story |

</details>

---

<details>
<summary><b>04 / SEO</b></summary>
<br/>

`index.html` has title, description, canonical, Open Graph / Twitter cards (`og-image.png`) and JSON-LD (VideoGame). `robots.txt` and `sitemap.xml` are included. If you move to a custom domain, update the URL in those three places (`index.html`, `robots.txt`, `sitemap.xml`).

</details>

---

## 05 / NOTES

Spoilers for the puzzle chain are intentionally not in this README. To reset progress, use Start → Reset archive.

---

## 06 / LICENSE

MIT

---

<div align="center">

<a href="https://github.com/TheROMZ52?tab=repositories"><img src="https://img.shields.io/badge/MORE%20PROJECTS-111111?style=for-the-badge&logo=github&logoColor=white" /></a>

<br/><br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:050505,50:202020,100:050505&height=110&section=footer" width="100%" />

<sub>© TheROMZ52 • Built with code, curiosity, and a suspicious number of tabs.</sub>

</div>
