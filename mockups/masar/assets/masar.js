/* MASAR CRM prototype — vanilla JS: router, theme, charts (hand-drawn SVG), kanban, palette */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;

  /* ---------- theme ---------- */
  const themeBtn = $('#themeBtn');
  function applyTheme(t) { if (t) root.setAttribute('data-theme', t); else root.removeAttribute('data-theme'); try { localStorage.setItem('masar-theme', t || ''); } catch (e) {} redrawAll(); }
  try { const t = localStorage.getItem('masar-theme'); if (t) root.setAttribute('data-theme', t); } catch (e) {}
  themeBtn && themeBtn.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  /* ---------- sidebar ---------- */
  const app = $('#app');
  $('#railBtn') && $('#railBtn').addEventListener('click', () => { if (innerWidth <= 768) app.classList.toggle('menu-open'); else app.classList.toggle('rail'); });

  /* ---------- router ---------- */
  const titles = { dashboard: ['الرئيسية', 'لوحة التحكم'], leads: ['المبيعات', 'الليدز'], contact: ['المبيعات', 'ملف العميل'], funnel: ['المبيعات', 'مسار الصفقات'], approvals: ['التشغيل', 'طابور الموافقات'], bulk: ['البيانات', 'رفع ملف'], sheets: ['البيانات', 'مزامنة Google Sheets'], leaderboard: ['الفريق', 'لوحة الأبطال'], settings: ['الإعدادات', 'الفريق والصلاحيات'], login: ['', 'تسجيل الدخول'] };
  function route() {
    let h = (location.hash || '#dashboard').slice(1).split('?')[0];
    if (!titles[h]) h = 'dashboard';
    const isLogin = h === 'login';
    $('#loginView').hidden = !isLogin; $('#app').hidden = isLogin;
    $$('.view').forEach(v => v.hidden = v.id !== 'view-' + h);
    $$('.nav-item[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === h));
    const c = $('#crumbs'); if (c) c.innerHTML = (titles[h][0] ? `<span>${titles[h][0]}</span><span class="sep">/</span>` : '') + `<b>${titles[h][1]}</b>`;
    document.title = titles[h][1] + ' · Masar';
    app.classList.remove('menu-open');
    window.scrollTo(0, 0);
    requestAnimationFrame(redrawAll);
  }
  addEventListener('hashchange', route);

  /* ---------- toast ---------- */
  const toast = $('#toast'); let tt;
  window.toast = (msg) => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2400); };
  document.addEventListener('click', e => { const b = e.target.closest('[data-toast]'); if (b) { e.preventDefault(); window.toast(b.dataset.toast); } });

  /* ---------- switches / segments / chips ---------- */
  document.addEventListener('click', e => {
    const sw = e.target.closest('.switch'); if (sw) sw.classList.toggle('on');
    const sg = e.target.closest('.seg button'); if (sg) { $$('button', sg.parentElement).forEach(b => b.classList.remove('active')); sg.classList.add('active'); }
    const ch = e.target.closest('.chip[data-toggle]'); if (ch) ch.classList.toggle('on');
    const rp = e.target.closest('.role-pick button'); if (rp) { $$('button', rp.parentElement).forEach(b => b.classList.remove('on')); rp.classList.add('on'); }
  });

  /* ---------- select all ---------- */
  $$('input[data-all]').forEach(m => m.addEventListener('change', () => $$(`input[data-row="${m.dataset.all}"]`).forEach(c => c.checked = m.checked)));

  /* ---------- drawer ---------- */
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-drawer]'); if (o) { e.preventDefault(); $('#drawer').hidden = false; }
    if (e.target.closest('[data-close]') || (e.target.classList.contains('drawer'))) { $('#drawer').hidden = true; $('#palette').hidden = true; $$('.pop').forEach(p => p.hidden = true); }
  });
  $('#notifBtn') && $('#notifBtn').addEventListener('click', e => { e.stopPropagation(); const p = $('#notifPop'); p.hidden = !p.hidden; });
  document.addEventListener('click', e => { if (!e.target.closest('#notifPop') && !e.target.closest('#notifBtn')) { const p = $('#notifPop'); if (p) p.hidden = true; } });

  /* ---------- command palette ---------- */
  const pal = $('#palette'); const palIn = $('#palInput'); const palList = $('#palList');
  const cmds = [['dashboard', 'لوحة التحكم', 'G D'], ['leads', 'الليدز', 'G L'], ['funnel', 'مسار الصفقات', 'G F'], ['approvals', 'طابور الموافقات', 'G A'], ['bulk', 'رفع ملف ليدز', 'G U'], ['sheets', 'مزامنة Google Sheets', 'G S'], ['leaderboard', 'لوحة الأبطال', 'G B'], ['contact', 'فتح ملف: أحمد سمير', ''], ['settings', 'الإعدادات', ',']];
  function openPal() { pal.hidden = false; palIn.value = ''; renderPal(''); setTimeout(() => palIn.focus(), 10); }
  function renderPal(q) { palList.innerHTML = cmds.filter(c => c[1].includes(q)).map((c, i) => `<li class="${i === 0 ? 'sel' : ''}" data-go="${c[0]}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>${c[1]}<span class="k kbd">${c[2]}</span></li>`).join('') || '<li class="muted">لا نتائج</li>'; }
  $$('[data-open-palette]').forEach(b => b.addEventListener('click', openPal));
  palIn && palIn.addEventListener('input', () => renderPal(palIn.value));
  palIn && palIn.addEventListener('keydown', e => { if (e.key === 'Enter') { const s = $('li.sel', palList); if (s) { location.hash = s.dataset.go; pal.hidden = true; } } if (e.key === 'Escape') pal.hidden = true; });
  palList && palList.addEventListener('click', e => { const li = e.target.closest('li[data-go]'); if (li) { location.hash = li.dataset.go; pal.hidden = true; } });
  addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPal(); } if (e.key === 'Escape') { pal.hidden = true; $('#drawer').hidden = true; } });

  /* ---------- kanban DnD ---------- */
  let drag = null;
  $$('.kcard').forEach(c => { c.draggable = true; c.addEventListener('dragstart', () => { drag = c; c.classList.add('dragging'); }); c.addEventListener('dragend', () => { c.classList.remove('dragging'); drag = null; $$('.col').forEach(x => x.classList.remove('over')); }); });
  $$('.col').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
    col.addEventListener('dragleave', () => col.classList.remove('over'));
    col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); if (drag) { $('.col-body', col).prepend(drag); recount(); const stage = $('.col-head b', col).textContent; if (col.dataset.needsApproval) window.toast('تم إرسال طلب موافقة لقائد الفريق للنقل إلى «' + stage + '»'); else window.toast('تم نقل ' + $('.t', drag).textContent + ' إلى «' + stage + '»'); } });
  });
  function recount() { $$('.col').forEach(col => { const n = $$('.kcard', col).length; $('.col-head .n', col).textContent = n; }); }

  /* ---------- charts ---------- */
  const css = (v) => getComputedStyle(root).getPropertyValue(v).trim();
  const tip = $('#tip');
  function showTip(e, html) { tip.innerHTML = html; tip.classList.add('show'); moveTip(e); }
  function moveTip(e) { const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 14, y = e.clientY - h - 10; if (x + w > innerWidth - 8) x = e.clientX - w - 14; if (y < 8) y = e.clientY + 16; tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
  function hideTip() { tip.classList.remove('show'); }
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}, txt) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; return e; };
  const fmt = n => n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0) + 'k' : String(n);

  /* multi-series area/line */
  function areaChart(host) {
    const d = JSON.parse(host.dataset.chart); const W = host.clientWidth || 600, H = host.clientHeight || 260; const P = { t: 12, r: 8, b: 26, l: 36 };
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}` }); host.innerHTML = ''; host.appendChild(svg);
    const max = Math.ceil(Math.max(...d.series.flatMap(s => s.values)) / d.step) * d.step;
    const x = i => P.l + i * (W - P.l - P.r) / (d.labels.length - 1); const y = v => P.t + (H - P.t - P.b) * (1 - v / max);
    const g = el('g', { class: 'grid' }); svg.appendChild(g);
    for (let v = 0; v <= max; v += d.step) { g.appendChild(el('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v) })); svg.appendChild(el('text', { x: P.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, fmt(v))); }
    d.labels.forEach((l, i) => { if (d.labels.length > 14 && i % 2) return; svg.appendChild(el('text', { x: x(i), y: H - 6, 'text-anchor': 'middle' }, l)); });
    d.series.forEach((s, si) => {
      const col = css('--cat-' + (si + 1)); const pts = s.values.map((v, i) => [x(i), y(v)]);
      const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      if (s.area !== false) { const gid = 'ga' + si + Math.random().toString(36).slice(2, 6); const defs = el('defs'); const lg = el('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }); lg.appendChild(el('stop', { offset: '0%', 'stop-color': col, 'stop-opacity': .28 })); lg.appendChild(el('stop', { offset: '100%', 'stop-color': col, 'stop-opacity': 0 })); defs.appendChild(lg); svg.appendChild(defs); svg.appendChild(el('path', { d: path + ` L${x(pts.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`, fill: `url(#${gid})` })); }
      svg.appendChild(el('path', { d: path, fill: 'none', stroke: col, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-dasharray': s.dashed ? '4 4' : '' }));
      const last = pts[pts.length - 1]; svg.appendChild(el('circle', { cx: last[0], cy: last[1], r: 4, fill: col, stroke: css('--surface'), 'stroke-width': 2 }));
    });
    /* hover */
    const cross = el('line', { y1: P.t, y2: H - P.b, stroke: css('--border-2'), 'stroke-dasharray': '3 3', opacity: 0 }); svg.appendChild(cross);
    const dots = d.series.map((s, si) => { const c = el('circle', { r: 5, fill: css('--cat-' + (si + 1)), stroke: css('--surface'), 'stroke-width': 2, opacity: 0 }); svg.appendChild(c); return c; });
    const hit = el('rect', { x: P.l, y: 0, width: W - P.l - P.r, height: H, fill: 'transparent' }); svg.appendChild(hit);
    hit.addEventListener('mousemove', e => { const r = svg.getBoundingClientRect(); const px = (e.clientX - r.left) * W / r.width; let i = Math.round((px - P.l) / ((W - P.l - P.r) / (d.labels.length - 1))); i = Math.max(0, Math.min(d.labels.length - 1, i)); cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', 1); dots.forEach((c, si) => { c.setAttribute('cx', x(i)); c.setAttribute('cy', y(d.series[si].values[i])); c.setAttribute('opacity', 1); }); showTip(e, `<b>${d.labels[i]}</b>` + d.series.map((s, si) => `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${css('--cat-' + (si + 1))};margin-inline-end:6px"></span>${s.name}: ${s.values[i].toLocaleString('en')}${d.unit || ''}`).join('<br>')); });
    hit.addEventListener('mouseleave', () => { cross.setAttribute('opacity', 0); dots.forEach(c => c.setAttribute('opacity', 0)); hideTip(); });
  }

  /* grouped/stacked bars */
  function barChart(host) {
    const d = JSON.parse(host.dataset.chart); const W = host.clientWidth || 600, H = host.clientHeight || 260; const P = { t: 12, r: 8, b: 26, l: 36 };
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}` }); host.innerHTML = ''; host.appendChild(svg);
    const stacked = d.stacked; const totals = d.labels.map((_, i) => stacked ? d.series.reduce((a, s) => a + s.values[i], 0) : Math.max(...d.series.map(s => s.values[i])));
    const max = Math.ceil(Math.max(...totals) / d.step) * d.step; const y = v => P.t + (H - P.t - P.b) * (1 - v / max);
    const g = el('g', { class: 'grid' }); svg.appendChild(g);
    for (let v = 0; v <= max; v += d.step) { g.appendChild(el('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v) })); svg.appendChild(el('text', { x: P.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, fmt(v))); }
    const slot = (W - P.l - P.r) / d.labels.length; const bw = Math.min(28, slot * .6 / (stacked ? 1 : d.series.length));
    d.labels.forEach((l, i) => {
      svg.appendChild(el('text', { x: P.l + slot * (i + .5), y: H - 6, 'text-anchor': 'middle' }, l));
      let acc = 0;
      d.series.forEach((s, si) => {
        const col = css('--cat-' + (si + 1)); const v = s.values[i]; let bx, by, bh;
        if (stacked) { bx = P.l + slot * (i + .5) - bw / 2; by = y(acc + v); bh = y(acc) - y(acc + v) - (acc ? 2 : 0); acc += v; } else { bx = P.l + slot * (i + .5) - (bw * d.series.length + 2 * (d.series.length - 1)) / 2 + si * (bw + 2); by = y(v); bh = y(0) - y(v); }
        const r = el('rect', { x: bx, y: by, width: bw, height: Math.max(0, bh), fill: col, rx: 3 }); svg.appendChild(r);
        r.addEventListener('mousemove', e => { r.setAttribute('opacity', .8); showTip(e, `<b>${l} · ${s.name}</b>${v.toLocaleString('en')}${d.unit || ''}`); }); r.addEventListener('mouseleave', () => { r.setAttribute('opacity', 1); hideTip(); });
      });
    });
  }

  /* donut */
  function donut(host) {
    const d = JSON.parse(host.dataset.chart); const S = 160, R = 64, w = 18; const svg = el('svg', { viewBox: `0 0 ${S} ${S}` }); host.innerHTML = ''; host.appendChild(svg);
    const total = d.values.reduce((a, b) => a + b, 0); let a0 = -Math.PI / 2; const C = 2 * Math.PI * R;
    d.values.forEach((v, i) => { const frac = v / total; const c = el('circle', { cx: S / 2, cy: S / 2, r: R, fill: 'none', stroke: css('--cat-' + (i + 1)), 'stroke-width': w, 'stroke-dasharray': `${Math.max(0, C * frac - 3)} ${C}`, 'stroke-dashoffset': -(C * ((a0 + Math.PI / 2) / (2 * Math.PI))), 'stroke-linecap': 'butt' }); c.style.transform = 'rotate(-90deg)'; c.style.transformOrigin = '50% 50%'; svg.appendChild(c); c.addEventListener('mousemove', e => showTip(e, `<b>${d.labels[i]}</b>${v.toLocaleString('en')} · ${Math.round(frac * 100)}%`)); c.addEventListener('mouseleave', hideTip); a0 += frac * 2 * Math.PI; });
    svg.appendChild(el('text', { x: S / 2, y: S / 2 - 2, 'text-anchor': 'middle', style: 'font-size:22px;font-weight:700;fill:' + css('--text') }, total.toLocaleString('en')));
    svg.appendChild(el('text', { x: S / 2, y: S / 2 + 16, 'text-anchor': 'middle' }, d.center || ''));
  }

  /* semicircle gauge */
  function gauge(host) {
    const pct = +host.dataset.pct; const W = 240, H = 130, R = 100, cx = 120, cy = 120; const svg = el('svg', { viewBox: `0 0 ${W} ${H}` }); host.innerHTML = ''; host.appendChild(svg);
    const arc = (p) => { const a = Math.PI * (1 - p); const x = cx + R * Math.cos(a), y = cy - R * Math.sin(a); return [x, y]; };
    const [ex, ey] = arc(1); svg.appendChild(el('path', { d: `M${cx - R} ${cy} A${R} ${R} 0 0 1 ${ex} ${ey}`, fill: 'none', stroke: 'rgba(255,255,255,.22)', 'stroke-width': 16, 'stroke-linecap': 'round' }));
    const [px, py] = arc(pct / 100); svg.appendChild(el('path', { d: `M${cx - R} ${cy} A${R} ${R} 0 0 1 ${px} ${py}`, fill: 'none', stroke: '#fff', 'stroke-width': 16, 'stroke-linecap': 'round' }));
    svg.appendChild(el('circle', { cx: px, cy: py, r: 6, fill: '#fff', stroke: 'rgba(0,0,0,.15)', 'stroke-width': 2 }));
    const big = document.createElement('div'); big.className = 'big'; big.innerHTML = `<b>${pct}%</b><span>${host.dataset.label || ''}</span>`; host.appendChild(big);
  }

  /* sparkline */
  function spark(host) {
    const v = host.dataset.spark.split(',').map(Number); const W = host.clientWidth || 120, H = host.clientHeight || 36; const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none' }); host.innerHTML = ''; host.appendChild(svg);
    const max = Math.max(...v), min = Math.min(...v); const x = i => i * W / (v.length - 1); const y = n => 4 + (H - 8) * (1 - (n - min) / ((max - min) || 1));
    const path = v.map((n, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(n)).join(' '); const col = host.dataset.color === 'down' ? css('--critical') : css('--brand-500');
    svg.appendChild(el('path', { d: path + ` L${W} ${H} L0 ${H} Z`, fill: col, opacity: .12 })); svg.appendChild(el('path', { d: path, fill: 'none', stroke: col, 'stroke-width': 1.8, 'vector-effect': 'non-scaling-stroke' }));
    svg.appendChild(el('circle', { cx: x(v.length - 1), cy: y(v[v.length - 1]), r: 3, fill: col }));
  }

  /* horizontal funnel bars */
  function hbars(host) {
    const d = JSON.parse(host.dataset.chart); host.innerHTML = ''; const max = Math.max(...d.values);
    d.labels.forEach((l, i) => { const row = document.createElement('div'); row.style.cssText = 'display:grid;grid-template-columns:110px 1fr 60px;align-items:center;gap:10px;font-size:12.5px;margin:7px 0'; row.innerHTML = `<span class="t2">${l}</span><div class="bar" style="width:100%;height:10px"><i style="width:${d.values[i] / max * 100}%;background:${css('--cat-' + ((d.color || 1)))};opacity:${1 - i * .12}"></i></div><b class="num" style="text-align:end">${d.values[i].toLocaleString('en')}</b>`; host.appendChild(row); });
  }

  function redrawAll() {
    $$('[data-chart-type="area"]').forEach(h => { if (h.offsetParent) areaChart(h); });
    $$('[data-chart-type="bar"]').forEach(h => { if (h.offsetParent) barChart(h); });
    $$('[data-chart-type="donut"]').forEach(h => { if (h.offsetParent) donut(h); });
    $$('[data-chart-type="hbars"]').forEach(h => { if (h.offsetParent) hbars(h); });
    $$('[data-pct]').forEach(h => { if (h.offsetParent) gauge(h); });
    $$('[data-spark]').forEach(h => { if (h.offsetParent) spark(h); });
  }
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(redrawAll, 120); });
  document.addEventListener('mousemove', e => { if (tip.classList.contains('show')) moveTip(e); });

  document.fonts && document.fonts.ready.then(redrawAll);
  route();
})();
