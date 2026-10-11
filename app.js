'use strict';
/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of kids) e.append(c);
  return e;
};
const S = {
  get(k, d) { try { const v = localStorage.getItem('li:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('li:' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  wipe() { try { Object.keys(localStorage).filter(k => k.startsWith('li:')).forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ } }
};
const visits = S.get('visits', 0) + 1;
S.set('visits', visits);
const solved = S.get('solved', {});
const mark = k => { if (!solved[k]) { solved[k] = true; S.set('solved', solved); } };
const coarse = matchMedia('(pointer: coarse)').matches;
const ordinal = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const pad2 = n => String(n).padStart(2, '0');
const timeNow = () => { const d = new Date(); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };

/* ---------- sound (synthesised, nothing downloaded) ---------- */
let ac;
function tone(f = 440, d = 0.15, type = 'square', v = 0.04, when = 0) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + when;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
  } catch { /* audio blocked */ }
}
const chime = () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.5, 'sine', 0.06, i * 0.14));
const errSound = () => { tone(220, 0.18, 'square', 0.05); tone(165, 0.25, 'square', 0.05, 0.12); };

/* ---------- window manager ---------- */
const wins = new Map();
let zTop = 10;
function focusWin(id) {
  wins.forEach((w, k) => { const on = k === id; w.node.classList.toggle('active', on); w.task.classList.toggle('active', on); });
  const w = wins.get(id); if (w) w.node.style.zIndex = ++zTop;
}
function closeWin(id) {
  const w = wins.get(id); if (!w) return;
  if (w.onclose) w.onclose();
  w.node.remove(); w.task.remove(); wins.delete(id);
}
function openWindow(id, o) {
  if (wins.has(id)) { const w = wins.get(id); w.node.hidden = false; focusWin(id); return w; }
  const { title, icon = '🗔', w = 460, h = 320, menu = false } = o;
  const small = innerWidth < 700;
  const node = el('div', { class: 'win' + (small ? ' full' : ''), role: 'dialog', 'aria-label': title });
  const n = wins.size;
  node.style.width = Math.min(w, innerWidth - 8) + 'px';
  node.style.height = Math.min(h, innerHeight - 40) + 'px';
  node.style.left = Math.max(4, Math.min(innerWidth - w - 8, 60 + n * 26)) + 'px';
  node.style.top = Math.max(4, Math.min(innerHeight - h - 40, 30 + n * 24)) + 'px';
  const bMin = el('button', { 'aria-label': 'Minimize' }, '–');
  const bMax = el('button', { 'aria-label': 'Maximize' }, '□');
  const bX = el('button', { class: 'x', 'aria-label': 'Close' }, '×');
  const tb = el('div', { class: 'tb' }, el('span', { class: 'ti' }, icon + ' ' + title), bMin, bMax, bX);
  const body = el('div', { class: 'wbody' });
  node.append(tb);
  if (menu) node.append(el('div', { class: 'menubar' }, ...['File', 'Edit', 'View', 'Help'].map(t => el('span', {}, t))));
  node.append(body);
  const task = el('button', { class: 'task' }, icon + ' ' + title);
  const rec = { node, body, task, onclose: o.onclose };
  wins.set(id, rec);
  $('#windows').append(node); $('#tasks').append(task);
  node.addEventListener('pointerdown', () => focusWin(id));
  task.addEventListener('click', () => {
    if (node.hidden) { node.hidden = false; focusWin(id); }
    else if (node.classList.contains('active')) node.hidden = true;
    else focusWin(id);
  });
  bMin.onclick = () => { node.hidden = true; };
  bMax.onclick = () => node.classList.toggle('max');
  bX.onclick = () => closeWin(id);
  tb.addEventListener('dblclick', e => { if (e.target === tb || e.target.classList.contains('ti')) node.classList.toggle('max'); });
  tb.addEventListener('pointerdown', e => {
    if (e.target.tagName === 'BUTTON' || node.classList.contains('full') || node.classList.contains('max')) return;
    const sx = e.clientX - node.offsetLeft, sy = e.clientY - node.offsetTop;
    tb.setPointerCapture(e.pointerId);
    const mv = ev => {
      node.style.left = Math.max(-node.offsetWidth + 80, Math.min(innerWidth - 80, ev.clientX - sx)) + 'px';
      node.style.top = Math.max(0, Math.min(innerHeight - 60, ev.clientY - sy)) + 'px';
    };
    const up = () => { tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); };
    tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up);
  });
  focusWin(id);
  return rec;
}
function errorBox(title, msg, icon = '❌') {
  errSound();
  const id = 'err' + Date.now();
  const w = openWindow(id, { title, icon: '⚠️', w: 340, h: 150 });
  w.body.append(el('div', { class: 'pad' }, el('p', {}, icon + ' ' + msg), el('div', { class: 'row' }, el('button', { class: 'btn', onclick: () => closeWin(id) }, 'OK'))));
  return w;
}
function bindOpen(node, fn) {
  node.tabIndex = 0;
  node.addEventListener('click', () => {
    if (coarse) return fn();
    node.parentElement.querySelectorAll('.on').forEach(n => n.classList.remove('on')); node.classList.add('on');
  });
  node.addEventListener('dblclick', fn);
  node.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
}
const icon = (glyph, label, fn) => { const b = el('button', { class: 'ico' }, el('span', { class: 'g' }, glyph), el('span', { class: 'l' }, label)); bindOpen(b, fn); return b; };

