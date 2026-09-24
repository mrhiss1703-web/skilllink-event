import * as API from './worklog-api.js';
import * as Cal from './worklog-calendar.js';
import { renderTimelineList } from './worklog-timeline.js';
import { attachPageEvents } from './worklog-events.js';

let token = localStorage.getItem('skilllink_token');
let currentUser = JSON.parse(localStorage.getItem('skilllink_user') || 'null');

const now = new Date();
const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
const todayStr = utc7.toISOString().slice(0, 10);

let viewYear = utc7.getUTCFullYear(), viewMonth = utc7.getUTCMonth();
let selectedDateStr = todayStr, currentFilterPreset = 'month', searchQuery = '';
let worklogHistory = [], attendanceHistory = [], todayAttendance = null;
let editingLogId = null, editingTaskId = null;

const userPill = document.getElementById('user-pill');
const navUserName = document.getElementById('nav-user-name');
const navUserRole = document.getElementById('nav-user-role');
const navUserAvatar = document.getElementById('nav-user-avatar');
const btnLogout = document.getElementById('btn-logout');
const authOverlay = document.getElementById('auth-overlay');
const loginForm = document.getElementById('login-form');
const loginErrorMsg = document.getElementById('login-error-msg');
const attStatusIndicator = document.getElementById('att-status-indicator');
const attTimeDisplay = document.getElementById('att-time-display');
const attSubDisplay = document.getElementById('att-sub-display');
const btnCheckin = document.getElementById('btn-checkin');
const btnCheckout = document.getElementById('btn-checkout');
const metricTotalTasks = document.getElementById('metric-total-tasks');
const metricMonthLabel = document.getElementById('metric-month-label');
const metricActiveDays = document.getElementById('metric-active-days');
const metricSelectedDateStr = document.getElementById('metric-selected-date-str');
const metricSelectedDateSub = document.getElementById('metric-selected-date-sub');
const calMonthTitle = document.getElementById('cal-month-title');
const calPrevBtn = document.getElementById('cal-prev-btn');
const calNextBtn = document.getElementById('cal-next-btn');
const calGrid = document.getElementById('cal-grid');
const entryActiveDateText = document.getElementById('entry-active-date-text');
const entryCustomDate = document.getElementById('entry-custom-date');
const taskInput = document.getElementById('task-input');
const btnAddTask = document.getElementById('btn-add-task');
const timelineList = document.getElementById('timeline-list');
const timelineCountBadge = document.getElementById('timeline-count-badge');
const searchInput = document.getElementById('search-input');
const btnExportPrint = document.getElementById('btn-export-print');
const editModal = document.getElementById('edit-modal');
const editTaskInput = document.getElementById('edit-task-input');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const btnSaveEdit = document.getElementById('btn-save-edit');
const entryAttRequiredNotice = document.getElementById('entry-att-required-notice');
const btnLockCheckin = document.getElementById('btn-lock-checkin');

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  bindEvents();
  setSelectedDate(todayStr);
});

function checkAuth() {
  if (!token || !currentUser) { authOverlay.classList.add('open'); return; }
  authOverlay.classList.remove('open');
  userPill.style.display = 'flex';
  navUserName.textContent = currentUser.fullName || currentUser.username;
  navUserRole.textContent = currentUser.role === 'admin' ? 'Quản trị viên' : 'Thực tập sinh';
  navUserAvatar.textContent = (currentUser.fullName || 'SL').slice(0, 2).toUpperCase();

  const pName = document.getElementById('print-user-name');
  const pSign = document.getElementById('print-intern-signature');
  if (pName) pName.textContent = currentUser.fullName || currentUser.username;
  if (pSign) pSign.textContent = currentUser.fullName || currentUser.username;
  loadAllData();
}

async function loadAllData() {
  const monthQuery = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const [attToday, attHist, workHist] = await Promise.all([
    API.fetchTodayAttendanceAPI(),
    API.fetchAttendanceHistoryAPI(monthQuery),
    API.fetchWorklogHistoryAPI(currentFilterPreset === 'month' ? monthQuery : '')
  ]);
  todayAttendance = attToday;
  attendanceHistory = attHist;
  worklogHistory = workHist;
  updateTodayAttendanceUI();
  updateEntryLockState();
  updateMetrics();
  renderCalendar();
  renderTimeline();
}

