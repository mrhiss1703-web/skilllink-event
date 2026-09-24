const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal ? 'http://localhost:5000/api' : 'https://vinh-long-marathon.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
  const userBtn = document.getElementById('user-btn');
  const userDropdown = document.getElementById('user-dropdown');
  const authModal = document.getElementById('auth-modal');
  const authClose = document.getElementById('auth-close');
  const authForm = document.getElementById('auth-form');
  const authError = document.getElementById('auth-error');

  const userFullname = document.getElementById('user-fullname');
  const btnCheckin = document.getElementById('btn-checkin');
  const btnCheckout = document.getElementById('btn-checkout');
  const btnAdminPanel = document.getElementById('btn-admin-panel');
  const btnWorklogPage = document.getElementById('btn-worklog-page');
  const btnLogout = document.getElementById('btn-logout');

  let currentUser = JSON.parse(localStorage.getItem('skilllink_user') || 'null');
  let token = localStorage.getItem('skilllink_token');

  // Initial UI state
  updateUI();

  // Toggle password visibility on login form
  const toggleLoginPwd = document.getElementById('toggle-login-pwd');
  const authPassword = document.getElementById('auth-password');
  if (toggleLoginPwd && authPassword) {
    toggleLoginPwd.addEventListener('click', () => {
      const isHidden = authPassword.type === 'password';
      authPassword.type = isHidden ? 'text' : 'password';
      toggleLoginPwd.innerHTML = isHidden
        ? `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/></svg>`
        : `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
    });
  }

  // Toggle Dropdown or Open Modal
  userBtn.addEventListener('click', () => {
    if (token) {
      userDropdown.classList.toggle('show');
      if (userDropdown.classList.contains('show')) {
        fetchMyAttendanceToday();
      }
    } else {
      authModal.classList.add('open');
    }
  });

  // Close Dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove('show');
    }
  });

  // Close Modal
  authClose.addEventListener('click', () => {
    authModal.classList.remove('open');
    authError.style.display = 'none';
  });

  // Login Submit
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;

    try {
      const res = await fetch(`${API_URL}/employees/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok) {
        token = data.data.token;
        currentUser = data.data.user;
        localStorage.setItem('skilllink_token', token);
        localStorage.setItem('skilllink_user', JSON.stringify(currentUser));
        authModal.classList.remove('open');
        authForm.reset();
        authError.style.display = 'none';
        updateUI();
      } else {
        authError.textContent = data.message || 'Đăng nhập thất bại';
        authError.style.display = 'block';
      }
    } catch (err) {
      authError.textContent = 'Không thể kết nối đến máy chủ';
      authError.style.display = 'block';
    }
  });

  // Logout
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('skilllink_token');
    localStorage.removeItem('skilllink_user');
    token = null;
    currentUser = null;
    userDropdown.classList.remove('show');
    updateUI();
  });

  // --- Attendance (Free Check-in / Check-out) ---
  async function fetchMyAttendanceToday() {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/attendance/me/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const record = data.data;

      btnCheckin.style.display = 'block';
      btnCheckout.style.display = 'block';

      if (!record) {
        btnCheckin.textContent = 'Điểm danh vào';
        btnCheckin.disabled = false;
        btnCheckin.classList.remove('opacity-50', 'cursor-not-allowed');
        btnCheckout.textContent = 'Điểm danh ra';
        btnCheckout.disabled = true;
        btnCheckout.classList.add('opacity-50', 'cursor-not-allowed');
      } else if (record.checkInTime && !record.checkOutTime) {
        const ciTime = new Date(record.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        btnCheckin.textContent = `✓ Đã vào lúc ${ciTime}`;
        btnCheckin.disabled = true;
        btnCheckin.classList.add('opacity-50', 'cursor-not-allowed');
        btnCheckout.textContent = 'Điểm danh ra';
        btnCheckout.disabled = false;
        btnCheckout.classList.remove('opacity-50', 'cursor-not-allowed');
      } else if (record.checkInTime && record.checkOutTime) {
        const ciTime = new Date(record.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const coTime = new Date(record.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        btnCheckin.textContent = `✓ Vào ${ciTime}`;
        btnCheckin.disabled = true;
        btnCheckin.classList.add('opacity-50', 'cursor-not-allowed');
        btnCheckout.textContent = `✓ Ra ${coTime}`;
        btnCheckout.disabled = true;
        btnCheckout.classList.add('opacity-50', 'cursor-not-allowed');
      }
    } catch (err) {
      console.error(err);
    }
  }

  function getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt của bạn không hỗ trợ định vị (GPS).'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => reject(new Error('Không thể lấy được vị trí. Vui lòng cho phép truy cập vị trí.'))
        );
      }
    });
  }

  // Check In
  btnCheckin.addEventListener('click', async () => {
    let location = {};
    try {
      btnCheckin.disabled = true;
      btnCheckin.textContent = 'Đang lấy vị trí...';
      location = await getLocation();
    } catch (err) {
      location = {};
    }

    try {
      const res = await fetch(`${API_URL}/attendance/free-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ lat: location.lat, lng: location.lng })
      });
      const data = await res.json();
      alert(data.message);
      await fetchMyAttendanceToday();
    } catch (err) {
      alert('Lỗi kết nối');
    } finally {
      btnCheckin.disabled = false;
    }
  });

  // Check Out
  btnCheckout.addEventListener('click', async () => {
    try {
      btnCheckout.disabled = true;
      btnCheckout.textContent = 'Đang xử lý...';
      const res = await fetch(`${API_URL}/attendance/free-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({})
      });
      const data = await res.json();
      alert(data.message);
      await fetchMyAttendanceToday();
    } catch (err) {
      alert('Lỗi kết nối');
    } finally {
      btnCheckout.disabled = false;
    }
  });

  function updateUI() {
    if (currentUser) {
      userFullname.textContent = currentUser.fullName;
      if (currentUser.role === 'admin') {
        btnAdminPanel.style.display = 'block';
        if (btnWorklogPage) btnWorklogPage.style.display = 'none';
      } else {
        btnAdminPanel.style.display = 'none';
        if (btnWorklogPage) btnWorklogPage.style.display = 'block';
      }
    } else {
      if (btnWorklogPage) btnWorklogPage.style.display = 'none';
      if (btnAdminPanel) btnAdminPanel.style.display = 'none';
    }
  }
});