/* ---------- apps ---------- */
function notepad(id, name, text) {
  const w = openWindow(id, { title: name + ' - Notepad', icon: '📝', w: 440, h: 320, menu: true });
  w.body.replaceChildren(el('pre', { class: 'np' }, text));
  return w;
}
function folder(id, name, glyph, items, status) {
  const w = openWindow(id, { title: name, icon: glyph, w: 480, h: 330 });
  const grid = el('div', { class: 'files' });
  items.forEach(i => grid.append(icon(i.g, i.n, i.fn)));
  w.body.replaceChildren(grid);
  if (!w.node.querySelector('.statusbar')) w.node.append(el('div', { class: 'statusbar' }, status || items.length + ' object(s)'));
  return w;
}

const README = `readme.txt
----------
if you are reading this, the archive still loads.

i left everything where i could find it again:
  - the folders are rooms
  - messenger still has our last chat
  - the old sites are still up (do not trust the dates)
  - there is a program called Vault.exe. it wants a password.

the password isn't hard. it was never meant to be hard.
it was meant to be remembered.

if the chat looks like nonsense: A becomes D. count how many of us there were.

- m.`;

const FOLDERS = () => ({
  docs: () => folder('docs', 'My Documents', '📁', [
    { g: '📁', n: 'Photos_2007', fn: () => folder('photos', 'Photos_2007', '📁', [
      { g: '🖼️', n: 'IMG_0412.jpg', fn: photo },
      { g: '🖼️', n: 'IMG_0398.jpg', fn: () => errorBox('Image Viewer', 'This image is blank. It has been blank since 2007.') }
    ]) },
    { g: '📁', n: 'Homework', fn: () => folder('hw', 'Homework', '📁', [
      { g: '📄', n: 'essay_final_FINAL.doc', fn: () => notepad('essay', 'essay_final_FINAL.doc',
`THE ROLE OF TECHNOLOGY IN MODERN SOCIETY
by [name removed]

Technology has changed how we communicate. It has also changed
how we are remembered. A page that nobody visits is not deleted.
It just waits.

(i deleted the rest. the teacher said the ending was "unsettling".
 the last line was: why does the sky keep refreshing?)`) },
      { g: '📄', n: 'math_hw_9.txt', fn: () => notepad('math', 'math_hw_9.txt', '1. 3 members + 1 who never signs\n2. 4 - 1 = ?\n3. If a room has no number, is it still a room?\n\nanswers: see guestbook.') }
    ]) },
    { g: '📁', n: 'DO NOT OPEN', fn: doNotOpen },
    { g: '📄', n: 'Untitled (3).txt', fn: () => notepad('u3', 'Untitled (3).txt', 'm: are you there\nm: are you there\nm: you are not there\nm: good. i will leave the door open.') }
  ]),
  bin: () => folder('bin', 'Recycle Bin', '🗑️', [
    { g: '🖼️', n: 'lantern_logo.gif', fn: () => errorBox('Image Viewer', 'The animation never finishes loading. A small light blinks in the corner. Probably nothing.') },
    { g: '📄', n: 'last_post.txt', fn: () => notepad('lastpost', 'last_post.txt',
`FORUM  /  General  /  "is anyone still here?"
posted by: m.   date: 06/11/2015   replies: 0

servers close tomorrow. i copied everything i could.
i'm not going to put it back together in one place, because
one place can be switched off.

if you ever find a piece, you'll find the others.
the order doesn't matter. the door does.`) }
  ], 'Items here were deleted. Probably.')
});

