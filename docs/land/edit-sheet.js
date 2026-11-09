/* 편집 바텀시트. 높이 세 단계: mid(화면 1/3), full(프로필 아래까지), peek(카테고리+선택한 행). */
const GRID_COLUMNS = 4;
const EDITING = { id: '__editing' }; // 섬 위의 요소를 집어 든 상태
const TREE_SIZES = [['mid', '작은'], ['full', '큰']];
const PROJECTION_MS = 220;
const CLOSE_BEYOND_PX = 70;
const HARD_FLICK_PX_PER_MS = 0.9;

export function editSheet({ R, icon, thumbs, perform, select, clear, focusPet }) {
  const placeDecor = (key) => ({
    id: key, name: R.decor[key].ko, sub: '무제한', iconName: R.decor[key].icon, thumb: `decor:${key}`,
    action: { type: 'place', item: `decor:${key}`, source: 'owned' },
  });
  const CATEGORIES = [
    {
      id: 'plant', name: '식물', grid: true, items: () => [
        { id: 'tree-sapling', name: '새싹 나무', iconName: 'TreePalm', thumb: 'tree-sapling', action: { type: 'plant-tree', variant: 0, size: 'sapling' } },
        ...TREE_SIZES.flatMap(([size, prefix]) => ['민트 큐브', '구름 나무', '두 갈래'].map((name, variant) => ({
          id: `tree-${variant}-${size}`, name: `${prefix} ${name}`, iconName: 'TreePalm', thumb: `tree-${variant}-${size}`, action: { type: 'plant-tree', variant, size },
        }))),
        placeDecor('mintTree'), placeDecor('pinkShrub'), placeDecor('flowerSpray'), placeDecor('pinkFern'),
      ],
    },
    {
      id: 'building', name: '건물', grid: true, items: () => ['house', 'bench', 'mintArch', 'food', 'toy'].map(placeDecor),
    },
    {
      id: 'pet', name: '펫', grid: true, items: () => Object.keys(R.animals).map((k) => ({
        id: k, name: R.animals[k].ko, iconName: 'PawPrint', thumb: k, action: { type: 'pet', pet: k },
      })),
    },
    {
      id: 'terrain', name: '지형', grid: true, items: () => [
        { id: 'raise', name: '땅 쌓기', sub: '탭하거나 드래그해서 쌓아요', pickedSub: '드래그하면 주르륵 쌓여요', iconName: 'Plus', action: { type: 'terrain', delta: 1 } },
        { id: 'lower', name: '땅 낮추기', sub: '탭하거나 드래그해서 낮춰요', pickedSub: '드래그하면 주르륵 낮아져요', iconName: 'Minus', action: { type: 'terrain', delta: -1 } },
        { id: 'expand', name: '땅 넓히기', sub: '누를 때마다 한 칸씩', iconName: 'Expand', expand: true },
        placeDecor('backCliff'),
      ],
    },
  ];

  const SEEDS = {
    id: 'seed', name: '씨앗', grid: true, items: () => Object.keys(R.crops).map((k) => ({
      id: `seed-${k}`, name: `${R.crops[k].ko} 씨앗`, iconName: 'Sprout', thumb: `crop:${k}`, action: { type: 'plant', kind: k },
    })),
  };
  const make = (tag, className, parent) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.append(node);
    return node;
  };
  const sheet = make('section', 'edit-sheet', document.getElementById('game-ui'));
  sheet.setAttribute('aria-label', '섬 편집');
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
    pills.replaceChildren(...(category === SEEDS ? [SEEDS] : CATEGORIES).map((c) => {
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
  function pick(item) {
    if (item.expand) {
      if (perform({ type: 'expand' })) focusPet(null, true);
      return;
    }
    if (picked?.id === item.id) {
      cancelPick();
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
    if (category === SEEDS) category = CATEGORIES[0];
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
  return { open, openSeeds, close, edit, category: () => category.id, ownsDecor: (item) => category.items().some((i) => i.action?.item === item), cancel: cancelPick, refresh: () => { if (snap !== 'closed') renderList(); }, isOpen: () => snap !== 'closed' };
}
