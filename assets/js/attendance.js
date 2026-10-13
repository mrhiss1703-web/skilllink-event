/**
 * SkillLink Event Agency - Attendance Flow & Modals
 * Production-ready Checkin/Checkout UI
 */

import { showToast } from './toast.js';

export function setupAttendance({ apiCall, openLoginModal, openChangePasswordModal }) {
  const $ = (id) => document.getElementById(id);

  // Check-in elements
  const checkinModal = $('checkin-modal');
  const btnCheckinSubmit = $('btn-checkin-submit');
  const checkinOnlineField = $('checkin-online-field');
  const checkinOfflineHint = $('checkin-offline-hint');
  const checkinTasksContent = $('checkin-tasks-content');
  const checkinStatus = $('checkin-status');
  const checkinStatusText = $('checkin-status-text');
  const checkinError = $('checkin-error');
  const checkinErrorText = $('checkin-error-text');
  const cardOffline = $('card-mode-offline');
  const cardOnline = $('card-mode-online');

  // Check-out elements
  const checkoutModal = $('checkout-modal');
  const btnCheckoutSubmit = $('btn-checkout-submit');
  const checkoutStatus = $('checkout-status');
  const checkoutStatusText = $('checkout-status-text');
  const checkoutError = $('checkout-error');
  const checkoutErrorText = $('checkout-error-text');

  const getStoredUser = () => {
    try {
      const str = localStorage.getItem('skilllink_user');
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  };

  const toggleModal = (modal, open) => {
    if (!modal) return;
    modal.classList.toggle('open', open);
    modal.setAttribute('aria-hidden', String(!open));
  };

  const setWorkMode = (mode) => {
    document.querySelectorAll('input[name="checkin_work_mode"]').forEach(r => {
      r.checked = (r.value === mode);
    });
    const isOnline = (mode === 'ONLINE');
    cardOnline?.classList.toggle('active', isOnline);
    cardOffline?.classList.toggle('active', !isOnline);
    if (checkinOnlineField) checkinOnlineField.style.display = isOnline ? 'block' : 'none';
    if (checkinOfflineHint) checkinOfflineHint.style.display = isOnline ? 'none' : 'flex';
    if (isOnline) checkinTasksContent?.focus();
    checkinError?.classList.remove('show');
  };

  cardOffline?.addEventListener('click', () => setWorkMode('OFFLINE'));
  cardOnline?.addEventListener('click', () => setWorkMode('ONLINE'));

  const setStatus = (box, textEl, text, show) => {
    if (!box) return;
    if (textEl && text) textEl.textContent = text;
    box.classList.toggle('show', show);
  };

  const setError = (box, textEl, msg) => {
    if (!box || !textEl) return;
    if (msg) {
      textEl.textContent = msg;
      box.classList.add('show');
    } else {
      box.classList.remove('show');
    }
  };

  // Open Check-in Modal
  const openCheckin = () => {
    const user = getStoredUser();
    if (!user) {
      showToast('Vui lòng đăng nhập tài khoản trước khi điểm danh.', 'warning');
      openLoginModal?.();
      return;
    }
    if (user.mustChangePassword) {
      showToast('Vui lòng đổi mật khẩu trước khi điểm danh.', 'warning', 'Đổi mật khẩu');
      openChangePasswordModal?.();
      return;
    }
    const roleName = user.role === 'admin' ? 'Quản trị viên' :
      (user.attendanceGroup === 'INTERN_SHIFT' || user.role === 'INTERN' || user.employeeType === 'INTERN' ? 'Thực tập sinh' : 'Nhân sự');
    const badge = $('checkin-user-badge');
    if (badge) {
      const todayStr = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
      badge.textContent = `${user.fullName || user.username} (${roleName}) · ${todayStr}`;
    }
    setWorkMode('OFFLINE');
    if (checkinTasksContent) checkinTasksContent.value = '';
    setError(checkinError, checkinErrorText, null);
    setStatus(checkinStatus, checkinStatusText, '', false);
    if (btnCheckinSubmit) {
      btnCheckinSubmit.disabled = false;
      btnCheckinSubmit.innerHTML = '<span>Xác nhận điểm danh</span>';
    }
    toggleModal(checkinModal, true);
  };

  const submitCheckin = async () => {
    setError(checkinError, checkinErrorText, null);
    const selectedRadio = document.querySelector('input[name="checkin_work_mode"]:checked');
    const workMode = selectedRadio ? selectedRadio.value : 'OFFLINE';
    const content = checkinTasksContent?.value?.trim() || '';

    if (workMode === 'ONLINE' && !content) {
      setError(checkinError, checkinErrorText, 'Vui lòng ghi nhanh kế hoạch / dự kiến công việc hôm nay để điểm danh Online.');
      checkinTasksContent?.focus();
      return;
    }

    btnCheckinSubmit.disabled = true;

    const execute = async (lat = null, lng = null) => {
      try {
        setStatus(checkinStatus, checkinStatusText, 'Đang gửi dữ liệu điểm danh...', true);
        const body = { work_mode: workMode };
        if (lat !== null && lng !== null) { body.lat = lat; body.lng = lng; }
        if (content) body.content = content;

        const res = await apiCall('/attendance/checkin', 'POST', body);
        toggleModal(checkinModal, false);
        showToast(res.message || 'Điểm danh vào ca thành công!', 'success', 'Điểm danh thành công');
      } catch (err) {
        setStatus(checkinStatus, checkinStatusText, '', false);
        setError(checkinError, checkinErrorText, err.message || 'Lỗi khi điểm danh');
        if (err.message && err.message.includes('đổi mật khẩu')) {
          toggleModal(checkinModal, false);
          openChangePasswordModal?.();
        } else if (err.message && (err.message.includes('đăng nhập') || err.message.includes('Phiên'))) {
          toggleModal(checkinModal, false);
          showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'warning', 'Đăng nhập');
          openLoginModal?.();
        }
        btnCheckinSubmit.disabled = false;
        btnCheckinSubmit.innerHTML = '<span>Thử lại</span>';
      }
    };

    if (workMode === 'OFFLINE') {
      if (!navigator.geolocation) {
        setError(checkinError, checkinErrorText, 'Trình duyệt không hỗ trợ định vị GPS.');
        btnCheckinSubmit.disabled = false;
        return;
      }
      setStatus(checkinStatus, checkinStatusText, 'Đang xác định tọa độ GPS... (Vui lòng bấm Cho phép/Allow nếu được hỏi)', true);
      navigator.geolocation.getCurrentPosition(
        (pos) => execute(pos.coords.latitude, pos.coords.longitude),
        () => {
          setStatus(checkinStatus, checkinStatusText, '', false);
          setError(checkinError, checkinErrorText, 'Không thể lấy vị trí GPS. Vui lòng cấp quyền truy cập vị trí để chấm công OFFLINE.');
          btnCheckinSubmit.disabled = false;
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      execute(null, null);
    }
  };

  // Open Checkout Modal
  const openCheckout = () => {
    const user = getStoredUser();
    if (!user) {
      showToast('Vui lòng đăng nhập tài khoản trước khi điểm danh.', 'warning');
      openLoginModal?.();
      return;
    }
    if (user.mustChangePassword) {
      showToast('Vui lòng đổi mật khẩu trước khi điểm danh.', 'warning', 'Đổi mật khẩu');
      openChangePasswordModal?.();
      return;
    }
    const badge = $('checkout-user-badge');
    if (badge) badge.textContent = `${user.fullName || user.username} · Hoàn thành ca làm việc`;
    setError(checkoutError, checkoutErrorText, null);
    setStatus(checkoutStatus, checkoutStatusText, '', false);
    if (btnCheckoutSubmit) {
      btnCheckoutSubmit.disabled = false;
      btnCheckoutSubmit.innerHTML = '<span>Xác nhận ra ca</span>';
    }
    toggleModal(checkoutModal, true);
  };

  const submitCheckout = async () => {
    setError(checkoutError, checkoutErrorText, null);
    btnCheckoutSubmit.disabled = true;

    const execute = async (lat = null, lng = null) => {
      try {
        setStatus(checkoutStatus, checkoutStatusText, 'Đang gửi dữ liệu kết thúc ca làm...', true);
        const body = {};
        if (lat !== null && lng !== null) { body.lat = lat; body.lng = lng; }
        const res = await apiCall('/attendance/checkout', 'POST', body);
        toggleModal(checkoutModal, false);
        showToast(res.message || 'Điểm danh ra ca thành công! Hẹn gặp lại bạn.', 'success', 'Ra ca thành công');
      } catch (err) {
        setStatus(checkoutStatus, checkoutStatusText, '', false);
        setError(checkoutError, checkoutErrorText, err.message || 'Lỗi khi điểm danh ra');
        if (err.message && (err.message.includes('đăng nhập') || err.message.includes('Phiên'))) {
          toggleModal(checkoutModal, false);
          showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'warning', 'Đăng nhập');
          openLoginModal?.();
        }
        btnCheckoutSubmit.disabled = false;
        btnCheckoutSubmit.innerHTML = '<span>Thử lại</span>';
      }
    };

    if (navigator.geolocation) {
      setStatus(checkoutStatus, checkoutStatusText, 'Đang xác định vị trí GPS...', true);
      navigator.geolocation.getCurrentPosition(
        (pos) => execute(pos.coords.latitude, pos.coords.longitude),
        () => execute(null, null),
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      execute(null, null);
    }
  };

  // Bind Events
  $('btn-checkin')?.addEventListener('click', openCheckin);
  $('checkin-close')?.addEventListener('click', () => toggleModal(checkinModal, false));
  $('btn-checkin-cancel')?.addEventListener('click', () => toggleModal(checkinModal, false));
  btnCheckinSubmit?.addEventListener('click', submitCheckin);
  checkinModal?.addEventListener('click', (e) => {
    if (e.target === checkinModal) toggleModal(checkinModal, false);
  });

  $('btn-checkout')?.addEventListener('click', openCheckout);
  $('checkout-close')?.addEventListener('click', () => toggleModal(checkoutModal, false));
  $('btn-checkout-cancel')?.addEventListener('click', () => toggleModal(checkoutModal, false));
  btnCheckoutSubmit?.addEventListener('click', submitCheckout);
  checkoutModal?.addEventListener('click', (e) => {
    if (e.target === checkoutModal) toggleModal(checkoutModal, false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleModal(checkinModal, false);
      toggleModal(checkoutModal, false);
    }
  });
}