let doNotOpenTries = 0;
function doNotOpen() {
  if (doNotOpenTries++ === 0) return errorBox('Access Denied', 'C:\\My Documents\\DO NOT OPEN is not accessible.\nThe folder is in use by another person.'.replace('\n', ' '));
  folder('dno', 'DO NOT OPEN', '📁', [
    { g: '📄', n: 'notes_from_admin.txt', fn: () => notepad('admin', 'notes_from_admin.txt',
`you opened it twice. nobody does that.

mystery.dat on the desktop is not a file. it's a list.
it's different every time because the list is different every time.
count how many lines are about you.`) }
  ]);
}

/* mystery.dat: different on every open, uses only the clock and a local visit counter */
function mystery() {
  const t = timeNow();
  const pool = [
    'you were not supposed to find this one.',
    `this is the ${ordinal(visits)} time this machine has loaded the archive.`,
    `it is ${t} where you are. it was ${t} when i wrote this.`,
    'the cursor moved before you did.',
    "'Homework' has 14 files. you only saw 2.",
    "if the page feels slower tonight, it isn't your connection.",
    'm. never left. m. just stopped refreshing.',
    'do not look for the 4th member. the 4th member is looking.',
    'this file is 0 bytes. then why can you read it?',
    'close this window. when you reopen it, it will be different, but still here.',
    'somebody else has this window open right now.',
    'the room is not on a floor. it is on a date.'
  ];
  const yr = 2005 + Math.floor(Math.random() * 11);
  const head = `mystery.dat\nlast modified: ${pad2(1 + Math.floor(Math.random() * 12))}/${pad2(1 + Math.floor(Math.random() * 28))}/${yr}\n${'-'.repeat(30)}\n\n`;
  let lines = pick(pool, 3);
  if (solved.vault) lines.push(`member #${S.get('member', 5)}. welcome.`);
  const id = 'mystery';
  if (wins.has(id)) closeWin(id);
  notepad(id, 'mystery.dat', head + lines.join('\n\n'));
}

