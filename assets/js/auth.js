/**
 * SkillLink Event Agency - Authentication & Internal Portal Logic
 */

import { showToast } from './toast.js';
import { setupAttendance } from './attendance.js';

document.addEventListener('DOMContentLoaded', () => {
  const userBtn = document.getElementById('user-btn');
  const userDropdown = document.getElementById('user-dropdown');
  const btnShowLogin = document.getElementById('btn-show-login');

  // Modal Elements
  const authModal = document.getElementById('auth-modal');
  const authClose = document.getElementById('auth-close');
  const authForm = document.getElementById('auth-form');
  const authError = document.getElementById('auth-error');
  const usernameInput = document.getElementById('auth-username');
  const passwordInput = document.getElementById('auth-password');
  const togglePwdBtn = document.getElementById('toggle-login-pwd');
  const authSubmit = document.getElementById('auth-submit');

  // Dropdown UI Elements
  const userFullname = document.getElementById('user-fullname');
  const userMeta = document.getElementById('user-meta');
  const btnAdminPanel = document.getElementById('btn-admin-panel');
  const btnWorklogPage = document.getElementById('btn-worklog-page');
  const btnCheckin = document.getElementById('btn-checkin');
  const btnCheckout = document.getElementById('btn-checkout');
  const btnLogout = document.getElementById('btn-logout');

  // Cấu hình URL gọi API đồng bộ theo domain cổng portal
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const portalUrl = window.SKILLLINK_PORTAL_URL || (isLocal ? `http://${window.location.hostname}:5173` : 'https://skilllink-admin-fawn.vercel.app');
  const API_URL = window.SKILLLINK_API_URL || `${portalUrl}/api`;

  // Toggle Dropdown
  userBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = userBtn.getAttribute('aria-expanded') === 'true';
    userBtn.setAttribute('aria-expanded', !isExpanded);
    userDropdown?.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (userDropdown && !userDropdown.contains(e.target) && e.target !== userBtn) {
      userBtn?.setAttribute('aria-expanded', 'false');
      userDropdown.classList.remove('show');
    }
  });

  // Helper API Call (Có gửi thông tin xác thực)
  async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
      'Content-Type': 'application/json',
      'X-SkillLink-Client': 'react'
    };

    const config = {
      method,
      headers,
      credentials: 'include'
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Lỗi kết nối máy chủ');
    }
    return data;
  }

  // Cập nhật giao diện dựa trên dữ liệu localStorage (offline cache)
  function updateUI() {
    const userStr = localStorage.getItem('skilllink_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (userFullname) userFullname.textContent = user.fullName || user.username;
        if (userMeta) userMeta.textContent = user.role === 'admin' ? 'Quản trị viên' : 'Nhân sự';

        if (btnShowLogin) btnShowLogin.style.display = 'none';
        if (btnAdminPanel) btnAdminPanel.style.display = 'block';
        if (btnWorklogPage) btnWorklogPage.style.display = 'block';
        if (btnCheckin) btnCheckin.style.display = 'block';
        if (btnCheckout) btnCheckout.style.display = 'block';
        if (btnLogout) btnLogout.style.display = 'block';
      } catch (e) {
        logout();
      }
    } else {
      if (userFullname) userFullname.textContent = 'Khách';
      if (userMeta) userMeta.textContent = 'Chưa đăng nhập';

      if (btnShowLogin) btnShowLogin.style.display = 'block';
      if (btnAdminPanel) btnAdminPanel.style.display = 'none';
      if (btnWorklogPage) btnWorklogPage.style.display = 'none';
      if (btnCheckin) btnCheckin.style.display = 'none';
      if (btnCheckout) btnCheckout.style.display = 'none';
      if (btnLogout) btnLogout.style.display = 'none';
    }
  }

  // Kiểm tra phiên đăng nhập hiện tại từ server
  async function checkSession() {
    try {
      const data = await apiCall('/auth/me');
      localStorage.setItem('skilllink_user', JSON.stringify(data.data || data));
      updateUI();
    } catch (e) {
      localStorage.removeItem('skilllink_user');
      updateUI();
    }
  }

  function openLoginModal() {
    userDropdown?.classList.remove('show');
    authModal?.classList.add('open');
    authModal?.setAttribute('aria-hidden', 'false');
    usernameInput?.focus();
  }

  function closeLoginModal() {
    authModal?.classList.remove('open');
    authModal?.setAttribute('aria-hidden', 'true');
    if (authError) authError.style.display = 'none';
  }

  // Login Modal Events
  btnShowLogin?.addEventListener('click', openLoginModal);
  authClose?.addEventListener('click', closeLoginModal);
  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeLoginModal();
  });

  togglePwdBtn?.addEventListener('click', () => {
    if (!passwordInput) return;
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePwdBtn.textContent = type === 'password' ? '👁' : '👁‍🗨';
  });

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (authError) authError.style.display = 'none';
    if (authSubmit) {
      authSubmit.disabled = true;
      authSubmit.textContent = 'Đang đăng nhập...';
    }

    try {
      const data = await apiCall('/auth/login', 'POST', {
        username: usernameInput.value,
        password: passwordInput.value
      });

      const user = data.data?.user || {};
      localStorage.setItem('skilllink_user', JSON.stringify(user));

      closeLoginModal();
      authForm.reset();
      updateUI();

      showToast(`Đăng nhập thành công! Chào mừng ${user.fullName || user.username}.`, 'success', 'Đăng nhập thành công');
    } catch (err) {
      if (authError) {
        authError.textContent = err.message;
        authError.style.display = 'block';
      }
    } finally {
      if (authSubmit) {
        authSubmit.disabled = false;
        authSubmit.textContent = 'Đăng nhập';
      }
    }
  });

  // Logout
  async function logout() {
    try {
      await apiCall('/auth/logout', 'POST');
    } catch(e) {}
    localStorage.removeItem('skilllink_user');
    updateUI();
    userDropdown?.classList.remove('show');
    showToast('Bạn đã đăng xuất khỏi hệ thống.', 'info', 'Đã đăng xuất');
  }

  btnLogout?.addEventListener('click', logout);

  // Setup Checkin/Checkout Modals
  setupAttendance({ apiCall, openLoginModal });

  // Khởi tạo trạng thái
  updateUI();
  checkSession();
});
