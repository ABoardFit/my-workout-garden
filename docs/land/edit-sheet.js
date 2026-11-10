/* 편집 바텀시트. 높이 세 단계: mid(화면 1/3), full(프로필 아래까지), peek(카테고리+선택한 행). */
const GRID_COLUMNS = 4;
const EDITING = { id: '__editing' }; // 섬 위의 요소를 집어 든 상태
const TREE_SIZES = [['mid', tr('land.edit.sheet.0002')], ['full', tr('land.edit.sheet.0003')]];
const PROJECTION_MS = 220;
const CLOSE_BEYOND_PX = 70;
const HARD_FLICK_PX_PER_MS = 0.9;

export function editSheet({ R, icon, thumbs, perform, select, clear, focusPet, getState, onDetail }) {
  const placeDecor = (key) => ({
    id: key, name: R.decor[key].ko, sub: tr('land.edit.sheet.0004'), iconName: R.decor[key].icon, thumb: `decor:${key}`,
    action: { type: 'place', item: `decor:${key}`, source: 'owned' },
  });
  const CATEGORIES = [
    {
      id: 'plant', name: tr('land.edit.sheet.0005'), grid: true, items: () => [
        { id: 'tree-sapling', name: tr('land.edit.sheet.0006'), iconName: 'TreePalm', thumb: 'tree-sapling', action: { type: 'plant-tree', variant: 0, size: 'sapling' } },
        ...TREE_SIZES.flatMap(([size, prefix]) => [tr('land.edit.sheet.0007'), tr('land.edit.sheet.0008'), tr('land.edit.sheet.0009')].map((name, variant) => ({
          id: `tree-${variant}-${size}`, name: `${prefix} ${name}`, iconName: 'TreePalm', thumb: `tree-${variant}-${size}`, action: { type: 'plant-tree', variant, size },
        }))),
        placeDecor('mintTree'), placeDecor('pinkShrub'), placeDecor('flowerSpray'), placeDecor('pinkFern'),
      ],
    },
    {
      id: 'building', name: tr('land.edit.sheet.0010'), grid: true, items: () => ['house', 'bench', 'mintArch', 'food', 'toy'].map(placeDecor),
    },
    {
      id: 'pet', name: tr('land.edit.sheet.0011'), grid: true, items: () => Object.keys(R.animals).filter((k) => getState().pets[k]).map((k) => ({
        id: k, name: R.animals[k].ko, iconName: 'PawPrint', thumb: k, action: { type: 'pet', pet: k },
      })),
    },
    {
      id: 'terrain', name: tr('land.edit.sheet.0012'), grid: true, items: () => [
        { id: 'raise', name: tr('land.edit.sheet.0013'), sub: tr('land.edit.sheet.0014'), pickedSub: tr('land.edit.sheet.0015'), iconName: 'Plus', action: { type: 'terrain', delta: 1 } },
        { id: 'lower', name: tr('land.edit.sheet.0016'), sub: tr('land.edit.sheet.0017'), pickedSub: tr('land.edit.sheet.0018'), iconName: 'Minus', action: { type: 'terrain', delta: -1 } },
        { id: 'expand', name: tr('land.edit.sheet.0019'), sub: tr('land.edit.sheet.0020'), iconName: 'Expand', expand: true },
        placeDecor('backCliff'),
      ],
    },
  ];

  const SEEDS = {
    id: 'seed', name: tr('land.edit.sheet.0021'), grid: true, items: () => Object.keys(R.crops).map((k) => ({
      id: `seed-${k}`, group: 'seed', kind: k, detail: true, count: R.bagOf(getState()).seed[k] || 0, name: tr('land.edit.sheet.0022',{v0:R.crops[k].ko}), iconName: 'Sprout', thumb: `crop:${k}`, action: { type: 'plant', kind: k },
    })),
  };
  const held = (group) => Object.entries(R.bagOf(getState())[group]).filter(([, n]) => n > 0);
  const OWN_BUILDINGS = {
    id: 'own-building', name: tr('land.edit.sheet.0010'), grid: true, empty: tr('land.edit.sheet.0023'), items: () => held('building').map(([k, count]) => ({
      id: `own-building-${k}`, group: 'building', kind: k, detail: true, count, name: R.decor[k].ko, iconName: R.decor[k].icon, thumb: `decor:${k}`, action: { type: 'place', item: `decor:${k}`, source: 'owned', bag: true },
    })),
  };
  const OWN_PETS = {
    id: 'own-pet', name: tr('land.edit.sheet.0011'), grid: true, empty: tr('land.edit.sheet.0024'), items: () => held('pet').map(([k, count]) => ({
      id: `own-pet-${k}`, group: 'pet', kind: k, detail: true, count, name: R.animals[k].ko, iconName: 'PawPrint', thumb: k, action: { type: 'pet', pet: k },
    })),
  };
  const OWNED = [SEEDS, OWN_BUILDINGS, OWN_PETS];
  const make = (tag, className, parent) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.append(node);
    return node;
  };
  const sheet = make('section', 'edit-sheet', document.getElementById('game-ui'));
  sheet.setAttribute('aria-label', tr('land.edit.sheet.0025'));
  const head = make('div', 'edit-head', sheet);
  make('div', 'edit-grip', head);
  const pills = make('div', 'edit-pills', head);
  pills.setAttribute('role', 'tablist');
  const list = make('div', 'edit-list', sheet);

  let category = CATEGORIES[0];
  let snap = 'closed';
  let picked = null;
  let currentY = 0;
  let dragMoved = false;

  const hostHeight = () => sheet.parentElement.clientHeight;
  const fullTop = () => document.getElementById('member-profile').getBoundingClientRect().bottom + 8;
  const sheetHeight = () => hostHeight() - fullTop();

  function visibleHeight(name) {
    if (name === 'full') return sheetHeight();
    if (name === 'peek' || name === 'row') {
      const row = list.querySelector('.edit-grid-row');
      return head.offsetHeight + (row ? row.offsetHeight : 0) + 20;
    }
    return Math.round(hostHeight() * 0.3);
  }
  function moveTo(y, animate) {
    currentY = y;
    sheet.classList.toggle('edit-dragging', !animate);
    sheet.style.transform = `translateY(${y}px)`;
    /* 올라온 만큼 목록도 함께 늘어나 가려졌던 품목이 바로 보인다 */
    list.style.height = `${Math.max(0, sheetHeight() - y - head.offsetHeight)}px`;
  }
  function applySnap(name) {
    snap = name;
    document.body.classList.toggle('sheet-on', name !== 'closed');
    sheet.classList.toggle('edit-open', name !== 'closed');
    if (name === 'closed') {
      moveTo(sheet.offsetHeight + 24, true);
      return;
    }
    const total = sheetHeight();
    sheet.style.height = `${total}px`;
    moveTo(total - visibleHeight(name), true);
  }

  function renderPills() {
    pills.replaceChildren(...(OWNED.includes(category) ? OWNED : CATEGORIES).map((c) => {
      const b = make('button', 'edit-pill');
      b.type = 'button';
      b.textContent = c.name;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(c === category));
      b.addEventListener('click', () => {
        if (dragMoved) return;
        category = c;
        release();
        renderList();
        renderPills();
        list.scrollTop = 0;
        applySnap(snap === 'full' ? 'full' : 'mid');
      });
      return b;
    }));
    const active = pills.querySelector('[aria-selected="true"]');
    if (active.offsetLeft < pills.scrollLeft) pills.scrollLeft = active.offsetLeft - 16;
    else if (active.offsetLeft + active.offsetWidth > pills.scrollLeft + pills.clientWidth) pills.scrollLeft = active.offsetLeft + active.offsetWidth - pills.clientWidth + 16;
  }
  function fillPreview(tile, item) {
    if (item.thumb && thumbs[item.thumb]) {
      const img = make('img', '', tile);
      img.alt = '';
      img.src = thumbs[item.thumb];
    } else {
      tile.insertAdjacentHTML('beforeend', icon(item.iconName));
    }
  }
  function renderTile(item) {
    const b = make('button', 'edit-grid-tile');
    b.type = 'button';
    b.title = item.name;
    b.setAttribute('aria-label', item.name);
    b.setAttribute('aria-pressed', String(picked?.id === item.id));
    fillPreview(b, item);
    if (item.detail) {
      make('small', 'edit-count', b).textContent = item.count;
      b.classList.toggle('edit-empty', item.count < 1);
    }
    b.addEventListener('click', () => pick(item));
    return b;
  }
  function renderList(showAll = false) {
    const items = category.items();
    const peeking = !!picked && picked !== EDITING && !showAll;
    list.classList.toggle('edit-peek', peeking);
    const rows = [];
    for (let i = 0; i < items.length; i += GRID_COLUMNS) rows.push(items.slice(i, i + GRID_COLUMNS));
    const shown = peeking ? rows.filter((r) => r.some((item) => item.id === picked.id)) : rows;
    if (!items.length && category.empty) {
      const note = make('p', 'edit-empty-note');
      note.textContent = category.empty;
      list.replaceChildren(note);
      return;
    }
    list.replaceChildren(...shown.map((r) => {
      const row = make('div', 'edit-grid-row');
      row.append(...r.map(renderTile));
      return row;
    }));
  }
  function release() {
    if (picked) clear();
    picked = null;
  }
  function cancelPick() {
    release();
    renderList();
    applySnap('mid');
  }
  function pick(item, chosen = false) {
    if (item.expand) {
      if (perform({ type: 'expand' })) focusPet(null, true);
      return;
    }
    if (picked?.id === item.id) {
      cancelPick();
      return;
    }
    if (item.detail && !chosen) {
      onDetail(item);
      return;
    }
    if (picked) clear();
    picked = item;
    select(item.action);
    renderList();
    list.scrollTop = 0;
    applySnap('peek');
  }

  /* 머리 부분: 세로로 끌면 시트 높이, 가로로 끌면 알약 스크롤 */
  let drag = null;
  head.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, startY: currentY, scroll: pills.scrollLeft, axis: null, lastY: e.clientY, lastT: e.timeStamp, velocity: 0 };
    dragMoved = false;
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.axis && Math.hypot(dx, dy) > 6) {
      drag.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
      dragMoved = true;
      if (drag.axis === 'y' && snap === 'peek' && dy < 0) renderList(true);
    }
    if (drag.axis === 'x') pills.scrollLeft = drag.scroll - dx;
    if (drag.axis === 'y') {
      const dt = e.timeStamp - drag.lastT;
      if (dt > 0) drag.velocity = drag.velocity * 0.6 + ((e.clientY - drag.lastY) / dt) * 0.4;
      drag.lastY = e.clientY;
      drag.lastT = e.timeStamp;
      moveTo(Math.max(0, drag.startY + dy), false);
    }
  });
  function endDrag() {
    if (!drag) return;
    const finished = drag;
    drag = null;
    setTimeout(() => { dragMoved = false; }, 0);
    if (finished.axis !== 'y') return;
    const total = sheetHeight();
    /* 놓는 순간의 속도로 멈출 위치를 예측해 가장 가까운 높이로 보낸다 */
    const projected = currentY + finished.velocity * PROJECTION_MS;
    const lowName = picked ? 'peek' : 'row';
    const stops = [['full', 0], ['mid', total - visibleHeight('mid')], [lowName, total - visibleHeight(lowName)]];
    if (finished.velocity > HARD_FLICK_PX_PER_MS || (snap === 'row' && projected > stops[2][1] + CLOSE_BEYOND_PX)) {
      close();
      return;
    }
    const [target] = stops.reduce((best, stop) => (Math.abs(stop[1] - projected) < Math.abs(best[1] - projected) ? stop : best));
    if (target !== 'peek') release();
    renderList();
    applySnap(target);
  }
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);
  pills.addEventListener('wheel', (e) => {
    pills.scrollLeft += e.deltaY || e.deltaX;
  }, { passive: true });
  addEventListener('resize', () => { if (snap !== 'closed') applySnap(snap); });

  function openSeeds() {
    if (snap !== 'closed') release();
    picked = null;
    category = SEEDS;
    renderPills();
    renderList();
    applySnap('mid');
  }
  function open() {
    picked = null;
    if (OWNED.includes(category)) category = CATEGORIES[0];
    renderPills();
    renderList();
    applySnap('mid');
  }
  function close() {
    if (snap === 'closed') return;
    release();
    applySnap('closed');
  }
  moveTo(4000, false);
  function edit() {
    picked = EDITING;
    renderList();
    list.scrollTop = 0;
    applySnap('peek');
  }
  return { open, openSeeds, close, edit, category: () => category.id, ownsDecor: (item) => category.items().some((i) => i.action?.item === item) || (['building', 'own-building'].includes(category.id) && !!R.GACHA.pools.building[item.slice(6)]), cancel: cancelPick, choose: (item) => pick(item, true), refresh: () => {
    if (snap === 'closed') return;
    if (picked?.detail && !category.items().some((i) => i.id === picked.id && i.count > 0)) { cancelPick(); return; }
    renderList();
  }, isOpen: () => snap !== 'closed' };
}
