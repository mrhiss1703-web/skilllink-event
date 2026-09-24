import { formatDateVN, getDayOfWeekVN } from './worklog-calendar.js';

export function renderTimelineList({
  container,
  badgeEl,
  worklogs,
  attendanceMap,
  todayStr,
  currentFilterPreset,
  searchQuery,
  onEditTask,
  onDeleteTask
}) {
  if (!container) return;
  let filtered = [...worklogs];

  if (currentFilterPreset === 'today') {
    filtered = filtered.filter(l => l.date === todayStr);
  } else if (currentFilterPreset === 'has_tasks') {
    filtered = filtered.filter(l => l.tasks && l.tasks.length > 0);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(l =>
      l.date.includes(q) || (l.tasks && l.tasks.some(t => t.content && t.content.toLowerCase().includes(q)))
    );
  }

  filtered.sort((a, b) => b.date.localeCompare(a.date));
  if (badgeEl) badgeEl.textContent = `${filtered.length} ngày`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h4 class="empty-title">Chưa có nhật ký nào</h4>
        <p class="empty-desc">Không tìm thấy đầu việc nào phù hợp với bộ lọc. Hãy nhập đầu việc mới ở khung phía trên!</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(log => {
    const att = attendanceMap[log.date];
    let attHtml = '<span class="att-pill">⚪ Chưa điểm danh</span>';
    if (att && att.checkInTime) {
      const inTime = new Date(att.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      attHtml = att.checkOutTime
        ? `<span class="att-pill present">🟢 Vào: ${inTime} — Ra: ${new Date(att.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>`
        : `<span class="att-pill present">🟢 Đã vào lúc ${inTime}</span>`;
    }

    const tasks = log.tasks || [];
    const dayNumber = log.date.split('-')[2];
    const dayOfWeek = getDayOfWeekVN(log.date);

    const tasksHtml = tasks.length === 0
      ? '<p style="font-size:0.82rem;color:var(--muted);padding:8px 0;">Chưa ghi đầu việc nào cho ngày này</p>'
      : tasks.map(t => `
        <div class="task-item">
          <div class="task-bullet">✓</div>
          <div class="task-body">
            <span class="task-content">${escapeHtml(t.content)}</span>
            ${t.createdAt ? `<span class="task-time">Đã lưu lúc ${new Date(t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>` : ''}
          </div>
          <div class="task-actions">
            <button type="button" class="btn-task-action" data-log-id="${log._id}" data-task-id="${t._id}" data-content="${escapeAttr(t.content)}" title="Chỉnh sửa">✏️</button>
            <button type="button" class="btn-task-action delete" data-delete-log="${log._id}" data-delete-task="${t._id}" title="Xóa đầu việc">🗑️</button>
          </div>
        </div>
      `).join('');

    return `
      <article class="day-card" data-date="${log.date}">
        <div class="day-card-header">
          <div class="day-date-group">
            <div class="day-badge-circle">${dayNumber}</div>
            <div class="day-date-text">
              <h3>${dayOfWeek}, ${formatDateVN(log.date)}</h3>
              <p>${log.date === todayStr ? 'Hôm nay' : 'Nhật ký công việc'}</p>
            </div>
          </div>
          <div class="day-meta-group">
            ${attHtml}
            <span class="task-count-badge">${tasks.length} đầu việc</span>
          </div>
        </div>
        <div class="day-tasks-list">${tasksHtml}</div>
      </article>`;
  }).join('');

  container.querySelectorAll('[data-log-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof onEditTask === 'function') {
        onEditTask(btn.dataset.logId, btn.dataset.taskId, btn.dataset.content);
      }
    });
  });

  container.querySelectorAll('[data-delete-log]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof onDeleteTask === 'function') {
        onDeleteTask(btn.dataset.deleteLog, btn.dataset.deleteTask);
      }
    });
  });
}

function escapeHtml(t) {
  return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeAttr(t) {
  return (t || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '\\&#039;').replace(/\n/g, ' ');
}
