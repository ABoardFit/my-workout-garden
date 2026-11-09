/* 배치 미리보기: 놓을 수 있는 칸 하이라이트 + 반투명 물건 + 체크/회전/취소 버튼. */
import { clone as cloneSkinned } from '../vendor/three/examples/jsm/utils/SkeletonUtils.js';

const CELL = 0.8;
const GHOST_OPACITY = 0.62;
const BLOCKED_OPACITY = 0.92;
const BLOCKED_TINT = 0.88; // 놓을 수 없을 때 붉은색을 섞는 비율
const TREE_SCALE = 0.58; // 심은 나무와 같은 크기
const TREE_SCALE_MID = 0.36;
const CONTROL_GAP = 8;
/* 원 없이 90도만 도는 회전 화살표 */
const ARC_ICONS = {
  ArcLeft: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 19A12 12 0 0 0 7 7"/><path d="M11.500 2.500 7 7l4.500 4.500"/></svg>',
  ArcRight: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19A12 12 0 0 1 17 7"/><path d="M12.500 2.500 17 7l-4.500 4.500"/></svg>',
};

export function placement({ T, land, camera, renderer, controls, terrain, R, getState, perform, icon, createItem, garden, pets, notify, onCancel }) {
  const dom = renderer.domElement;
  const ray = new T.Raycaster();
  const ndc = new T.Vector2();
  const hostUi = document.getElementById('game-ui');
  const blockedColor = new T.Color('#ff1f2d');

  const highlightMaterial = new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, depthWrite: false, fog: false, side: T.DoubleSide, toneMapped: false });
  const highlight = new T.Mesh(new T.BufferGeometry(), highlightMaterial);
  highlight.visible = false;
  highlight.renderOrder = 5;
  land.add(highlight);
  const blockedPlate = new T.Mesh(new T.BoxGeometry(0.8, 0.02, 0.8), new T.MeshBasicMaterial({ color: '#ff1f2d', transparent: true, opacity: 0.55, depthWrite: false, fog: false, toneMapped: false }));
  blockedPlate.visible = false;
  blockedPlate.renderOrder = 6;
  land.add(blockedPlate);

  /* 체크·회전·취소 버튼 */
  const makeButton = (name, label, cls, handler, parent) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `ghost-btn ${cls}`;
    b.setAttribute('aria-label', label);
    b.title = label;
    b.insertAdjacentHTML('beforeend', ARC_ICONS[name] || icon(name));
    b.addEventListener('click', (e) => { e.stopPropagation(); handler(); });
    parent.append(b);
    return b;
  };
  const topRow = document.createElement('div');
  topRow.className = 'ghost-row';
  topRow.hidden = true;
  const bottomRow = document.createElement('div');
  bottomRow.className = 'ghost-row';
  bottomRow.hidden = true;
  hostUi.append(topRow, bottomRow);
  const leftButton = makeButton('ArcLeft', '왼쪽으로 90도 돌리기', '', () => rotate(3), topRow);
  const confirmButton = makeButton('Check', '여기에 놓기', 'ghost-confirm', confirm, topRow);
  const rightButton = makeButton('ArcRight', '오른쪽으로 90도 돌리기', '', () => rotate(1), topRow);
  makeButton('X', '선택 해제', '', () => onCancel(), bottomRow);
  const removeButton = makeButton('Archive', '치우기', '', removeTarget, bottomRow);

  let action = null;
  let ghost = null;
  let ghostHeight = 1;
  let ghostHalf = 0.4;
  let cell = null;
  let rotation = 0;
  let parked = true;
  let dragging = null;
  let valid = false;
  let frame = 0;
  let editedNode = null;
  let painted = false;
  let cellLevel = 0;
  let ghostHeightOverride = null;

  const usesGhost = (a) => !!a && a.type !== 'terrain' && a.type !== 'seed';
  const editing = () => action?.type === 'edit';
  const footprintCells = () => R.footprintSize(editing() ? action.target.item : action?.item);
  const anchorOffset = () => (footprintCells() % 2 === 0 ? CELL / 2 : 0); // 2x2는 칸 사이 꼭짓점이 중심
  const editingCell = () => editing() && action.target.kind === 'cell';
  const radiusOf = (a) => {
    if (a.type === 'edit') return a.target.kind === 'decor' ? R.radius(a.target.item) : a.target.kind === 'pet' ? 0.3 : 0.32;
    return a.type === 'place' ? R.radius(a.item) : a.type === 'pet' ? 0.3 : 0.32;
  };
  function setButtonMode() {
    const cellMode = editingCell();
    const label = (b, name, text) => { b.replaceChildren(); b.insertAdjacentHTML('beforeend', ARC_ICONS[name] || icon(name)); b.setAttribute('aria-label', text); b.title = text; };
    leftButton.classList.toggle('ghost-arc-left', !cellMode);
    rightButton.classList.toggle('ghost-arc-right', !cellMode);
    label(leftButton, cellMode ? 'Minus' : 'ArcLeft', cellMode ? '한 층 낮추기' : '왼쪽으로 90도 돌리기');
    label(rightButton, cellMode ? 'Plus' : 'ArcRight', cellMode ? '한 층 쌓기' : '오른쪽으로 90도 돌리기');
    confirmButton.hidden = cellMode;
    removeButton.hidden = !(editing() && ['decor', 'plant'].includes(action.target.kind));
  }

  function canPlace(cx, cz) {
    const s = getState();
    const x = cx * CELL + anchorOffset();
    const z = cz * CELL + anchorOffset();
    if (editing()) {
      if (action.target.kind === 'cell') return R.onIsland(x, z, s.expansion);
      return R.fits(s, x, z, radiusOf(action), action.target.id ?? null, action.target.item ?? null, rotation);
    }
    if (action.type === 'terrain') {
      if (!R.onIsland(x, z, s.expansion) || R.cellOccupied(s, { x: cx, z: cz })) return false;
      const base = R.baseOf(s, x, z);
      return action.delta > 0 ? (!!base || R.heightAt(s, x, z) < R.TERRAIN_MAX) : base !== 'gone';
    }
    return R.fits(s, x, z, radiusOf(action), null, action.item ?? null, rotation);
  }
  function validCells() {
    const { expansion } = getState();
    const rx = 5 + expansion * 2;
    const rz = 5 + expansion * 2;
    const out = [];
    for (let cx = -rx; cx <= rx; cx++) for (let cz = -rz; cz <= rz; cz++) if (canPlace(cx, cz)) out.push([cx, cz]);
    return out;
  }
  function buildHighlight(cells) {
    const half = 0.37;
    const width = 0.045;
    const positions = [];
    const quad = (x0, z0, x1, z1, y) => positions.push(x0, y, z0, x0, y, z1, x1, y, z1, x0, y, z0, x1, y, z1, x1, y, z0);
    for (const [cx, cz] of cells) {
      const x = cx * CELL;
      const z = cz * CELL;
      const y = terrain.heightAt(x, z) + 0.02;
      quad(x - half, z - half, x + half, z - half + width, y);
      quad(x - half, z + half - width, x + half, z + half, y);
      quad(x - half, z - half, x - half + width, z + half, y);
      quad(x + half - width, z - half, x + half, z + half, y);
    }
    highlight.geometry.dispose();
    highlight.geometry = new T.BufferGeometry();
    highlight.geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    highlight.visible = cells.length > 0;
  }

  function fade(root) {
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = false;
      o.receiveShadow = false;
      const convert = (m) => {
        const copy = m.clone();
        copy.onBeforeCompile = (shader, renderer) => {
          m.onBeforeCompile(shader, renderer);
          copy.userData.topUniform = shader.uniforms.uGardenTop || null;
          if (copy.userData.topUniform) copy.userData.topBase = copy.userData.topUniform.value.clone();
          tintTop(copy);
        };
        copy.customProgramCacheKey = m.customProgramCacheKey;
        copy.transparent = true;
        copy.userData.baseColor = m.color ? m.color.clone() : null;
        return copy;
      };
      o.material = Array.isArray(o.material) ? o.material.map(convert) : convert(o.material);
    });
  }
  function tintTop(m) {
    if (m.userData.topUniform) m.userData.topUniform.value.copy(m.userData.topBase).lerp(blockedColor, valid ? 0 : BLOCKED_TINT);
  }
  function paintGhost() {
    ghost.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) {
        m.opacity = valid ? GHOST_OPACITY : BLOCKED_OPACITY;
        if (m.userData.baseColor) m.color.copy(m.userData.baseColor).lerp(blockedColor, valid ? 0 : BLOCKED_TINT);
        tintTop(m);
      }
    });
  }
  function createGhost(a) {
    const g = new T.Group();
    if (a.type === 'place') {
      g.add(createItem({ item: a.item }, new Map()));
    } else if (a.type === 'plant-tree') {
      const tree = garden.tree(a.variant, a.size === 'sapling' ? 1 : 2);
      tree.scale.setScalar(a.size === 'mid' ? TREE_SCALE_MID : TREE_SCALE);
      g.add(tree);
    } else if (a.type === 'plant') {
      g.add(garden.tree(0, 0));
    } else if (a.type === 'pet') {
      const source = pets.find((p) => p.name === a.pet);
      if (source) g.add(cloneSkinned(source.pivot.children[0]));
    }
    fade(g);
    return g;
  }
  function disposeGhost() {
    if (!ghost) return;
    land.remove(ghost);
    ghost.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) m.dispose();
      if (o.userData.localShape) o.geometry.dispose();
    });
    ghost = null;
  }

  function measureGhost() {
    const saved = ghost.rotation.y;
    ghost.rotation.y = 0;
    const size = new T.Box3().setFromObject(ghost).getSize(new T.Vector3());
    ghost.rotation.y = saved;
    ghostHeight = ghostHeightOverride ?? (size.y || 1);
    ghostHalf = Math.max(size.x, size.z) / 2;
  }
  /* 펫이 돌아다니므로 매 프레임 다시 판정한다 */
  function updateValidity() {
    const next = canPlace(cell[0], cell[1]);
    if (next !== valid || !painted) {
      valid = next;
      painted = true;
      confirmButton.disabled = !valid;
      blockedPlate.visible = !valid;
      paintGhost();
    }
  }
  function setCell(cx, cz) {
    cell = [cx, cz];
    const x = cx * CELL + anchorOffset();
    const z = cz * CELL + anchorOffset();
    const top = terrain.heightAt(x, z);
    ghost.position.set(x, editingCell() ? Math.min(top, 0.245 + cellLevel * R.TERRAIN_STEP) : top, z);
    blockedPlate.position.set(x, top + 0.04, z);
    blockedPlate.scale.set(footprintCells(), 1, footprintCells());
    updateValidity();
  }
  function cast(clientX, clientY) {
    const r = dom.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(terrain.surfaces(), false).find((h) => h.face?.normal.y > 0.9) || null;
  }
  /* 눌린 면 안쪽 지점으로 칸과 층을 구한다: 쌓은 땅의 옆면을 눌러도 그 층이 잡힌다 */
  function columnAt(clientX, clientY) {
    const r = dom.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(terrain.surfaces(), false)[0];
    if (!hit) return null;
    const inside = hit.point.clone().addScaledVector(hit.face.normal, -0.1);
    const level = Math.max(0, Math.ceil((inside.y - 0.245 + 0.1 * hit.face.normal.y) / R.TERRAIN_STEP - 0.001));
    return { x: inside.x, z: inside.z, level };
  }
  function cellFromHit(hit) {
    return [Math.round((hit.point.x - anchorOffset()) / CELL), Math.round((hit.point.z - anchorOffset()) / CELL)];
  }
  function followPointer(e) {
    if (editingCell()) {
      const picked = columnAt(e.clientX, e.clientY);
      if (!picked) return;
      cellLevel = picked.level;
      setCell(Math.round(picked.x / CELL), Math.round(picked.z / CELL));
      return;
    }
    const hit = cast(e.clientX, e.clientY);
    if (!hit) return;
    const [cx, cz] = cellFromHit(hit);
    if (!cell || cell[0] !== cx || cell[1] !== cz) setCell(cx, cz);
  }
  function nearestValid(from) {
    let best = null;
    let bestDistance = Infinity;
    for (const c of validCells()) {
      const d = Math.hypot(c[0] - from[0], c[1] - from[1]);
      if (d < bestDistance) {
        bestDistance = d;
        best = c;
      }
    }
    return best;
  }
  function placeAtScreenCenter() {
    const r = dom.getBoundingClientRect();
    const hit = cast(r.left + r.width / 2, r.top + r.height / 2);
    const from = hit ? cellFromHit(hit) : [0, 0];
    const target = nearestValid(from) || from;
    setCell(target[0], target[1]);
  }

  function rotate(step) {
    if (editingCell()) {
      perform({ type: 'terrain', delta: step === 3 ? -1 : 1, x: cell[0] * CELL, z: cell[1] * CELL });
      return;
    }
    rotation = (rotation + step) % 4;
    ghost.rotation.y = (rotation * Math.PI) / 2;
    refresh();
  }
  function confirm() {
    if (!ghost) return;
    if (!valid) {
      notify('여기에는 놓을 수 없어요.');
      return;
    }
    const x = cell[0] * CELL + anchorOffset();
    const z = cell[1] * CELL + anchorOffset();
    if (editing()) {
      const t = action.target;
      const done = t.kind === 'pet'
        ? perform({ type: 'pet-spot', pet: t.name, x, z, rotation })
        : perform({ type: t.kind === 'decor' ? 'move' : 'move-plant', id: t.id, x, z, rotation });
      if (done) onCancel();
      return;
    }
    const done = action.type === 'pet'
      ? perform({ type: 'pet-spot', pet: action.pet, x, z, rotation })
      : perform({ ...action, x, z, rotation });
    if (!done) return;
    const next = nearestValid(cell);
    if (next) setCell(next[0], next[1]);
    else setCell(cell[0], cell[1]);
  }

  function removeTarget() {
    if (!editing()) return;
    const t = action.target;
    const done = t.kind === 'decor' ? perform({ type: 'store', id: t.id }) : perform({ type: 'remove-plant', id: t.id });
    if (done) onCancel();
  }

  function syncControls() {
    const show = !!ghost && parked;
    topRow.hidden = !show;
    bottomRow.hidden = !show;
  }
  /* 물건과 놓일 칸이 화면에서 차지하는 사각형. 버튼은 이 영역 밖에만 둔다 */
  function occupiedRect(width, height) {
    const reach = Math.max(ghostHalf, (footprintCells() * CELL) / 2);
    const { x, y, z } = ghost.position;
    const rect = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (const py of [y - 0.05, y + ghostHeight + 0.05]) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const v = new T.Vector3(x + sx * reach, py, z + sz * reach).project(camera);
          const px = ((v.x + 1) * width) / 2;
          const pz = ((1 - v.y) * height) / 2;
          rect.left = Math.min(rect.left, px);
          rect.right = Math.max(rect.right, px);
          rect.top = Math.min(rect.top, pz);
          rect.bottom = Math.max(rect.bottom, pz);
        }
      }
    }
    return { left: rect.left - CONTROL_GAP, top: rect.top - CONTROL_GAP, right: rect.right + CONTROL_GAP, bottom: rect.bottom + CONTROL_GAP };
  }
  /* 버튼은 항상 물건 위·아래 고정 구조. 화면을 벗어나면 다른 UI 아래로 가려진다 */
  function layoutControls() {
    if (!ghost || !parked) return;
    const r = dom.getBoundingClientRect();
    const b = occupiedRect(r.width, r.height);
    const centerX = (b.left + b.right) / 2;
    topRow.style.transform = `translate(${centerX - topRow.offsetWidth / 2}px,${b.top - topRow.offsetHeight}px)`;
    bottomRow.style.transform = `translate(${centerX - bottomRow.offsetWidth / 2}px,${b.bottom}px)`;
  }
  function loop() {
    frame = requestAnimationFrame(loop);
    if (ghost && cell) updateValidity();
    layoutControls();
  }

  dom.addEventListener('pointerdown', (e) => {
    if (!ghost || e.button !== 0) return;
    dragging = e.pointerId;
    followPointer(e);
  });
  dom.addEventListener('pointermove', (e) => {
    if (!ghost) return;
    if (dragging === e.pointerId) followPointer(e);
  });
  const endPress = (e) => {
    if (dragging !== e.pointerId) return;
    dragging = null;
    parked = true;
    syncControls();
  };
  dom.addEventListener('pointerup', endPress);
  dom.addEventListener('pointercancel', endPress);

  function startEdit(target) {
    stop();
    action = { type: 'edit', target };
    if (target.kind === 'cell') {
      const box = new T.Mesh(new T.BoxGeometry(0.86, 0.5, 0.86), new T.MeshBasicMaterial({ color: '#ffdc22', transparent: true }));
      box.position.y = -0.24;
      cellLevel = target.level ?? 0;
      box.userData.localShape = true;
      ghost = new T.Group();
      ghost.add(box);
    } else if (target.kind === 'pet') {
      ghost = new T.Group();
      ghost.add(cloneSkinned(target.node.children[0]));
      fade(ghost);
    } else {
      ghost = target.node.clone(true);
      fade(ghost);
    }
    if (target.kind === 'cell') ghostHeightOverride = 0.06;
    else {
      editedNode = target.node;
      editedNode.visible = false;
      buildHighlight(validCells());
    }
    land.add(ghost);
    measureGhost();
    rotation = target.rotation || 0;
    ghost.rotation.y = (rotation * Math.PI) / 2;
    parked = true;
    painted = false;
    setCell(Math.round((target.x - anchorOffset()) / CELL), Math.round((target.z - anchorOffset()) / CELL));
    setButtonMode();
    syncControls();
    frame = requestAnimationFrame(loop);
  }
  function start(next) {
    stop();
    action = next;
    setButtonMode();
    buildHighlight(validCells());
    if (!usesGhost(next)) return;
    ghost = createGhost(next);
    land.add(ghost);
    measureGhost();
    rotation = 0;
    parked = true;
    painted = false;
    placeAtScreenCenter();
    syncControls();
    frame = requestAnimationFrame(loop);
  }
  function stop() {
    cancelAnimationFrame(frame);
    disposeGhost();
    ghostHeightOverride = null;
    blockedPlate.visible = false;
    if (editedNode) editedNode.visible = true;
    editedNode = null;
    action = null;
    cell = null;
    dragging = null;
    highlight.visible = false;
    syncControls();
  }
  function refresh() {
    if (!action) return;
    if (!editingCell()) buildHighlight(validCells());
    if (ghost && cell) { painted = false; setCell(cell[0], cell[1]); }
  }
  return { start, startEdit, columnAt, stop, refresh, active: () => !!ghost };
}
