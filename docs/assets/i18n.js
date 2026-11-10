/* 회원 게임·제휴사 관리 화면이 함께 쓰는 번역 시스템.
   언어를 추가하려면 locales/<code>.js 파일을 만들고 LOCALES에 코드를 한 줄 넣는다. */
(function (root) {
  const LOCALES = ['ko', 'en'];
  const FALLBACK = 'en';
  const LANGUAGE_KEY = 'my-workout-garden:account-language:v1'; // 시안의 계정 저장소. 실제 서비스에서는 서버 계정 값으로 바꾼다
  const MISSING_KEY = 'my-workout-garden:i18n-missing:v1';
  const MISSING_LIMIT = 500;
  const STUDIO_TIME_ZONE = 'Asia/Seoul';

  const base = document.currentScript.src.replace(/i18n\.js[^/]*$/, 'locales/');
  for (const code of LOCALES) document.write(`<script src="${base}${code}.js"><\/script>`);

  const catalogs = {};
  const meta = {};
  const domSources = new WeakMap(); // 언어를 다시 바꿀 때 쓸 정적 HTML 원문
  let titleSource = '';
  let sourceIndex = null;
  let lang = FALLBACK;

  const stored = () => {
    try { return localStorage.getItem(LANGUAGE_KEY); } catch { return null; }
  };
  function detect() {
    const chosen = stored();
    if (chosen && catalogs[chosen]) return chosen;
    for (const value of navigator.languages || [navigator.language]) {
      const code = String(value).toLowerCase().split('-')[0];
      if (catalogs[code]) return code;
    }
    return FALLBACK;
  }
  function register(code, info, messages) {
    catalogs[code] = messages;
    meta[code] = info;
    sourceIndex = null;
    lang = detect();
    document.documentElement.lang = lang;
  }
  function readMissing() {
    try { return JSON.parse(localStorage.getItem(MISSING_KEY)) || []; } catch { return []; }
  }
  /* 번역이 없는 문구는 관리자가 볼 수 있게 언어·키 단위로 한 번만 남긴다 */
  function logMissing(key) {
    const list = readMissing();
    if (list.length >= MISSING_LIMIT || list.some((m) => m.lang === lang && m.key === key)) return;
    list.push({ lang, key, at: new Date().toISOString() });
    try { localStorage.setItem(MISSING_KEY, JSON.stringify(list)); } catch { /* 기록 실패는 화면에 영향을 주지 않는다 */ }
  }
  const fill = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (all, name) => (name in vars ? vars[name] : all)) : text);
  function t(key, vars) {
    let text = catalogs[lang]?.[key];
    if (text === undefined) {
      logMissing(key);
      text = catalogs[FALLBACK]?.[key];
    }
    return fill(text === undefined ? key : text, vars);
  }
  /* 저장된 값(종목·부위 등)과 정적 HTML의 원문을 현재 언어로 바꾼다. 목록에 없는 사용자 입력은 그대로 둔다 */
  function fromSource(text) {
    if (typeof text !== 'string') return text;
    if (!sourceIndex) sourceIndex = new Map(Object.entries(catalogs.ko || {}).map(([key, value]) => [value, key]));
    const key = sourceIndex.get(text);
    return key ? t(key) : text;
  }
  function applyDom(scope = document) {
    const walker = document.createTreeWalker(scope.body || scope, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName)) continue;
      const trimmed = node.nodeValue.trim();
      if (trimmed && (domSources.has(node) || /[가-힣]/.test(trimmed))) {
        if (!domSources.has(node)) domSources.set(node, trimmed);
        node.nodeValue = node.nodeValue.replace(trimmed, fromSource(domSources.get(node)));
      }
    }
    for (const el of (scope.body || scope).querySelectorAll('[aria-label],[title],[placeholder]')) {
      for (const attr of ['aria-label', 'title', 'placeholder']) {
        const memo = `data-i18n-${attr}`;
        const value = el.getAttribute(attr);
        if (value && /[가-힣]/.test(value) && !el.hasAttribute(memo)) el.setAttribute(memo, value);
        if (el.hasAttribute(memo)) el.setAttribute(attr, fromSource(el.getAttribute(memo)));
      }
    }
    titleSource = titleSource || document.title;
    document.title = fromSource(titleSource);
  }
  const tag = () => meta[lang]?.tag || lang;
  const number = (value, options) => new Intl.NumberFormat(tag(), options).format(value);
  const currency = (value, code = 'KRW') => new Intl.NumberFormat(tag(), { style: 'currency', currency: code }).format(value);
  /* 'YYYY-MM-DD'는 달력의 날짜다. 기기 시간대에 밀리지 않게 UTC 기준으로 그대로 표시한다 */
  const date = (value, options) => new Intl.DateTimeFormat(tag(), { ...options, timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
  /* 예약 시각은 기기가 아니라 센터 시간대 기준이다 */
  const studioDateTime = (instant, options) => new Intl.DateTimeFormat(tag(), { timeZone: STUDIO_TIME_ZONE, ...options }).format(instant);
  const studioToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: STUDIO_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  function setLanguage(code) {
    try {
      if (code) localStorage.setItem(LANGUAGE_KEY, code);
      else localStorage.removeItem(LANGUAGE_KEY);
    } catch { /* 저장이 막힌 환경에서는 이번 화면에만 적용된다 */ }
    location.reload();
  }
  addEventListener('storage', (e) => {
    if (e.key !== LANGUAGE_KEY && e.key !== null) return;
    if (detect() === lang) return;
    if (root.I18nKeepPage) { lang = detect(); document.documentElement.lang = lang; applyDom(); } else location.reload();
  });

  root.I18n = {
    register, t, fromSource, applyDom, number, currency, date, studioDateTime, studioToday, setLanguage, STUDIO_TIME_ZONE,
    get lang() { return lang; },
    get tag() { return tag(); },
    get choice() { return stored(); },
    languages: () => Object.entries(meta).map(([code, info]) => ({ code, name: info.name })),
    missing: readMissing,
    clearMissing: () => { try { localStorage.removeItem(MISSING_KEY); } catch { /* 무시 */ } },
  };
  root.tr = t;
})(globalThis);
