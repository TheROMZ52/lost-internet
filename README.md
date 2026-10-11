# 🕵️ Lost Internet

A website that feels like a piece of the internet from 2005–2015 that you found by accident: a Windows XP desktop, folders with secrets, lost videos, an encrypted chat, fake old websites in Internet Explorer, and a hidden password that opens a new section. Everything connects to one hidden story (a small ARG).

No build step, no dependencies, no downloads. Pure HTML/CSS/JS.

## Run it

Open `index.html` in a browser, or serve the folder with any static host (Vercel, GitHub Pages, Netlify).

```bash
npx serve .
```

## What's inside

- XP-style boot, login, desktop, draggable windows, taskbar and Start menu
- Folders (My Documents, Recycle Bin), Notepad, Media Player, Messenger, Internet Explorer
- A fake web: a Geocities-style club page, guestbook, forum, a personal homepage and a search page
- `mystery.dat`: different content every time you open it
- `Vault.exe`: a password that unlocks a hidden archive and the full story
- Synthesised sound effects (no audio files), progress saved in `localStorage`

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page shell (boot, login, desktop, taskbar) |
| `style.css` | XP look and feel |
| `app.js` | Window manager, apps, puzzles, story |

## Notes

Spoilers for the puzzle chain are intentionally not in this README. To reset progress, use Start → Reset archive.

## License

MIT
