// Kleiner DOM-Baukasten: h('div', 'klasse', kind1, kind2) oder h('button', { class: 'x', onclick: fn }, 'Text').

export function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  if (typeof props === 'string') {
    e.className = props;
  } else {
    for (const [k, v] of Object.entries(props || {})) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, String(v));
    }
  }
  for (const kid of kids.flat()) if (kid != null) e.append(kid);
  return e;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