function updateTodayAttendanceUI() {
  if (!todayAttendance) {
    attStatusIndicator.textContent = '⚪';
    attTimeDisplay.textContent = 'Chưa vào ca';
    attSubDisplay.textContent = 'Bấm Check-in khi bắt đầu làm';
    btnCheckin.disabled = false;
    btnCheckin.innerHTML = '<span>✓ Check-in</span>';
    btnCheckout.disabled = true;
  } else if (todayAttendance.checkInTime && !todayAttendance.checkOutTime) {
    const ci = new Date(todayAttendance.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    attStatusIndicator.textContent = '🟢';
    attTimeDisplay.textContent = `Vào lúc ${ci}`;
    attSubDisplay.textContent = 'Đang trong ca làm việc';
    btnCheckin.disabled = true;
    btnCheckin.innerHTML = `<span>Đã vào ${ci}</span>`;
    btnCheckout.disabled = false;
  } else if (todayAttendance.checkInTime && todayAttendance.checkOutTime) {
    const ci = new Date(todayAttendance.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const co = new Date(todayAttendance.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    attStatusIndicator.textContent = '🏁';
    attTimeDisplay.textContent = `${ci} — ${co}`;
    attSubDisplay.textContent = 'Đã hoàn thành ca làm việc';
    btnCheckin.disabled = true;
    btnCheckin.innerHTML = `<span>✓ Vào ${ci}</span>`;
    btnCheckout.disabled = true;
    btnCheckout.innerHTML = `<span>✓ Ra ${co}</span>`;
  }
}

function updateMetrics() {
  let totalTasks = 0, activeDays = 0;
  worklogHistory.forEach(log => {
    if (log.tasks?.length > 0) { totalTasks += log.tasks.length; activeDays++; }
  });
  metricTotalTasks.textContent = totalTasks;
  metricActiveDays.textContent = activeDays;
  metricMonthLabel.textContent = `Tháng ${viewMonth + 1} / ${viewYear}`;
}

function renderCalendar() {
  const wDates = new Set(worklogHistory.filter(l => l.tasks?.length > 0).map(l => l.date));
  const aDates = new Set(attendanceHistory.map(a => a.date));
  Cal.renderCalendarGrid({
    container: calGrid, titleEl: calMonthTitle, year: viewYear, month: viewMonth,
    todayStr, selectedDateStr, worklogDates: wDates, attendanceDates: aDates,
    onSelectDate: (d) => setSelectedDate(d)
  });
}

function setSelectedDate(dateStr) {
  selectedDateStr = dateStr;
  entryCustomDate.value = dateStr;
  entryActiveDateText.textContent = Cal.formatDateVN(dateStr);
  const isToday = dateStr === todayStr;
  metricSelectedDateStr.textContent = isToday ? 'Hôm nay' : Cal.formatDateVN(dateStr);
  metricSelectedDateSub.textContent = isToday ? 'Ngày làm việc hiện tại' : 'Đang chọn ngày này';
  updateEntryLockState();
  renderCalendar();
  renderTimeline();
}

function updateEntryLockState() {
  const isTargetToday = (selectedDateStr === todayStr);
  const hasCheckedInToday = Boolean(todayAttendance && todayAttendance.checkInTime);
  const entryCard = document.querySelector('.entry-card');

  if (isTargetToday && !hasCheckedInToday) {
    if (entryCard) entryCard.classList.add('is-locked');
    if (entryAttRequiredNotice) entryAttRequiredNotice.style.display = 'flex';
    if (taskInput) {
      taskInput.disabled = true;
      taskInput.placeholder = '🔒 Bạn cần điểm danh vào đầu ngày trước khi ghi nhật ký hôm nay!';
    }
    if (btnAddTask) {
      btnAddTask.disabled = true;
      btnAddTask.title = 'Vui lòng điểm danh vào đầu ngày';
    }
  } else {
    if (entryCard) entryCard.classList.remove('is-locked');
    if (entryAttRequiredNotice) entryAttRequiredNotice.style.display = 'none';
    if (taskInput) {
      taskInput.disabled = false;
      taskInput.placeholder = 'Ghi lại việc bạn đã làm (VD: Hỗ trợ setup âm thanh sân khấu sự kiện Hype Fest, kiểm đếm 40 bộ đàm...)';
    }
    if (btnAddTask) {
      btnAddTask.disabled = false;
      btnAddTask.title = '';
    }
  }
}

function renderTimeline() {
  const attMap = {};
  attendanceHistory.forEach(a => { attMap[a.date] = a; });
  if (todayAttendance) attMap[todayStr] = todayAttendance;

  renderTimelineList({
    container: timelineList, badgeEl: timelineCountBadge, worklogs: worklogHistory,
    attendanceMap: attMap, todayStr, currentFilterPreset, searchQuery,
    onEditTask: (lId, tId, cnt) => {
      editingLogId = lId; editingTaskId = tId;
      editTaskInput.value = cnt; editModal.classList.add('open'); editTaskInput.focus();
    },
    onDeleteTask: async (lId, tId) => {
      if (!confirm('Bạn có chắc chắn muốn xóa đầu việc này?')) return;
      const res = await API.deleteTaskAPI(lId, tId);
      if (res.ok) await loadAllData();
      else alert(res.message || 'Lỗi xóa đầu việc');
    }
  });
}

function bindEvents() {
  attachPageEvents({
    taskInput, btnAddTask, entryCustomDate, getSelectedDate: () => selectedDateStr,
    todayStr, hasCheckedInToday: () => Boolean(todayAttendance && todayAttendance.checkInTime),
    editModal, editTaskInput, btnCancelEdit, btnSaveEdit,
    getEditingIds: () => ({ logId: editingLogId, taskId: editingTaskId }),
    btnCheckin, btnCheckout, searchInput, btnExportPrint, btnLogout, loginForm, loginErrorMsg,
    calPrevBtn, calNextBtn,
    changeMonth: (step) => {
      viewMonth += step;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      else if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      loadAllData();
    },
    onReload: loadAllData,
    onAuthSuccess: (t, u) => { token = t; currentUser = u; checkAuth(); },
    onSearch: (q) => { searchQuery = q; renderTimeline(); }
  });

  if (btnLockCheckin) {
    btnLockCheckin.addEventListener('click', () => {
      btnCheckin.click();
    });
  }

  entryCustomDate.addEventListener('change', e => { if (e.target.value) setSelectedDate(e.target.value); });

  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilterPreset = btn.dataset.filter;
      loadAllData();
    });
  });
}
