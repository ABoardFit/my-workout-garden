/* 잠긴 땅 해금: 카운트다운 라벨, 중앙 팝업, 자동 해금. */
const TICK_MS = 250;

function formatRemaining(ms) {
  const total = Math.ceil(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, '0');
  if (hours >= 24) return `${Math.floor(hours / 24)}일 ${hours % 24}시간`;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`;
  return `${minutes}:${seconds}`;
}

export function expansion({ T, camera, renderer, terrain, R, getState, perform, notify, isReady }) {
  const host = document.getElementById('game-ui');
  const make = (tag, className, parent, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    if (parent) parent.append(node);
    return node;
  };

  const label = make('button', 'expand-timer', host);
  label.type = 'button';
  label.hidden = true;
  label.addEventListener('click', (e) => { e.stopPropagation(); open(); });

  const backdrop = make('div', 'expand-backdrop', host);
  backdrop.hidden = true;
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-label', '땅 확장');
  backdrop.addEventListener('click', (e) => { e.stopPropagation(); if (e.target === backdrop) close(); });
  const card = make('div', 'expand-card', backdrop);
  make('h2', 'expand-title', card, '땅이 열리기까지');
  const countdown = make('p', 'expand-countdown', card);
  make('p', 'expand-note', card, '시간이 지나면 자동으로 열려요');
  const payButton = make('button', 'expand-pay', card);
  payButton.type = 'button';
  payButton.addEventListener('click', (e) => { e.stopPropagation(); pay(); });
  const closeButton = make('button', 'expand-close', card, '닫기');
  closeButton.type = 'button';
  closeButton.addEventListener('click', (e) => { e.stopPropagation(); close(); });

  const hasRing = () => getState().expansion < R.MAX_EXPANSION;
  const remaining = () => Math.max(0, getState().expandReady - Date.now());

  function renderCountdown() {
    const left = remaining();
    const text = formatRemaining(left);
    label.textContent = text;
    if (backdrop.hidden) return;
    const cost = R.expandCost(getState(), Date.now());
    countdown.textContent = text;
    payButton.textContent = `${cost.toLocaleString('ko-KR')} P로 지금 넓히기`;
    payButton.disabled = getState().coins < cost;
  }
  function open() {
    if (!hasRing()) return;
    backdrop.hidden = false;
    renderCountdown();
  }
  function close() {
    backdrop.hidden = true;
  }
  function pay() {
    if (perform({ type: 'expand', paid: true })) {
      close();
      notify('땅이 넓어졌어요!');
    }
  }

  function tick() {
    if (!isReady()) return;
    if (!hasRing()) {
      label.hidden = true;
      close();
      return;
    }
    if (Date.now() >= getState().expandReady) {
      perform({ type: 'expand', auto: true });
      close();
    }
    renderCountdown();
  }
  setInterval(tick, TICK_MS);

  /* 라벨은 잠긴 땅에서 화면상 가장 아래쪽 지점 바로 밑에 붙는다 */
  const point = new T.Vector3();
  function layout() {
    requestAnimationFrame(layout);
    const cells = terrain.lockCells || [];
    if (!cells.length || !hasRing() || !isReady()) {
      label.hidden = true;
      return;
    }
    const r = renderer.domElement.getBoundingClientRect();
    let bestX = 0;
    let bestY = -Infinity;
    for (const [cx, cz] of cells) {
      point.set(cx * 0.8, -0.2, cz * 0.8).project(camera);
      const y = ((1 - point.y) * r.height) / 2;
      if (y > bestY) {
        bestY = y;
        bestX = ((point.x + 1) * r.width) / 2;
      }
    }
    label.hidden = false;
    label.style.transform = `translate(${bestX}px,${bestY + 18}px) translateX(-50%)`;
  }
  requestAnimationFrame(layout);

  return { open, close, isOpen: () => !backdrop.hidden };
}