/* image: the room number is on the door */
function photo() {
  const w = openWindow('img412', { title: 'IMG_0412.jpg - Image Viewer', icon: '🖼️', w: 420, h: 360 });
  const c = el('canvas', { width: 360, height: 300 });
  w.body.replaceChildren(el('div', { class: 'pic' }, c));
  const g = c.getContext('2d');
  let bg = g.createLinearGradient(0, 0, 0, 300); bg.addColorStop(0, '#10181a'); bg.addColorStop(1, '#070b0c');
  g.fillStyle = bg; g.fillRect(0, 0, 360, 300);
  g.fillStyle = '#16221f'; g.beginPath(); g.moveTo(0, 0); g.lineTo(110, 70); g.lineTo(110, 230); g.lineTo(0, 300); g.fill();
  g.beginPath(); g.moveTo(360, 0); g.lineTo(250, 70); g.lineTo(250, 230); g.lineTo(360, 300); g.fill();
  g.fillStyle = '#0c1412'; g.fillRect(110, 70, 140, 160);
  g.fillStyle = '#1a1410'; g.beginPath(); g.moveTo(0, 300); g.lineTo(110, 230); g.lineTo(250, 230); g.lineTo(360, 300); g.fill();
  const light = g.createRadialGradient(180, 140, 4, 180, 150, 120); light.addColorStop(0, 'rgba(255,190,90,.55)'); light.addColorStop(1, 'rgba(255,190,90,0)');
  g.fillStyle = light; g.fillRect(0, 0, 360, 300);
  g.fillStyle = '#5a3a1f'; g.fillRect(150, 100, 60, 130);
  g.fillStyle = '#2b1a0c'; g.fillRect(156, 108, 48, 56); g.fillRect(156, 172, 48, 50);
  g.fillStyle = '#d8a845'; g.fillRect(163, 82, 34, 16);
  g.fillStyle = '#1a1208'; g.font = '700 12px "Courier New",monospace'; g.textAlign = 'center'; g.fillText('412', 180, 94);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`; g.fillRect(Math.random() * 360, Math.random() * 300, 1, 1); }
  const v = g.createRadialGradient(180, 150, 90, 180, 150, 230); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.75)');
  g.fillStyle = v; g.fillRect(0, 0, 360, 300);
  g.fillStyle = '#ffb347'; g.font = '12px "Courier New",monospace'; g.textAlign = 'left'; g.fillText('03/14/2007  03:12 AM', 10, 290);
  mark('room');
}

/* media player */
function player(fileName, corrupted) {
  if (corrupted) return errorBox('Windows Media Player', `Cannot play "${fileName}". The file is corrupted or the codec is missing.`);
  const w = openWindow('vid42', { title: fileName + ' - Windows Media Player', icon: '📺', w: 440, h: 380 });
  const c = el('canvas', { width: 160, height: 120 });
  const fill = el('i'); const label = el('span', {}, '▶');
  const btn = el('button', { class: 'btn', style: 'min-width:36px;padding:2px 8px' }, label);
  const ctl = el('div', { class: 'ctl' }, btn, el('div', { class: 'bar' }, fill), el('span', { id: 'vt' }, '00:00'));
  w.body.replaceChildren(el('div', { class: 'vid' }, c, ctl));
  const g = c.getContext('2d');
  const DUR = 14; let t = 0, last = 0, playing = false, flashed = false;
  const cap = s => { g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(0, 100, 160, 16); g.fillStyle = '#fff'; g.font = '8px monospace'; g.textAlign = 'center'; g.fillText(s, 80, 111); };
  function frame() {
    const img = g.createImageData(160, 120), d = img.data;
    const noise = t < 2 || t > 12 ? 1 : 0.18;
    for (let i = 0; i < d.length; i += 4) {
      const y = Math.floor(i / 4 / 160);
      const base = t >= 2 && t <= 12 ? 28 + (y % 24 < 2 ? 22 : 0) : 0;
      const v = Math.min(255, base + Math.random() * 255 * noise);
      d[i] = v * 0.9; d[i + 1] = v; d[i + 2] = v * 0.85; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    g.textAlign = 'center';
    if (t < 2) { g.fillStyle = '#fff'; g.font = '10px monospace'; g.fillText('NO SIGNAL', 80, 60); }
    else if (t < 6) { cap('REC  03:12 AM  CH-4'); }
    else if (t >= 6 && t < 6.4) { g.fillStyle = '#000'; g.fillRect(0, 0, 160, 120); g.fillStyle = '#f33'; g.font = '700 22px monospace'; g.fillText('ROOM 412', 80, 66); if (!flashed) { flashed = true; mark('room'); } }
    else if (t < 9) { cap('is anyone still online?'); }
    else if (t < 12) { cap('we are all still online.'); }
  }
  function loop(ts) {
    if (!document.contains(c)) return;
    if (playing) { t += (ts - last) / 1000; last = ts; if (t >= DUR) { t = 0; flashed = false; } }
    frame(); fill.style.width = (t / DUR * 100) + '%';
    const tt = $('#vt', ctl); if (tt) tt.textContent = '00:' + pad2(Math.floor(t));
    requestAnimationFrame(loop);
  }
  btn.onclick = () => { playing = !playing; label.textContent = playing ? '❚❚' : '▶'; last = performance.now(); if (playing) tone(90, 0.3, 'sawtooth', 0.03); };
  requestAnimationFrame(loop);
}
const mediaFolder = () => folder('media', 'Media Player Library', '📺', [
  { g: '🎞️', n: 'VID_0001.avi', fn: () => player('VID_0001.avi', true) },
  { g: '🎞️', n: 'VID_0042.avi', fn: () => player('VID_0042.avi', false) }
], '2 videos');

/* messenger */
const CIPHER = 'NHB LV FOXE QDPH SOXV URRP';
function messenger() {
  const w = openWindow('msn', { title: 'mira_x - Conversation', icon: '💬', w: 500, h: 360 });
  const log = el('div', { class: 'log' });
  const add = (who, text, cls) => log.append(el('p', {}, el('span', { class: 't' }, who + ' '), el('span', { class: cls || '' }, text)));
  const info = txt => log.append(el('p', { class: 'sys' }, txt));
  info('Conversation history from 06/10/2015');
  add('ellie_88 says:', 'mira are you actually shutting it down');
  add('mira_x says:', 'no. i am splitting it up.');
  add('jonas_k says:', 'lol ok cryptic');
  add('mira_x says:', 'if one of you ever needs back in, this is what you need:');
  add('mira_x says:', CIPHER, 'enc');
  add('ellie_88 says:', 'can you at least tell us the cipher');
  add('mira_x says:', "you know it. it's how many of us there were. always 3 and one more who never typed.");
  info('mira_x has signed out.');
  const input = el('input', { placeholder: 'Type a message...', 'aria-label': 'Message' });
  const form = el('form', {}, input, el('button', { class: 'btn', type: 'submit' }, 'Send'));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = input.value.trim(); if (!v) return;
    add('you say:', v); input.value = '';
    const norm = v.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ');
    if (norm.includes('key is club name plus room')) {
      mark('cipher'); chime(); info('mira_x is offline. but something typed: "good. then you know what to bring."');
    } else info('mira_x is offline. Messages will be delivered when she signs in. (She doesn\'t.)');
    log.scrollTop = log.scrollHeight;
  });
  w.body.replaceChildren(el('div', { class: 'msn' },
    el('div', { class: 'side' }, el('b', {}, 'Contacts'), el('div', {}, '🟢 ellie_88'), el('div', {}, '⚪ mira_x'), el('div', {}, '⚪ jonas_k'), el('div', {}, '⚫ (unnamed)')),
    el('div', { class: 'chat' }, log, form)));
  log.scrollTop = log.scrollHeight;
}

/* fake internet explorer */
const PAGES = {
  'lanternclub.tripod.com': () => {
    mark('club');
    return `<div class="geo"><div class="mq"><span>~*~ Welcome to THE LANTERN CLUB ~*~ est. 2005 ~*~ best viewed in Internet Explorer at 800x600 ~*~</span></div>
    <h1>THE LANTERN CLUB</h1>
    <p style="text-align:center">a place for people who stay up too late.<br>members only (but nobody checks)</p>
    <p style="text-align:center">You are visitor number <span class="ctr">${String(4812 + visits).padStart(6, '0')}</span></p>
    <p style="text-align:center"><a data-go="lanternclub.tripod.com/guestbook">Sign the Guestbook</a> | <a data-go="forum.lanternclub.net">Forum</a> | <a data-go="geoplace.com/~ellie88">Ellie's page</a></p>
    <p class="ghost">member list: m., jonas_k, ellie_88 and one more who never gave a name.</p>
    <p style="text-align:center;color:#888">(c) 2005 - 2015. Site is "under construction" since forever.</p></div>`;
  },
  'lanternclub.tripod.com/guestbook': () => `<div class="geo"><h1>GUESTBOOK</h1>
    <div class="gb"><b>ellie_88</b> (03/09/2005): first!!! best club ever. m you are a genius</div>
    <div class="gb"><b>jonas_k</b> (11/22/2006): forum is up. be nice.</div>
    <div class="gb"><b>anonymous</b> (04/12/2009): i have been reading for 4 years. i am not going to sign my name.</div>
    <div class="gb"><b>ellie_88</b> (12/30/2012): we should meet at the door of the room like always.</div>
    <div class="gb"><b>m.</b> (06/11/2015): the last night is in room 412. the door is open. bring the headcount.</div>
    <p><a data-go="lanternclub.tripod.com">back to home</a></p></div>`,
  'forum.lanternclub.net': () => `<div class="pg forum"><h2>The Lantern Club Forum</h2>
    <table><tr><th>Topic</th><th>Replies</th><th>Last post</th></tr>
    <tr><td>Rules (there are none)</td><td>9</td><td>jonas_k</td></tr>
    <tr><td>what are you listening to at 3am</td><td>212</td><td>ellie_88</td></tr>
    <tr><td>is the 4th member a bot?</td><td>57</td><td>[deleted]</td></tr>
    <tr><td>servers closing</td><td>0</td><td>m.</td></tr></table>
    <p>Showing 4 of 4 topics. Page 1 of 1.</p><p><a data-go="lanternclub.tripod.com">back to the club</a></p></div>`,
  'geoplace.com/~ellie88': () => `<div class="pg pink"><h2>~ ellie's corner of the web ~</h2>
    <p>hi!! i love music, tea, and staying up way too late. ✿</p>
    <p><b>my top 3 lanterns:</b> m., jonas, and the one that never types.</p>
    <p>if you get lost: m. always waited for us at the door of the room. just look at the photo. the number is on the door.</p>
    <p><a data-go="lanternclub.tripod.com">the club</a></p></div>`,
  'searchbox.com': (q) => {
    const hit = q && /lantern/i.test(q);
    return `<div class="pg"><h1 style="color:#c33;font-family:Georgia">SearchBox</h1>
    <form data-search><input name="q" value="${(q || '').replace(/[<>"&]/g, '')}" style="width:70%;padding:3px"> <button>Search</button></form>
    ${q ? (hit ? `<p>About 3 results for <b>${q.replace(/[<>&]/g, '')}</b>:</p>
      <p><a data-go="lanternclub.tripod.com">The Lantern Club - est. 2005</a><br>a place for people who stay up too late.</p>
      <p><a data-go="forum.lanternclub.net">The Lantern Club Forum</a></p>
      <p><a data-go="geoplace.com/~ellie88">ellie's corner of the web</a></p>` : '<p>No results found. (The internet used to be smaller.)</p>') : '<p>Try searching for something you only half remember.</p>'}</div>`;
  }
};
function ie(startUrl = 'searchbox.com') {
  const w = openWindow('ie', { title: 'Internet Explorer', icon: '🌐', w: 560, h: 420, menu: true });
  const hist = []; let pos = -1;
  const addr = el('input', { 'aria-label': 'Address', spellcheck: 'false' });
  const view = el('div', { class: 'ie-view' });
  const back = el('button', { class: 'btn', style: 'min-width:0' }, '◀ Back');
  const go = el('button', { class: 'btn', style: 'min-width:0' }, 'Go');
  w.body.replaceChildren(el('div', { style: 'display:flex;flex-direction:column;height:100%' }, el('div', { class: 'ie-tools' }, back, addr, go), view));
  view.style.flex = '1';
  const norm = u => u.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
  function render(url, push = true) {
    const [path, qs] = norm(url).split('?');
    const q = qs ? decodeURIComponent((qs.match(/q=([^&]*)/) || [])[1] || '').replace(/\+/g, ' ') : '';
    const page = PAGES[path];
    addr.value = 'http://' + norm(url);
    if (push) { hist.length = pos + 1; hist.push(norm(url)); pos++; }
    if (page) { view.innerHTML = page(q); view.scrollTop = 0; }
    else {
      view.innerHTML = `<div class="ie-err"><h2>The page cannot be displayed</h2><p>The page you are looking for is currently unavailable. The Web site might be experiencing technical difficulties, or you may need to adjust your browser settings.</p><ul><li>Check the address for typing errors.</li><li>Try the <a data-go="searchbox.com">search page</a>.</li></ul><p>HTTP 404 - File not found<br>Internet Explorer</p></div>`;
      errSound();
    }
  }
  view.addEventListener('click', e => { const a = e.target.closest('[data-go]'); if (a) { e.preventDefault(); render(a.dataset.go); } });
  view.addEventListener('submit', e => { if (e.target.matches('[data-search]')) { e.preventDefault(); render('searchbox.com?q=' + encodeURIComponent(new FormData(e.target).get('q'))); } });
  go.onclick = () => render(addr.value);
  addr.addEventListener('keydown', e => { if (e.key === 'Enter') render(addr.value); });
  back.onclick = () => { if (pos > 0) { pos--; render(hist[pos], false); } };
  render(startUrl);
}

/* vault + the reveal */
let vaultFails = 0;
function vault() {
  if (solved.vault) return archive();
  const w = openWindow('vault', { title: 'Vault.exe', icon: '🔐', w: 380, h: 230 });
  const pw = el('input', { class: 'field', type: 'password', 'aria-label': 'Password', autocomplete: 'off' });
  const msg = el('p', { style: 'min-height:2.6em;color:#a00' });
  const form = el('form', {}, el('p', {}, '🔐 This archive is protected. Enter the password to continue.'), el('div', { class: 'row' }, pw, el('button', { class: 'btn', type: 'submit' }, 'Unlock')), msg);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = pw.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (v === 'lantern412') {
      mark('vault'); if (!S.get('member')) S.set('member', 5 + Math.floor(Math.random() * 9000));
      chime(); closeWin('vault'); addArchiveIcon(); archive();
    } else {
      vaultFails++; errSound(); w.node.classList.remove('shake'); void w.node.offsetWidth; w.node.classList.add('shake');
      msg.textContent = vaultFails >= 3 ? 'Incorrect password. Hint: it is two things stuck together.' : 'Incorrect password.';
    }
  });
  w.body.replaceChildren(el('div', { class: 'pad' }, form));
  pw.focus();
}
function archive() {
  const got = k => solved[k] ? '✔' : '✖';
  const member = S.get('member', 5);
  const files = [
    ['chapter1_the_club.txt',
`CHAPTER 1 - THE CLUB

