// Editiermodus (?edit=1): Sperrzonen als Rechtecke ziehen, Hotspots setzen, löschen und die Szene als JSON ausgeben.
// So werden Kollision und Hotspots nach dem Einsetzen eines neuen Szenenbilds ohne Probieren im Quelltext festgelegt.
// Änderungen bleiben im localStorage (Schlüssel protein-gym:edit:<szene>), bis sie in data/szenen.json übernommen sind.

export const EDIT_PREFIX = 'protein-gym:edit:';

const MODES = [
  ['walk', 'Laufen'],
  ['sperr', 'Sperrzone ziehen'],
  ['hotspot', 'Hotspot setzen'],
  ['loeschen', 'Löschen'],
];

export function loadEdits(sceneId, storage) {
  try {
    const raw = storage && storage.getItem(EDIT_PREFIX + sceneId);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function createEditor({ toolbar, output, getScene, storage, onChange }) {
  let mode = 'walk';
  let drag = null;
  const ed = {
    get active() { return mode !== 'walk'; },
    get mode() { return mode; },
  };

  function persist() {
    const s = getScene();
    try {
      storage && storage.setItem(EDIT_PREFIX + s.id, JSON.stringify({ blocked: s.blocked, hotspots: s.hotspots }));
    } catch { /* ignorieren */ }
    onChange && onChange();
  }

  function exportJson() {
    const s = getScene();
    const text = JSON.stringify({ id: s.id, blocked: s.blocked, hotspots: s.hotspots }, null, 2);
    output.value = text;
    output.hidden = false;
    output.select();
    try { navigator.clipboard && navigator.clipboard.writeText(text); } catch { /* manuell kopieren */ }
  }

  function renderToolbar() {
    toolbar.hidden = false;
    toolbar.innerHTML = '';
    for (const [id, label] of MODES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.setAttribute('aria-pressed', String(mode === id));
      b.addEventListener('click', () => { mode = id; renderToolbar(); });
      toolbar.appendChild(b);
    }
    const ex = document.createElement('button');
    ex.type = 'button';
    ex.textContent = 'JSON ausgeben';
    ex.addEventListener('click', exportJson);
    toolbar.appendChild(ex);
    const rs = document.createElement('button');
    rs.type = 'button';
    rs.textContent = 'Änderungen verwerfen';
    rs.addEventListener('click', () => {
      try { storage && storage.removeItem(EDIT_PREFIX + getScene().id); } catch { /* ignorieren */ }
      location.reload();
    });
    toolbar.appendChild(rs);
  }

  function hitRect(p) {
    const s = getScene();
    for (let i = s.blocked.length - 1; i >= 0; i--) {
      const [x, y, w, h] = s.blocked[i];
      if (p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h) return i;
    }
    return -1;
  }

  function hitSpot(p) {
    const s = getScene();
    for (let i = s.hotspots.length - 1; i >= 0; i--) {
      const h = s.hotspots[i];
      if (Math.hypot(p.x - h.x, p.y - h.y) <= Math.max(h.r || 60, 40)) return i;
    }
    return -1;
  }

  ed.pointerDown = (p) => {
    if (mode === 'sperr') drag = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    else if (mode === 'loeschen') {
      const s = getScene();
      const hi = hitSpot(p);
      if (hi >= 0) s.hotspots.splice(hi, 1);
      else {
        const ri = hitRect(p);
        if (ri >= 0) s.blocked.splice(ri, 1);
      }
      persist();
    } else if (mode === 'hotspot') {
      const id = window.prompt('Hotspot-ID (z. B. spind):');
      if (!id) return;
      const label = window.prompt('Beschriftung:', id) || id;
      const type = window.prompt('Typ: dialog, npc, door oder task', 'dialog') || 'dialog';
      getScene().hotspots.push({ id, label, type, x: Math.round(p.x), y: Math.round(p.y), r: 70, dialog: `${getScene().id}.${id}` });
      persist();
    }
  };
  ed.pointerMove = (p) => {
    if (drag) { drag.x1 = p.x; drag.y1 = p.y; }
  };
  ed.pointerUp = () => {
    if (!drag) return;
    const x = Math.round(Math.min(drag.x0, drag.x1));
    const y = Math.round(Math.min(drag.y0, drag.y1));
    const w = Math.round(Math.abs(drag.x1 - drag.x0));
    const h = Math.round(Math.abs(drag.y1 - drag.y0));
    drag = null;
    if (w > 12 && h > 12) { getScene().blocked.push([x, y, w, h]); persist(); }
  };

  ed.overlay = (ctx) => {
    const s = getScene();
    ctx.save();
    s.blocked.forEach(([x, y, w, h], i) => {
      ctx.fillStyle = 'rgba(220,40,40,0.28)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,90,90,0.9)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText(String(i), x + 8, y + 26);
    });
    for (const h of s.hotspots) {
      ctx.strokeStyle = 'rgba(80,220,255,0.95)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r || 60, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (drag) {
      ctx.strokeStyle = '#ffeb3b';
      ctx.setLineDash([12, 8]);
      ctx.strokeRect(Math.min(drag.x0, drag.x1), Math.min(drag.y0, drag.y1), Math.abs(drag.x1 - drag.x0), Math.abs(drag.y1 - drag.y0));
    }
    ctx.restore();
  };

  renderToolbar();
  return ed;
}
