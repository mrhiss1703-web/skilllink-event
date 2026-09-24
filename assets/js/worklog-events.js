import * as API from './worklog-api.js';

export function attachPageEvents({
  taskInput, btnAddTask, entryCustomDate, getSelectedDate, todayStr, hasCheckedInToday,
  editModal, editTaskInput, btnCancelEdit, btnSaveEdit, getEditingIds,
  btnCheckin, btnCheckout, searchInput, btnExportPrint, btnLogout, loginForm, loginErrorMsg,
  calPrevBtn, calNextBtn, changeMonth, onReload, onAuthSuccess, onSearch
}) {
  btnAddTask.addEventListener('click', async () => {
    const content = taskInput.value.trim();
    if (!content) { taskInput.focus(); return; }

    const targetDate = entryCustomDate.value || getSelectedDate();
    if (targetDate === todayStr && typeof hasCheckedInToday === 'function' && !hasCheckedInToday()) {
      alert('Bạn cần điểm danh vào đầu ngày trước khi ghi nhật ký công việc hôm nay!');
      return;
    }

    btnAddTask.disabled = true;
    const res = await API.addTaskAPI(content, targetDate);
    if (res.ok) {
      taskInput.value = '';
      await onReload();
    } else {
      alert(res.message || 'Lỗi lưu đầu việc');
    }
    btnAddTask.disabled = false;
  });

  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); btnAddTask.click(); }
  });

  document.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      if (!taskInput.value.startsWith(c.dataset.prefix)) {
        taskInput.value = c.dataset.prefix + taskInput.value;
      }
      taskInput.focus();
    });
  });

  btnCancelEdit.addEventListener('click', () => editModal.classList.remove('open'));
  editModal.addEventListener('click', e => { if (e.target === editModal) editModal.classList.remove('open'); });

  btnSaveEdit.addEventListener('click', async () => {
    const content = editTaskInput.value.trim();
    if (!content) return;
    const { logId, taskId } = getEditingIds();
    btnSaveEdit.disabled = true;
    const res = await API.updateTaskAPI(logId, taskId, content);
    if (res.ok) {
      editModal.classList.remove('open');
      await onReload();
    } else {
      alert(res.message || 'Lỗi cập nhật');
    }
    btnSaveEdit.disabled = false;
  });

  btnCheckin.addEventListener('click', async () => {
    let loc = {};
    try { btnCheckin.disabled = true; loc = await API.getCurrentLocation(); } catch (e) { loc = {}; }
    const res = await API.checkInAPI(loc);
    alert(res.message);
    await onReload();
    btnCheckin.disabled = false;
  });

  btnCheckout.addEventListener('click', async () => {
    btnCheckout.disabled = true;
    const res = await API.checkOutAPI();
    alert(res.message);
    await onReload();
    btnCheckout.disabled = false;
  });

  searchInput.addEventListener('input', e => onSearch(e.target.value));

  calPrevBtn.addEventListener('click', () => changeMonth(-1));
  calNextBtn.addEventListener('click', () => changeMonth(1));

  btnExportPrint.addEventListener('click', () => {
    const pTime = document.getElementById('print-export-time');
    if (pTime) pTime.textContent = new Date().toLocaleString('vi-VN');
    window.print();
  });

  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('skilllink_token');
    localStorage.removeItem('skilllink_user');
    window.location.reload();
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    const res = await API.loginEmployee(u, p);
    if (res.data?.token) {
      localStorage.setItem('skilllink_token', res.data.token);
      localStorage.setItem('skilllink_user', JSON.stringify(res.data.user));
      loginErrorMsg.style.display = 'none';
      onAuthSuccess(res.data.token, res.data.user);
    } else {
      loginErrorMsg.textContent = res.message || 'Đăng nhập không thành công';
      loginErrorMsg.style.display = 'block';
    }
  });
}