In 2005 four people started a club on a free hosting account.
They called themselves lanterns, because they only came on after midnight.

m. built the site. jonas wrote the forum. ellie kept the guestbook.
The fourth never gave a name, and nobody ever asked twice.`],
    ['chapter2_the_split.txt',
`CHAPTER 2 - THE SPLIT

By 2010 the club had three hundred members and no rules.
By 2013 it had forty. In 2015 the host shut the servers down.

m. did not move the site. m. broke it into pieces and hid them:
a desktop here, a forum there, a guestbook somewhere else,
so that no single switch could turn all of it off.`],
    ['chapter3_the_headcount.txt',
`CHAPTER 3 - THE HEADCOUNT

Every folder was a room. Every fake website was a real page that once existed.
The video is room 412: the last place the club was ever online together.

The password was never a password. It was a headcount.
You had to find the name, find the room, and put them together.
That is exactly how the club recruited. Slowly, and by accident.`],
    ['THE_END.txt',
`THE END (or the first page)

mystery.dat changes every time because it is the member list.
Everyone who gets this far is added to it.

You are member #${member}.

Found at 3 a.m. by accident? Good. That is the only way
this place has ever been found. Tell no one, or tell everyone.
On the internet those are the same thing.

--------------------------------
the pieces you found:
 ${got('club')} the club has a name
 ${got('room')} the room has a number
 ${got('cipher')} the last chat was decoded
 ✔ the vault was opened`]
  ];
  folder('archive', 'Archive_Ω', '🗝️', files.map(([n, t]) => ({ g: '📄', n, fn: () => notepad('arc-' + n, n, t) })), 'Unlocked. Welcome, member.');
}
function addArchiveIcon() {
  if ($('#ico-archive')) return;
  const i = icon('🗝️', 'Archive_Ω', archive); i.id = 'ico-archive'; $('#icons').append(i);
}

/* progress */
function progress() {
  const w = openWindow('prog', { title: 'Archive Integrity', icon: '🛡️', w: 360, h: 250 });
  const rows = [['club', 'A name has been found'], ['room', 'A number has been found'], ['cipher', 'The last chat has been decoded'], ['vault', 'The vault has been opened']];
  w.body.replaceChildren(el('div', { class: 'pad' }, el('b', {}, 'Archive integrity'),
    el('ul', { class: 'chk' }, ...rows.map(([k, t]) => el('li', { class: solved[k] ? 'found' : '' }, (solved[k] ? '☑ ' : '☐ ') + t))),
    el('p', { style: 'color:#666' }, 'Progress is saved only in this browser.')));
}

/* ---------- desktop, start menu, boot ---------- */
function buildDesktop() {
  const F = FOLDERS();
  const icons = $('#icons');
  [
    ['📁', 'My Documents', F.docs],
    ['🗑️', 'Recycle Bin', F.bin],
    ['🌐', 'Internet Explorer', () => ie()],
    ['📺', 'Media Player', mediaFolder],
    ['💬', 'Messenger', messenger],
    ['📝', 'readme.txt', () => notepad('readme', 'readme.txt', README)],
    ['❓', 'mystery.dat', mystery],
    ['🔐', 'Vault.exe', vault]
  ].forEach(([g, l, fn]) => icons.append(icon(g, l, fn)));
  if (solved.vault) addArchiveIcon();

  const sm = $('#sm-body');
  const item = (g, t, fn) => sm.append(el('button', { onclick: () => { $('#startmenu').hidden = true; fn(); } }, g + ' ' + t));
  item('🌐', 'Internet Explorer', () => ie()); item('📁', 'My Documents', F.docs); item('💬', 'Messenger', messenger);
  item('📺', 'Media Player', mediaFolder); item('📝', 'readme.txt', () => notepad('readme', 'readme.txt', README));
  sm.append(el('hr')); item('🛡️', 'Archive Integrity', progress);
  item('♻️', 'Reset archive', () => { if (confirm('Erase all progress in this browser and start over?')) { S.wipe(); location.reload(); } });
  item('⏻', 'Shut down', shutdown);

  $('#start').onclick = e => { e.stopPropagation(); $('#startmenu').hidden = !$('#startmenu').hidden; };
  document.addEventListener('pointerdown', e => { if (!e.target.closest('#startmenu') && !e.target.closest('#start')) $('#startmenu').hidden = true; });
  $('#desktop').addEventListener('pointerdown', e => { if (e.target.id === 'icons' || e.target.id === 'desktop') $('#icons').querySelectorAll('.on').forEach(n => n.classList.remove('on')); });
  const tick = () => { $('#clock').textContent = timeNow(); };
  tick(); setInterval(tick, 15000);
}
function shutdown() {
  const off = el('div', { id: 'off', role: 'button', tabindex: '0' }, 'It is now safe to turn off your computer.\n\n(click to restart)');
  off.style.whiteSpace = 'pre-line';
  off.onclick = () => location.reload(); off.onkeydown = e => { if (e.key === 'Enter') location.reload(); };
  document.body.append(off);
}
function toLogin() {
  $('#boot').classList.add('off'); $('#login').hidden = false;
  $('#guest').onclick = () => { $('#login').hidden = true; $('#desktop').hidden = false; buildDesktop(); chime(); S.set('seen', true); };
  $('#guest').focus();
}
function boot() {
  const lines = ['LOST-BIOS v2.05  (C) 1998-2006', 'Memory test: 262144K OK', 'Detecting drives ... Primary Master: ARCHIVE-DRV', 'Mounting C:\\ ...', visits > 1 ? `Welcome back. Boot count: ${visits}` : 'Last shutdown: 06/11/2015 03:12 AM', 'Starting Lost Internet ...'];
  const box = $('#boot'); let i = 0;
  const skip = () => { clearInterval(iv); toLogin(); };
  const iv = setInterval(() => { if (i < lines.length) box.textContent += lines[i++] + '\n'; else skip(); }, S.get('seen', false) ? 120 : 380);
  box.onclick = skip;
}
boot();
