/* 회원 로그인·회원가입 시안. 구성은 ABoardFit LoginScreen을 따른다. 비밀번호는 어디에도 저장·전송하지 않는다. */
const MemberAuth = (() => {
  const PROFILE_KEY = 'my-workout-garden:profile:v1';
  const TAKEN_NICKS = ['aboardfit', 'admin', 'garden'];
  const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const KAKAO = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 2C4.86 2 1.5 4.64 1.5 7.88c0 2.1 1.38 3.96 3.48 5.04l-.9 3.18c-.06.18.12.33.3.24l3.72-2.46c.3.03.6.06.9.06 4.14 0 7.5-2.64 7.5-5.88S13.14 2 9 2z" fill="#000"/></svg>';
  const APPLE = '<svg width="15" height="17" viewBox="0 0 15 17" aria-hidden="true"><path d="M12.38 9.04c-.02-2.02 1.65-3 1.72-3.04C13.09 4.24 11.38 4 10.72 4c-1.42-.14-2.8.84-3.52.84-.74 0-1.84-.82-3.04-.8C2.7 4.06 1.3 4.92.62 6.24-.8 8.92.3 12.88 1.64 15.08c.68 1.08 1.48 2.28 2.52 2.24 1.02-.04 1.4-.64 2.64-.64 1.22 0 1.56.64 2.62.62 1.1-.02 1.78-1.08 2.44-2.16.76-1.24 1.08-2.44 1.1-2.5-.02-.02-2.12-.82-2.14-3.2zM10 2.56C10.56 1.88 10.94.96 10.84 0c-.82.04-1.8.54-2.38 1.22-.52.58-.98 1.52-.86 2.42.9.08 1.82-.44 2.4-1.08z" fill="#fff"/></svg>';
  const GOOGLE = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M15.5 8.17c0-.52-.04-1.02-.12-1.5H8v2.84h4.2a3.6 3.6 0 0 1-1.56 2.36v1.96h2.52C14.66 12.3 15.5 10.4 15.5 8.17z" fill="#4285F4"/><path d="M8 16c2.1 0 3.86-.7 5.15-1.88l-2.52-1.96c-.7.47-1.6.75-2.63.75-2.02 0-3.74-1.36-4.35-3.2H1.05v2.02A8 8 0 0 0 8 16z" fill="#34A853"/><path d="M3.65 9.7A4.82 4.82 0 0 1 3.4 8c0-.59.1-1.16.25-1.7V4.28H1.05A8 8 0 0 0 0 8c0 1.3.31 2.52.85 3.6l2.8-1.9z" fill="#FBBC05"/><path d="M8 3.18c1.14 0 2.16.4 2.97 1.17l2.22-2.22C11.86.8 10.1 0 8 0A8 8 0 0 0 1.05 4.28l2.6 2.02C4.26 4.54 5.98 3.18 8 3.18z" fill="#EA4335"/></svg>';

  let screen = 'login';
  let prefillEmail = '';
  let nickStatus = 'idle';
  let emailStatus = 'idle';

  const value = (id) => document.getElementById(id)?.value || '';
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

  function loginHtml() {
    return `<section class="ma-wrap">
      <button class="auth-back" data-auth="back" aria-label="${tr('partner.app.entry.0232')}">${icon('ArrowLeft')}</button>
      <h1 tabindex="-1">${tr('partner.app.entry.0245')}</h1>
      <form id="ma-login-form" novalidate>
        <div class="ma-field"><input id="ma-email" type="email" autocomplete="email" placeholder="${tr('partner.member.auth.0464')}" aria-label="${tr('partner.member.auth.0464')}" value="${escapeHtml(prefillEmail)}"></div>
        <div class="ma-field"><input id="ma-password" type="password" autocomplete="current-password" placeholder="${tr('partner.member.auth.0465')}" aria-label="${tr('partner.member.auth.0465')}"></div>
        <p class="ma-error" id="ma-login-error" role="alert"></p>
        <button class="ma-primary" type="submit">${tr('partner.app.entry.0237')}</button>
        <div class="ma-links"><button type="button" class="ma-link" data-ma="open-signup">${tr('partner.app.entry.0228')}</button><button type="button" class="ma-link" data-ma="forgot">${tr('partner.member.auth.0467')}</button></div>
        <div class="ma-social-row"><button type="button" class="ma-social ma-kakao" data-ma="social" aria-label="${tr('partner.member.auth.0466')}">${KAKAO}</button><button type="button" class="ma-social ma-apple" data-ma="social" aria-label="${tr('partner.member.auth.0468')}">${APPLE}</button><button type="button" class="ma-social ma-google" data-ma="social" aria-label="${tr('partner.member.auth.0469')}">${GOOGLE}</button></div>
      </form>
    </section>`;
  }
  function signupHtml() {
    return `<section class="ma-signup">
      <header class="ma-head"><button type="button" data-ma="close-signup" aria-label="${tr('partner.app.entry.0232')}">${icon('ArrowLeft')}</button></header>
      <h1 tabindex="-1">${tr('partner.app.entry.0228')}</h1>
      <form id="ma-signup-form" novalidate>
        <div class="ma-field"><div class="ma-two"><input id="ma-last" maxlength="15" placeholder="${tr('partner.member.auth.0470')}" aria-label="${tr('partner.member.auth.0470')}" autocomplete="family-name"><input id="ma-first" maxlength="15" placeholder="${tr('partner.member.auth.0471')}" aria-label="${tr('partner.member.auth.0471')}" autocomplete="given-name"></div></div>
        <div class="ma-field"><div class="ma-check-row"><div class="ma-nick"><b>@</b><input id="ma-nick" maxlength="10" autocomplete="off" autocapitalize="none" placeholder="${tr('partner.app.entry.0252')}" aria-label="${tr('partner.app.entry.0252')}"></div><button type="button" class="ma-check" data-ma="check-nick" aria-label="${tr('partner.member.auth.0472')}">${tr('partner.member.auth.0476')}</button></div><p class="ma-note" id="ma-nick-note"></p></div>
        <div class="ma-field"><div class="ma-check-row"><input id="ma-su-email" type="email" autocomplete="email" placeholder="${tr('partner.member.auth.0464')}" aria-label="${tr('partner.member.auth.0464')}"><button type="button" class="ma-check" data-ma="check-email" aria-label="${tr('partner.member.auth.0473')}">${tr('partner.member.auth.0476')}</button></div><p class="ma-note" id="ma-email-note"></p></div>
        <div class="ma-field"><input id="ma-pw" type="password" autocomplete="new-password" placeholder="${tr('partner.member.auth.0474')}" aria-label="${tr('partner.member.auth.0465')}"><div class="ma-meter" id="ma-meter" hidden><div><i id="ma-meter-fill"></i></div><small id="ma-meter-text"></small></div></div>
        <div class="ma-field"><input id="ma-pw2" type="password" autocomplete="new-password" placeholder="${tr('partner.member.auth.0475')}" aria-label="${tr('partner.member.auth.0475')}"></div>
        <label class="ma-agree"><input id="ma-agree" type="checkbox"><span><u>${tr('partner.member.auth.0477')}</u> ${tr('partner.member.auth.0478')} <u>${tr('partner.member.auth.0479')}</u> ${tr('partner.member.auth.0480')}</span></label>
        <p class="ma-error" id="ma-signup-error" role="alert"></p>
        <button class="ma-primary" type="submit">${tr('partner.member.auth.0481')}</button>
      </form>
    </section>`;
  }
  function doneHtml() {
    return `<div class="ma-done-back"><div class="ma-done" role="alertdialog" aria-modal="true"><h2>${tr('partner.member.auth.0482')}</h2><p>${tr('partner.member.auth.0483')}</p><button class="ma-primary" data-ma="done">${tr('land.shop.ui.0212')}</button></div></div>`;
  }
  const html = () => (screen === 'signup' ? signupHtml() : loginHtml());

  function redraw(extra = '') {
    const root = document.getElementById('role-entry');
    root.replaceChildren();
    root.insertAdjacentHTML('beforeend', html() + extra);
  }
  const finish = () => parent.postMessage({ type: 'member-entered' }, location.origin);
  function saveName(name) {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch { /* 새 프로필로 시작 */ }
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ phone: '', photo: '', ...stored, name }));
  }
  function passwordScore(pw) {
    let n = 0;
    if (pw.length >= 8) n += 1;
    if (/[a-z]/.test(pw) && /[A-Z0-9]/.test(pw)) n += 1;
    if (/[^A-Za-z0-9]/.test(pw)) n += 1;
    return pw ? n : 0;
  }
  function submitLogin() {
    const email = value('ma-email').trim();
    if (!email || !value('ma-password')) { setText('ma-login-error', tr('partner.member.auth.0484')); return; }
    if (!EMAIL_FORMAT.test(email)) { setText('ma-login-error', tr('partner.member.auth.0485')); return; }
    finish();
  }
  function submitSignup() {
    const error = (text) => setText('ma-signup-error', text);
    const first = value('ma-first').trim();
    const last = value('ma-last').trim();
    const email = value('ma-su-email').trim();
    const pw = value('ma-pw');
    if (!first || !value('ma-nick').trim() || !email || !pw || !value('ma-pw2')) return error(tr('partner.member.auth.0486'));
    if (!EMAIL_FORMAT.test(email)) return error(tr('partner.member.auth.0485'));
    if (emailStatus !== 'ok') return error(tr('partner.member.auth.0487'));
    if (nickStatus !== 'ok') return error(tr('partner.member.auth.0488'));
    if (pw.length < 8) return error(tr('partner.member.auth.0489'));
    if (pw !== value('ma-pw2')) return error(tr('partner.member.auth.0490'));
    if (!document.getElementById('ma-agree').checked) return error(tr('partner.member.auth.0491'));
    saveName(`${last}${first}`);
    prefillEmail = email;
    screen = 'login';
    nickStatus = 'idle';
    emailStatus = 'idle';
    redraw(doneHtml());
    return undefined;
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-ma]');
    if (!el) return;
    const action = el.dataset.ma;
    if (action === 'open-signup') { prefillEmail = value('ma-email'); screen = 'signup'; redraw(); document.querySelector('.ma-signup')?.classList.add('enter'); }
    else if (action === 'close-signup') { screen = 'login'; redraw(); }
    else if (action === 'social') finish();
    else if (action === 'forgot') setText('ma-login-error', tr('partner.member.auth.0492'));
    else if (action === 'done') document.querySelector('.ma-done-back')?.remove();
    else if (action === 'check-nick') {
      const nick = value('ma-nick').trim().toLowerCase();
      if (!nick) return;
      nickStatus = TAKEN_NICKS.includes(nick) ? 'taken' : 'ok';
      setText('ma-nick-note', nickStatus === 'ok' ? tr('partner.member.auth.0493') : tr('partner.member.auth.0494'));
      document.getElementById('ma-nick-note').dataset.state = nickStatus;
    } else if (action === 'check-email') {
      const email = value('ma-su-email').trim();
      if (!EMAIL_FORMAT.test(email)) { setText('ma-signup-error', tr('partner.member.auth.0485')); return; }
      emailStatus = 'ok';
      setText('ma-email-note', tr('partner.member.auth.0495'));
      document.getElementById('ma-email-note').dataset.state = 'ok';
    }
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'ma-login-form') { e.preventDefault(); e.stopPropagation(); submitLogin(); }
    if (e.target.id === 'ma-signup-form') { e.preventDefault(); e.stopPropagation(); submitSignup(); }
  }, true);
  document.addEventListener('input', (e) => {
    if (e.target.id === 'ma-nick') {
      e.target.value = e.target.value.replace(/[^a-zA-Z0-9._]/g, '').slice(0, 10);
      setText('ma-nick-count', `${e.target.value.length}/10`);
      nickStatus = 'idle';
      setText('ma-nick-note', '');
    }
    if (e.target.id === 'ma-su-email') { emailStatus = 'idle'; setText('ma-email-note', ''); }
    if (e.target.id === 'ma-pw') {
      const score = passwordScore(e.target.value);
      document.getElementById('ma-meter').hidden = !e.target.value;
      document.getElementById('ma-meter-fill').style.width = `${(score / 3) * 100}%`;
      document.getElementById('ma-meter-fill').dataset.score = score;
      setText('ma-meter-text', [tr('partner.member.auth.0496'), tr('partner.member.auth.0496'), tr('partner.member.auth.0497'), tr('partner.member.auth.0498')][score]);
    }
    if (e.target.id?.startsWith('ma-')) { setText('ma-login-error', ''); setText('ma-signup-error', ''); }
  });

  return { html };
})();
