// --- Calendar Component Logic ---

export const MONTH_NAMES_VN = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getDayOfWeekVN(dateStr) {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const date = new Date(dateStr + 'T00:00:00');
  return days[date.getDay()] || '';
}

export function renderCalendarGrid({
  container,
  titleEl,
  year,
  month,
  todayStr,
  selectedDateStr,
  worklogDates = new Set(),
  attendanceDates = new Set(),
  onSelectDate
}) {
  if (!container) return;
  if (titleEl) {
    titleEl.textContent = `${MONTH_NAMES_VN[month]} / ${year}`;
  }

  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < startOffset; i++) {
    html += '<div class="cal-cell empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDateStr;
    const hasWork = worklogDates.has(dateStr);
    const hasAtt = attendanceDates.has(dateStr);

    const classes = ['cal-cell'];
    if (isToday) classes.push('is-today');
    if (isSelected) classes.push('is-selected');

    html += `
      <button type="button" class="${classes.join(' ')}" data-date="${dateStr}" title="Ngày ${formatDateVN(dateStr)}">
        <span>${d}</span>
        <div class="cal-dots">
          ${hasWork ? '<span class="cal-dot cal-dot-work"></span>' : ''}
          ${hasAtt ? '<span class="cal-dot cal-dot-att"></span>' : ''}
        </div>
      </button>
    `;
  }

  container.innerHTML = html;

  container.querySelectorAll('.cal-cell:not(.empty)').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof onSelectDate === 'function') {
        onSelectDate(btn.dataset.date);
      }
    });
  });
}
