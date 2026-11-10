/* ABoardFit EventRangeCalendar / selectEventDate의 웹 이식. 양끝은 둥글게, 주·월 경계는 직각으로 잘린다. */
const RangeCalendar = (() => {
  const isoDay = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const toTime = (value) => Date.parse(`${value}T00:00:00Z`);

  function selectDate({ start, end }, date) {
    if (date === start) return { start: end === start ? '' : end, end: '' };
    if (date === end) return { start, end: '' };
    const remaining = start || end;
    if (!remaining) return { start: date, end: '' };
    if (!start || !end) return date < remaining ? { start: date, end: remaining } : { start: remaining, end: date };
    if (date < start) return { start: date, end };
    if (date > end) return { start, end: date };
    return toTime(date) - toTime(start) < toTime(end) - toTime(date) ? { start: date, end } : { start, end: date };
  }

  function mount(host, { start = '', end = '', min = '', max = '', single = false, initial = '', onChange }) {
    let range = { start, end };
    const [y, m] = (initial || start || min).split('-').map(Number);
    let shown = new Date(y, m - 1, 1);

    function draw() {
      const year = shown.getFullYear();
      const month = shown.getMonth();
      const firstWeekday = new Date(year, month, 1).getDay();
      const days = new Date(year, month + 1, 0).getDate();
      const total = Math.ceil((firstWeekday + days) / 7) * 7;

      const root = document.createElement('div');
      root.className = 'cal';
      const heading = document.createElement('div');
      heading.className = 'cal-head';
      const arrow = (text, label, delta) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cal-arrow';
        b.textContent = text;
        b.setAttribute('aria-label', label);
        b.addEventListener('click', () => { shown = new Date(year, month + delta, 1); draw(); });
        return b;
      };
      const title = document.createElement('strong');
      title.textContent = `${year}.${String(month + 1).padStart(2, '0')}`;
      heading.append(arrow('‹', tr('partner.app.0370'), -1), title, arrow('›', tr('partner.app.0371'), 1));

      const week = document.createElement('div');
      week.className = 'cal-row';
      ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d, i) => {
        const s = document.createElement('span');
        s.className = `cal-week${i === 0 || i === 6 ? ' cal-weekend' : ''}`;
        s.textContent = d;
        week.append(s);
      });
      root.append(heading, week);

      let row;
      for (let i = 0; i < total; i++) {
        if (i % 7 === 0) {
          row = document.createElement('div');
          row.className = 'cal-row';
          root.append(row);
        }
        const day = i - firstWeekday + 1;
        if (day < 1 || day > days) {
          const empty = document.createElement('span');
          empty.className = 'cal-cell';
          row.append(empty);
          continue;
        }
        const date = isoDay(year, month, day);
        const isStart = date === range.start;
        const isEnd = date === range.end;
        const inRange = !!range.start && !!range.end && date >= range.start && date <= range.end;
        const selected = inRange || isStart || isEnd;
        const singleton = selected && (!range.start || !range.end || range.start === range.end);
        const disabled = (!!min && date < min) || (!!max && date > max);
        const weekend = i % 7 === 0 || i % 7 === 6;

        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cal-cell';
        cell.disabled = disabled;
        cell.setAttribute('aria-label', date);
        cell.setAttribute('aria-pressed', String(selected));
        cell.addEventListener('click', () => {
          range = single ? { start: date, end: date } : selectDate(range, date);
          onChange(range);
          draw();
        });
        if (selected) {
          const band = document.createElement('i');
          band.className = `cal-band${singleton ? ' cal-single' : ''}${isStart && !singleton ? ' cal-from' : ''}${isEnd && !singleton ? ' cal-to' : ''}`;
          cell.append(band);
        }
        const number = document.createElement('span');
        number.className = `cal-day${selected ? ' on' : ''}${weekend && !selected ? ' cal-weekend' : ''}${disabled ? ' off' : ''}`;
        number.textContent = day;
        cell.append(number);
        row.append(cell);
      }
      if (range.start) {
        const summary = document.createElement('p');
        summary.className = 'cal-summary';
        const last = range.end || range.start;
        summary.textContent = tr('partner.range.calendar.0693',{v0:Number(range.start.slice(5, 7)),v1:Number(range.start.slice(8)),v2:Number(last.slice(5, 7)),v3:Number(last.slice(8))});
        root.append(summary);
      }
      host.replaceChildren(root);
    }
    draw();
    return {
      setRange(next) { range = next; draw(); },
      getRange: () => range,
    };
  }
  return { mount };
})();
