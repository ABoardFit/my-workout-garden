/* 상점(식물·건물·펫), 뽑기 연출, 보유 아이템 팝업, 구역 보상 팝업 */
const RANK = ['common', 'uncommon', 'rare', 'legendary'];

export function shopUi({ R, icon, thumbs, getState, perform, notify, send, isReady, closeSheet, choose }) {
  const host = document.getElementById('game-ui');
  const make = (tag, className, parent, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    if (parent) parent.append(node);
    return node;
  };
  const button = (className, parent, text, onClick) => {
    const b = make('button', className, parent, text);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  };
  const layer = (name, label) => {
    const node = make('div', `game-layer ${name}`, host);
    node.hidden = true;
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-modal', 'true');
    node.setAttribute('aria-label', label);
    node.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === node && !node.classList.contains('gacha-stage')) node.hidden = true;
    });
    return node;
  };
  const closeIcon = (parent, onClick) => {
    const b = button('shop-close', parent, undefined, onClick);
    b.setAttribute('aria-label', tr('land.expansion.0030'));
    b.insertAdjacentHTML('beforeend', icon('X'));
  };
  const points = (n) => `${I18n.number(n)} P`;
  const nameOf = (group, kind) => (group === 'seed' ? tr('land.edit.sheet.0022',{v0:R.crops[kind].ko}) : group === 'building' ? R.decor[kind].ko : R.animals[kind].ko);
  const thumbKey = (group, kind) => (group === 'seed' ? `crop:${kind}` : group === 'building' ? `decor:${kind}` : kind);
  const fallback = { seed: 'Sprout', building: 'House', pet: 'PawPrint' };
  function preview(parent, group, kind) {
    const src = thumbs[thumbKey(group, kind)];
    if (src) {
      const img = make('img', '', parent);
      img.alt = '';
      img.src = src;
    } else parent.insertAdjacentHTML('beforeend', icon(fallback[group]));
  }
  const chip = (parent, rarity) => make('span', `rarity-chip rarity-${rarity}`, parent, R.rarities[rarity].ko);

  /* 상점 */
  const shopLayer = layer('shop-layer', tr('land.shop.ui.0202'));
  const shopCard = make('div', 'game-card shop-card', shopLayer);
  const TABS = [['plant', tr('land.edit.sheet.0005')], ['building', tr('land.edit.sheet.0010')], ['pet', tr('land.edit.sheet.0011')]];
  let tab = 'plant';

  function renderShop() {
    const keep = shopCard.querySelector('.shop-body')?.scrollTop || 0;
    shopCard.replaceChildren();
    const head = make('div', 'shop-head', shopCard);
    make('h2', '', head, tr('land.shop.ui.0202'));
    make('span', 'shop-wallet', head, points(getState().coins));
    closeIcon(head, () => { shopLayer.hidden = true; });
    const tabs = make('div', 'shop-tabs', shopCard);
    tabs.setAttribute('role', 'tablist');
    for (const [id, label] of TABS) {
      const b = button('edit-pill', tabs, label, () => { tab = id; renderShop(); });
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(tab === id));
    }
    const body = make('div', 'shop-body', shopCard);
    if (tab === 'plant') renderSeeds(body);
    else renderGacha(body, tab);
    body.scrollTop = keep;
  }
  function renderSeeds(body) {
    const bag = R.bagOf(getState()).seed;
    for (const kind of Object.keys(R.crops)) {
      const row = make('div', 'shop-row', body);
      preview(make('span', 'shop-thumb', row), 'seed', kind);
      const copy = make('span', 'shop-copy', row);
      make('strong', '', copy, nameOf('seed', kind));
      const meta = make('small', '', copy);
      chip(meta, R.crops[kind].rarity);
      meta.append(tr('land.shop.ui.0203',{v0:bag[kind] || 0}));
      const price = R.SEED_PRICES[kind];
      const buy = button('shop-buy', row, points(price), () => {
        if (perform({ type: 'buy-seed-kind', kind })) { renderShop(); notify(tr('land.shop.ui.0204',{v0:nameOf('seed', kind)})); }
      });
      buy.disabled = getState().coins < price;
    }
  }
  function renderGacha(body, pool) {
    const showcase = make('div', 'gacha-showcase', body);
    makeOrb(showcase, pool);
    const lineup = make('div', 'gacha-lineup', body);
    for (const [kind, rarity] of Object.entries(R.GACHA.pools[pool])) {
      const tile = make('span', `gacha-mini rarity-border-${rarity}`, lineup);
      tile.title = nameOf(pool, kind);
      preview(tile, pool, kind);
    }
    const coins = getState().coins;
    const row = make('div', 'gacha-buttons', body);
    const single = button('gacha-pull', row, undefined, () => pull(pool, 1));
    make('strong', '', single, tr('land.shop.ui.0205'));
    make('small', '', single, points(R.GACHA.price));
    single.disabled = coins < R.GACHA.price;
    const ten = button('gacha-pull gacha-pull-ten', row, undefined, () => pull(pool, 11));
    make('strong', '', ten, tr('land.shop.ui.0206'));
    make('small', '', ten, points(R.GACHA.tenPrice));
    ten.disabled = coins < R.GACHA.tenPrice;
    make('p', 'gacha-promise', body, tr('land.shop.ui.0207'));
    make('p', 'gacha-rates', body, RANK.map((k) => `${R.rarities[k].ko} ${Math.round(R.GACHA.rates[k] * 100)}%`).join(' · '));
  }
  function makeOrb(parent, pool) {
    const orb = make('div', `gacha-orb gacha-orb-${pool}`, parent);
    make('span', 'gacha-orb-mark', orb);
    make('span', 'gacha-orb-mark', orb);
    make('span', 'gacha-orb-mark', orb);
    return orb;
  }
  function open() {
    if (!isReady()) { notify(tr('land.gameplay.0078')); return; }
    closeSheet();
    tab = 'plant';
    renderShop();
    shopLayer.hidden = false;
  }
  document.getElementById('shop-open').addEventListener('click', (e) => { e.stopPropagation(); open(); });

  /* 뽑기 연출 */
  const stage = layer('gacha-stage', tr('land.shop.ui.0208'));
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let skip = null;
  stage.addEventListener('click', () => { if (skip) skip(); });

  function pull(pool, count) {
    if (!perform({ type: 'gacha', pool, count })) return;
    renderShop();
    playPull(pool, count, getState().lastPull.items);
  }
  function playPull(pool, count, items) {
    stage.replaceChildren();
    stage.hidden = false;
    const best = items.reduce((top, item) => Math.max(top, RANK.indexOf(item.rarity)), 0);
    if (reduced()) { reveal(pool, count, items); return; }
    const wrap = make('div', 'gacha-center', stage);
    const glow = make('div', `gacha-glow rarity-glow-${RANK[best]}`, wrap);
    const orb = makeOrb(wrap, pool);
    make('p', 'gacha-tap', wrap, tr('land.shop.ui.0209'));
    const shake = orb.animate([
      { transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-5deg) scale(1.02)', offset: 0.12 }, { transform: 'rotate(5deg) scale(1.02)', offset: 0.24 },
      { transform: 'rotate(-9deg) scale(1.06)', offset: 0.38 }, { transform: 'rotate(9deg) scale(1.06)', offset: 0.52 }, { transform: 'rotate(-14deg) scale(1.12)', offset: 0.66 },
      { transform: 'rotate(14deg) scale(1.16)', offset: 0.8 }, { transform: 'rotate(0) scale(1.42)', offset: 0.92 }, { transform: 'rotate(0) scale(.2)', opacity: 0 },
    ], { duration: 1500, easing: 'ease-in', fill: 'forwards' });
    glow.animate([{ opacity: 0.15, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.5)' }], { duration: 1500, easing: 'ease-in', fill: 'forwards' });
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      skip = null;
      shake.cancel();
      const flash = make('div', 'gacha-flash', stage);
      flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-out' }).finished.catch(() => {}).finally(() => flash.remove());
      wrap.remove();
      reveal(pool, count, items);
    };
    skip = finish;
    shake.finished.then(finish).catch(() => {});
  }
  function reveal(pool, count, items) {
    const result = make('div', 'gacha-result', stage);
    make('h2', '', result, count === 1 ? tr('land.shop.ui.0208') : tr('land.shop.ui.0210'));
    const grid = make('div', `gacha-cards ${count === 1 ? 'gacha-cards-one' : ''}`, result);
    items.forEach((item, i) => {
      const card = make('div', `gacha-card rarity-border-${item.rarity}`, grid);
      if (RANK.indexOf(item.rarity) >= 2) card.classList.add('gacha-card-shine');
      if (item.guaranteed) make('span', 'gacha-sure', card, tr('land.shop.ui.0211'));
      preview(make('span', 'gacha-art', card), pool, item.kind);
      make('strong', '', card, nameOf(pool, item.kind));
      chip(card, item.rarity);
      if (!reduced()) card.animate([{ opacity: 0, transform: 'perspective(400px) rotateY(90deg) scale(.8)' }, { opacity: 1, transform: 'perspective(400px) rotateY(0) scale(1)' }], { duration: 340, delay: i * 80, easing: 'cubic-bezier(.2,1.2,.4,1)', fill: 'backwards' });
    });
    const actions = make('div', 'gacha-actions', result);
    button('gacha-confirm', actions, tr('land.shop.ui.0212'), () => { stage.hidden = true; });
    const price = count === 1 ? R.GACHA.price : R.GACHA.tenPrice;
    const again = button('gacha-again', actions, tr('land.shop.ui.0213',{v0:points(price)}), () => pull(pool, count));
    again.disabled = getState().coins < price;
  }

  /* 보유 아이템: 선택·판매·선물 */
  const detailLayer = layer('detail-layer', tr('land.shop.ui.0214'));
  const detailCard = make('div', 'game-card detail-card', detailLayer);
  let currentItem = null;

  function renderDetail() {
    const { group, kind } = currentItem;
    const count = R.bagOf(getState())[group][kind] || 0;
    detailCard.replaceChildren();
    const head = make('div', 'detail-head', detailCard);
    closeIcon(head, () => { detailLayer.hidden = true; });
    preview(make('span', 'detail-art', detailCard), group, kind);
    make('h2', '', detailCard, nameOf(group, kind));
    const meta = make('p', 'detail-meta', detailCard);
    chip(meta, R.rarityOf(group, kind));
    meta.append(tr('land.shop.ui.0203',{v0:count}));
    const locked = !R.canPart(getState(), group, kind);
    button('detail-select', detailCard, tr('land.shop.ui.0215'), selectItem).disabled = count < 1;
    const row = make('div', 'detail-row', detailCard);
    button('detail-sub', row, tr('land.shop.ui.0216',{v0:points(R.sellPrice(group, kind))}), sellItem).disabled = locked;
    button('detail-sub', row, tr('land.land.panels.0149'), renderGift).disabled = locked;
    if (group === 'pet' && count === 1 && locked) make('p', 'detail-note', detailCard, tr('land.shop.ui.0217'));
  }
  function renderGift() {
    const { group, kind } = currentItem;
    detailCard.replaceChildren();
    make('h2', 'detail-gift-title', detailCard, tr('land.shop.ui.0218'));
    make('p', 'detail-note', detailCard, tr('land.shop.ui.0219',{v0:nameOf(group, kind)}));
    for (const [id, friend] of Object.entries(R.friends)) {
      button('detail-sub detail-friend', detailCard, friend.ko, () => {
        if (!perform({ type: 'gift-item', group, kind, friend: id })) return;
        notify(tr('land.shop.ui.0220',{v0:friend.ko}));
        afterChange();
      });
    }
    button('detail-back', detailCard, tr('land.shop.ui.0221'), renderDetail);
  }
  function afterChange() {
    const { group, kind } = currentItem;
    if ((R.bagOf(getState())[group][kind] || 0) > 0) renderDetail();
    else detailLayer.hidden = true;
  }
  function sellItem() {
    const { group, kind } = currentItem;
    if (!perform({ type: 'sell-item', group, kind })) return;
    notify(tr('land.shop.ui.0222',{v0:nameOf(group, kind)}));
    afterChange();
  }
  function selectItem() {
    const item = currentItem;
    detailLayer.hidden = true;
    if (item.group === 'pet' && !getState().pets[item.kind]) {
      if (perform({ type: 'deploy-pet', pet: item.kind })) notify(tr('land.shop.ui.0223',{v0:R.animals[item.kind].ko}));
      return;
    }
    choose(item);
  }
  function detail(item) {
    currentItem = item;
    renderDetail();
    detailLayer.hidden = false;
  }

  /* 땅이 넓어졌을 때 받은 물건 */
  const zoneLayer = layer('zone-layer', tr('land.shop.ui.0224'));
  const zoneCard = make('div', 'game-card zone-card', zoneLayer);
  function zoneReward(items) {
    zoneCard.replaceChildren();
    make('h2', '', zoneCard, tr('land.shop.ui.0225'));
    make('p', 'detail-note', zoneCard, tr('land.shop.ui.0226'));
    const grid = make('div', 'zone-grid', zoneCard);
    for (const entry of items) {
      const [source, kind] = entry.split(':');
      const group = source === 'crop' ? 'seed' : 'building';
      const tile = make('div', 'zone-tile', grid);
      preview(make('span', 'shop-thumb', tile), group, kind);
      make('small', '', tile, group === 'seed' ? R.crops[kind].ko : nameOf(group, kind));
    }
    button('detail-select', zoneCard, tr('land.land.panels.0136'), () => { zoneLayer.hidden = true; });
    zoneLayer.hidden = false;
  }

  /* 팝업이 떠 있으면 부모 화면의 상태바도 같이 어둡게 */
  let dim = null;
  new MutationObserver(() => {
    const level = !stage.hidden ? 'strong' : host.querySelector('.expand-backdrop:not([hidden]),.game-layer:not([hidden])') ? 'soft' : null;
    if (level !== dim) { dim = level; send('land-dim', { level }); }
  }).observe(host, { attributes: true, attributeFilter: ['hidden'], subtree: true });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') for (const node of [shopLayer, detailLayer, zoneLayer]) node.hidden = true;
  });

  return { open, detail, zoneReward };
}
