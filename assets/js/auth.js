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
  const btnLogout = document.getElementById('btn-logout');

  let currentUser = JSON.parse(localStorage.getItem('skilllink_user') || 'null');
  let token = localStorage.getItem('skilllink_token');
  let currentShift = null;

  // Initial UI state
  updateUI();

  // Toggle Dropdown or Open Modal
  userBtn.addEventListener('click', () => {
    if (token) {
      userDropdown.classList.toggle('show');
      if (userDropdown.classList.contains('show')) {
        fetchMyShifts(); // Refresh shift status on open
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

  // Fetch today's shift to allow checkin/checkout
  async function fetchMyShifts() {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/shifts/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const shifts = data.data;
        if (shifts.length > 0) {
          // Find the first shift that hasn't been checked out yet
          const activeShift = shifts.find(s => !s.attendance || !s.attendance.checkOutTime);
          // If all checked out, pick the last one to show status
          currentShift = activeShift || shifts[shifts.length - 1];
          
          btnCheckin.style.display = 'block';
          btnCheckout.style.display = 'block';

          const shiftName = currentShift.shiftName || 'Ca làm';

          if (currentShift.attendance && currentShift.attendance.checkInTime) {
            btnCheckin.textContent = `Đã Check-in (${shiftName})`;
            btnCheckin.disabled = true;
            btnCheckin.classList.add('opacity-50', 'cursor-not-allowed');
          } else {
            btnCheckin.textContent = `Điểm danh vào: ${shiftName}`;
            btnCheckin.disabled = false;
            btnCheckin.classList.remove('opacity-50', 'cursor-not-allowed');
          }

          if (currentShift.attendance && currentShift.attendance.checkOutTime) {
            btnCheckout.textContent = `Đã Check-out (${shiftName})`;
            btnCheckout.disabled = true;
            btnCheckout.classList.add('opacity-50', 'cursor-not-allowed');
          } else {
            btnCheckout.textContent = `Điểm danh ra: ${shiftName}`;
            btnCheckout.disabled = false;
            btnCheckout.classList.remove('opacity-50', 'cursor-not-allowed');
          }

        } else {
          currentShift = null;
          btnCheckin.style.display = 'none';
          btnCheckout.style.display = 'none';
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Helper to get geolocation
  function getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt của bạn không hỗ trợ định vị (GPS).'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            reject(new Error('Không thể lấy được vị trí. Vui lòng cho phép truy cập vị trí.'));
          }
        );
      }
    });
  }

  // Check In
  btnCheckin.addEventListener('click', async () => {
    if (!currentShift) return alert('Hôm nay bạn không có ca làm việc nào.');
    
    let location = {};
    try {
      btnCheckin.disabled = true;
      btnCheckin.textContent = 'Đang lấy vị trí...';
      location = await getLocation();
    } catch (err) {
      alert(err.message);
      btnCheckin.disabled = false;
      btnCheckin.textContent = 'Điểm danh vào ca';
      return;
    }

    try {
      const res = await fetch(`${API_URL}/shifts/check-in`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          shiftId: currentShift._id,
          lat: location.lat,
          lng: location.lng
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        await fetchMyShifts(); // Update UI
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Lỗi kết nối');
    } finally {
      if (btnCheckin.textContent === 'Đang lấy vị trí...') {
        btnCheckin.disabled = false;
        btnCheckin.textContent = `Điểm danh vào: ${currentShift.shiftName}`;
      }
    }
  });

  // Check Out
  btnCheckout.addEventListener('click', async () => {
    if (!currentShift) return alert('Hôm nay bạn không có ca làm việc nào.');
    try {
      const res = await fetch(`${API_URL}/shifts/check-out`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shiftId: currentShift._id })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        await fetchMyShifts(); // Update UI
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Lỗi kết nối');
    }
  });

  function updateUI() {
    if (currentUser) {
      userFullname.textContent = currentUser.fullName;
      if (currentUser.role === 'admin') {
        btnAdminPanel.style.display = 'block';
      } else {
        btnAdminPanel.style.display = 'none';
      }
    }
  }
});
