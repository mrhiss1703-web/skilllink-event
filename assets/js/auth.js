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

  // Change Password Modal Elements
  const changePwdModal = document.getElementById('change-pwd-modal');
  const changePwdClose = document.getElementById('change-pwd-close');
  const changePwdForm = document.getElementById('change-pwd-form');
  const changePwdError = document.getElementById('change-pwd-error');
  const changePwdCurrent = document.getElementById('change-pwd-current');
  const changePwdNew = document.getElementById('change-pwd-new');
  const changePwdConfirm = document.getElementById('change-pwd-confirm');
  const changePwdSubmit = document.getElementById('change-pwd-submit');
  const toggleChangeCurBtn = document.getElementById('toggle-change-cur-pwd');
  const toggleChangeNewBtn = document.getElementById('toggle-change-new-pwd');
  const toggleChangeConfBtn = document.getElementById('toggle-change-conf-pwd');

  // Dropdown UI Elements
  const userFullname = document.getElementById('user-fullname');
  const userMeta = document.getElementById('user-meta');
  const btnAdminPanel = document.getElementById('btn-admin-panel');
  const btnWorklogPage = document.getElementById('btn-worklog-page');
  const btnCheckin = document.getElementById('btn-checkin');
  const btnCheckout = document.getElementById('btn-checkout');
  const btnChangePwd = document.getElementById('btn-change-pwd');
  const btnLogout = document.getElementById('btn-logout');

  // Cấu hình URL gọi API đồng bộ theo domain cổng portal
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const portalUrl = window.SKILLLINK_PORTAL_URL || (isLocal ? `http://${window.location.hostname}:5173` : 'https://skilllink-admin-fawn.vercel.app');
  const API_URL = window.SKILLLINK_API_URL || (isLocal ? `http://${window.location.hostname}:5000/api` : `${portalUrl}/api`);

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

  // Helper API Call (Có gửi thông tin xác thực & tự động refresh token)
  let refreshPromise = null;

  async function performRefreshToken() {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const storedRefreshToken = localStorage.getItem('skilllink_refresh_token');
        const refreshHeaders = {
          'Content-Type': 'application/json',
          'X-SkillLink-Client': 'react'
        };
        const refreshConfig = {
          method: 'POST',
          headers: refreshHeaders,
          credentials: 'include'
        };
        if (storedRefreshToken) {
          refreshConfig.body = JSON.stringify({ refreshToken: storedRefreshToken });
        }
        const res = await fetch(`${API_URL}/auth/refresh-token`, refreshConfig);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || 'Phiên làm việc đã hết hạn');
        }
        const newToken = data.data?.token || data.token;
        if (newToken) {
          localStorage.setItem('skilllink_token', newToken);
        }
        const newRefreshToken = data.data?.refreshToken || data.refreshToken;
        if (newRefreshToken) {
          localStorage.setItem('skilllink_refresh_token', newRefreshToken);
        }
        const newUser = data.data?.user || data.user;
        if (newUser) {
          localStorage.setItem('skilllink_user', JSON.stringify(newUser));
        }
        return newToken;
      })().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  }

  async function apiCall(endpoint, method = 'GET', body = null, isRetry = false) {
    const headers = {
      'Content-Type': 'application/json',
      'X-SkillLink-Client': 'react'
    };

    const token = localStorage.getItem('skilllink_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
      credentials: 'include'
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    // Tự động làm mới phiên nếu token hết hạn (401)
    if (response.status === 401 && !isRetry && !/\/auth\/(login|refresh-token|logout)/.test(endpoint)) {
      try {
        await performRefreshToken();
        return await apiCall(endpoint, method, body, true);
      } catch (refreshErr) {
        localStorage.removeItem('skilllink_token');
        localStorage.removeItem('skilllink_refresh_token');
        localStorage.removeItem('skilllink_user');
        updateUI();
        throw new Error(refreshErr.message || 'Phiên đăng nhập đã hết hạn');
      }
    }

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
        if (btnChangePwd) btnChangePwd.style.display = 'block';
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
      if (btnChangePwd) btnChangePwd.style.display = 'none';
      if (btnLogout) btnLogout.style.display = 'none';
    }
  }

  // Kiểm tra phiên đăng nhập hiện tại từ server
  async function checkSession() {
    try {
      const token = localStorage.getItem('skilllink_token');
      const refreshToken = localStorage.getItem('skilllink_refresh_token');
      // Nếu hoàn toàn chưa có token thì không cần kiểm tra server
      if (!token && !refreshToken) {
        localStorage.removeItem('skilllink_user');
        updateUI();
        return;
      }
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

  function openChangePasswordModal(prefilledCurrentPwd = '') {
    userDropdown?.classList.remove('show');
    if (changePwdCurrent) changePwdCurrent.value = prefilledCurrentPwd || '';
    if (changePwdNew) changePwdNew.value = '';
    if (changePwdConfirm) changePwdConfirm.value = '';
    if (changePwdError) changePwdError.style.display = 'none';

    changePwdModal?.classList.add('open');
    changePwdModal?.setAttribute('aria-hidden', 'false');

    if (prefilledCurrentPwd && changePwdNew) {
      changePwdNew.focus();
    } else if (changePwdCurrent) {
      changePwdCurrent.focus();
    }
  }

  function closeChangePasswordModal() {
    changePwdModal?.classList.remove('open');
    changePwdModal?.setAttribute('aria-hidden', 'true');
    if (changePwdError) changePwdError.style.display = 'none';
  }

  // Login Modal Events
  btnShowLogin?.addEventListener('click', openLoginModal);
  authClose?.addEventListener('click', closeLoginModal);
  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeLoginModal();
  });

  // Change Password Modal Events
  btnChangePwd?.addEventListener('click', () => openChangePasswordModal(''));
  changePwdClose?.addEventListener('click', closeChangePasswordModal);
  changePwdModal?.addEventListener('click', (e) => {
    if (e.target === changePwdModal) closeChangePasswordModal();
  });

  function bindTogglePwd(btn, input) {
    btn?.addEventListener('click', () => {
      if (!input) return;
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      btn.textContent = type === 'password' ? '👁' : '👁‍🗨';
    });
  }

  bindTogglePwd(togglePwdBtn, passwordInput);
  bindTogglePwd(toggleChangeCurBtn, changePwdCurrent);
  bindTogglePwd(toggleChangeNewBtn, changePwdNew);
  bindTogglePwd(toggleChangeConfBtn, changePwdConfirm);

  // Submit Login
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
      const token = data.data?.token || '';
      const refreshToken = data.data?.refreshToken || '';
      if (token) {
        localStorage.setItem('skilllink_token', token);
      }
      if (refreshToken) {
        localStorage.setItem('skilllink_refresh_token', refreshToken);
      }
      const savedPassword = passwordInput.value;
      localStorage.setItem('skilllink_user', JSON.stringify(user));

      closeLoginModal();
      authForm.reset();
      updateUI();

      if (user.mustChangePassword) {
        showToast('Vui lòng thiết lập mật khẩu mới trước khi điểm danh.', 'info', 'Đổi mật khẩu lần đầu');
        openChangePasswordModal(savedPassword);
        return;
      }

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

  // Submit Change Password
  changePwdForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (changePwdError) changePwdError.style.display = 'none';

    const currentPassword = changePwdCurrent?.value?.trim() || '';
    const newPassword = changePwdNew?.value || '';
    const confirmPassword = changePwdConfirm?.value || '';

    if (newPassword.length < 8) {
      if (changePwdError) {
        changePwdError.textContent = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
        changePwdError.style.display = 'block';
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      if (changePwdError) {
        changePwdError.textContent = 'Xác nhận mật khẩu mới chưa khớp.';
        changePwdError.style.display = 'block';
      }
      return;
    }

    if (newPassword === currentPassword) {
      if (changePwdError) {
        changePwdError.textContent = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
        changePwdError.style.display = 'block';
      }
      return;
    }

    if (changePwdSubmit) {
      changePwdSubmit.disabled = true;
      changePwdSubmit.textContent = 'Đang lưu mật khẩu...';
    }

    try {
      // 1. Gọi API đổi mật khẩu
      await apiCall('/auth/password', 'PUT', { currentPassword, newPassword });

      // 2. Tự động đăng nhập lại để nhận phiên đăng nhập mới (không còn cờ mustChangePassword)
      let username = '';
      try {
        const u = JSON.parse(localStorage.getItem('skilllink_user') || '{}');
        username = u.username || '';
      } catch (err) {}

      if (username) {
        const loginData = await apiCall('/auth/login', 'POST', { username, password: newPassword });
        const updatedUser = loginData.data?.user || {};
        const updatedToken = loginData.data?.token || '';
        const updatedRefreshToken = loginData.data?.refreshToken || '';
        if (updatedToken) {
          localStorage.setItem('skilllink_token', updatedToken);
        }
        if (updatedRefreshToken) {
          localStorage.setItem('skilllink_refresh_token', updatedRefreshToken);
        }
        localStorage.setItem('skilllink_user', JSON.stringify(updatedUser));
      }

      closeChangePasswordModal();
      changePwdForm.reset();
      updateUI();

      showToast('Đổi mật khẩu thành công! Giờ bạn có thể điểm danh.', 'success', 'Thành công');

      // 3. Tự động mở modal điểm danh ngay để trải nghiệm liền mạch
      setTimeout(() => {
        const btnCheckin = document.getElementById('btn-checkin');
        if (btnCheckin) btnCheckin.click();
      }, 500);
    } catch (err) {
      if (changePwdError) {
        changePwdError.textContent = err.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại.';
        changePwdError.style.display = 'block';
      }
    } finally {
      if (changePwdSubmit) {
        changePwdSubmit.disabled = false;
        changePwdSubmit.textContent = 'Lưu mật khẩu & Điểm danh ngay';
      }
    }
  });

  // Logout
  async function logout() {
    try {
      const storedRefreshToken = localStorage.getItem('skilllink_refresh_token');
      await apiCall('/auth/logout', 'POST', storedRefreshToken ? { refreshToken: storedRefreshToken } : null);
    } catch(e) {}
    localStorage.removeItem('skilllink_user');
    localStorage.removeItem('skilllink_token');
    localStorage.removeItem('skilllink_refresh_token');
    updateUI();
    userDropdown?.classList.remove('show');
    showToast('Bạn đã đăng xuất khỏi hệ thống.', 'info', 'Đã đăng xuất');
  }

  btnLogout?.addEventListener('click', logout);

  // Setup Checkin/Checkout Modals
  setupAttendance({ apiCall, openLoginModal, openChangePasswordModal });

  // Khởi tạo trạng thái
  updateUI();
  checkSession();
});
