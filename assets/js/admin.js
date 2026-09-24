const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal ? 'http://localhost:5000/api' : 'https://vinh-long-marathon.onrender.com/api';
let token = localStorage.getItem('skilllink_token');
let currentUser = JSON.parse(localStorage.getItem('skilllink_user') || 'null');

// Require login & Admin role
if (!token || !currentUser || currentUser.role !== 'admin') {
  alert('Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với tài khoản Quản trị.');
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('admin-name').textContent = currentUser.fullName;

  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('skilllink_token');
    localStorage.removeItem('skilllink_user');
    window.location.href = 'index.html';
  });

  // Forms
  document.getElementById('form-employee').addEventListener('submit', handleEmployeeSubmit);
  document.getElementById('form-shift').addEventListener('submit', handleShiftSubmit);
  document.getElementById('form-settings').addEventListener('submit', handleSettingsSubmit);

  // Toggle password visibility in employee modal
  const toggleEmpPwd = document.getElementById('toggle-emp-pwd');
  const empPwdInput = document.getElementById('emp-password');
  if (toggleEmpPwd && empPwdInput) {
    toggleEmpPwd.addEventListener('click', () => {
      const isHidden = empPwdInput.type === 'password';
      empPwdInput.type = isHidden ? 'text' : 'password';
      toggleEmpPwd.innerHTML = isHidden
        ? `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/></svg>`
        : `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
    });
  }

  const btnGetLoc = document.getElementById('btn-get-location');
  if (btnGetLoc) {
    btnGetLoc.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Trình duyệt của bạn không hỗ trợ định vị (GPS).');
        return;
      }
      btnGetLoc.textContent = 'Đang lấy vị trí...';
      btnGetLoc.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          document.getElementById('cfg-lat').value = position.coords.latitude;
          document.getElementById('cfg-lng').value = position.coords.longitude;
          btnGetLoc.textContent = 'Lấy vị trí hiện tại của tôi';
          btnGetLoc.disabled = false;
        },
        (error) => {
          alert('Không thể lấy được vị trí. Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt.');
          btnGetLoc.textContent = 'Lấy vị trí hiện tại của tôi';
          btnGetLoc.disabled = false;
        }
      );
    });
  }

  // Initial load
  loadEmployees();
});

// --- Tab Navigation ---
function switchTab(tabName) {
  const tabs = ['employees', 'shifts', 'attendance', 'worklogs', 'settings'];

  tabs.forEach(t => {
    document.getElementById(`sec-${t}`).classList.add('hidden');
    document.getElementById(`tab-${t}`).classList.remove('active', 'bg-blue-600', 'text-white');
    document.getElementById(`tab-${t}`).classList.add('text-gray-300');
  });

  document.getElementById(`sec-${tabName}`).classList.remove('hidden');
  document.getElementById(`tab-${tabName}`).classList.add('active', 'bg-blue-600', 'text-white');
  document.getElementById(`tab-${tabName}`).classList.remove('text-gray-300');

  if (tabName === 'employees') {
    document.getElementById('page-title').textContent = 'Quản lý nhân viên';
    loadEmployees();
  } else if (tabName === 'shifts') {
    document.getElementById('page-title').textContent = 'Quản lý ca làm việc';
    loadShifts();
    loadEmployeeOptions();
  } else if (tabName === 'attendance') {
    document.getElementById('page-title').textContent = 'Quản lý điểm danh';
    loadAttendances();
  } else if (tabName === 'worklogs') {
    document.getElementById('page-title').textContent = 'Nhật ký đầu việc';
    initWorklogTab();
  } else if (tabName === 'settings') {
    document.getElementById('page-title').textContent = 'Cấu hình điểm danh';
    loadSettings();
  }
}

// --- Modals ---
function closeModals() {
  document.getElementById('modal-employee').classList.add('hidden');
  document.getElementById('modal-shift').classList.add('hidden');
}

function openEmployeeModal(emp = null) {
  document.getElementById('form-employee').reset();
  document.getElementById('emp-id').value = emp ? emp._id : '';

  // Reset password toggle icon
  const empPwdInput = document.getElementById('emp-password');
  const toggleEmpPwd = document.getElementById('toggle-emp-pwd');
  if (empPwdInput) empPwdInput.type = 'password';
  if (toggleEmpPwd) toggleEmpPwd.innerHTML = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;

  if (emp) {
    document.getElementById('emp-modal-title').textContent = 'Cập nhật Nhân Viên';
    document.getElementById('emp-fullname').value = emp.fullName;
    document.getElementById('emp-username').value = emp.username;
    document.getElementById('emp-username').readOnly = true;
    document.getElementById('emp-role').value = emp.role;
    document.getElementById('emp-phone').value = emp.phone || '';
    document.getElementById('emp-active').checked = emp.isActive;
    document.getElementById('emp-password').required = false;
    document.getElementById('emp-password').value = '';
  } else {
    document.getElementById('emp-modal-title').textContent = 'Thêm Nhân Viên';
    document.getElementById('emp-username').readOnly = false;
    document.getElementById('emp-password').required = false;
    document.getElementById('emp-password').value = 'skilllink123';
  }

  document.getElementById('modal-employee').classList.remove('hidden');
}

function openShiftModal(shift = null) {
  document.getElementById('form-shift').reset();
  document.getElementById('shift-id').value = shift ? shift._id : '';
  
  if (shift) {
    document.getElementById('shift-modal-title').textContent = 'Cập nhật Ca Làm';
    document.getElementById('shift-employee').value = shift.employeeId._id;
    document.getElementById('shift-name').value = shift.shiftName;
    document.getElementById('shift-date').value = shift.date.split('T')[0];
    
    // Parse time
    const sDate = new Date(shift.startTime);
    const eDate = new Date(shift.endTime);
    document.getElementById('shift-start').value = sDate.toTimeString().substring(0, 5);
    document.getElementById('shift-end').value = eDate.toTimeString().substring(0, 5);
  } else {
    document.getElementById('shift-modal-title').textContent = 'Xếp Ca Làm';
  }
  
  document.getElementById('modal-shift').classList.remove('hidden');
}

// --- Data Fetching & Rendering ---
let allEmployees = [];

async function loadEmployees() {
  try {
    const res = await fetch(`${API_URL}/employees`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      allEmployees = data.data;
      renderEmployees(allEmployees);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderEmployees(emps) {
  const tbody = document.getElementById('employee-tbody');
  tbody.innerHTML = '';
  emps.forEach(emp => {
    const roleBadge = emp.role === 'admin' 
      ? `<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Quản trị</span>` 
      : `<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Nhân viên</span>`;
    
    const statusBadge = emp.isActive 
      ? `<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Hoạt động</span>`
      : `<span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Đã khóa</span>`;

    const tr = document.createElement('tr');
    tr.className = "hover:bg-gray-50 transition-colors";
    tr.innerHTML = `
      <td class="px-6 py-4">
        <div class="font-medium text-gray-900">${emp.fullName}</div>
        <div class="text-xs text-gray-500">${emp.phone || 'Không có SĐT'}</div>
      </td>
      <td class="px-6 py-4 text-gray-600">${emp.username}</td>
      <td class="px-6 py-4">${roleBadge}</td>
      <td class="px-6 py-4">${statusBadge}</td>
      <td class="px-6 py-4 text-right">
        <button onclick='openEmployeeModal(${JSON.stringify(emp).replace(/'/g, "&#39;")})' class="text-blue-600 hover:text-blue-900 font-medium mr-3">Sửa</button>
        <button onclick="deleteEmployee('${emp._id}')" class="text-red-600 hover:text-red-900 font-medium">Xóa</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadShifts() {
  try {
    const res = await fetch(`${API_URL}/shifts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      renderShifts(data.data);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderShifts(shifts) {
  const tbody = document.getElementById('shift-tbody');
  tbody.innerHTML = '';
  shifts.forEach(shift => {
    const sDate = new Date(shift.startTime).toTimeString().substring(0, 5);
    const eDate = new Date(shift.endTime).toTimeString().substring(0, 5);
    const dateStr = new Date(shift.date).toLocaleDateString('vi-VN');
    
    let statusBadge = '';
    if (shift.status === 'scheduled') statusBadge = `<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Sắp tới</span>`;
    else if (shift.status === 'completed') statusBadge = `<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Hoàn thành</span>`;
    else statusBadge = `<span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Đã hủy</span>`;

    const tr = document.createElement('tr');
    tr.className = "hover:bg-gray-50 transition-colors";
    tr.innerHTML = `
      <td class="px-6 py-4 text-gray-900 font-medium">${dateStr}</td>
      <td class="px-6 py-4 text-gray-600">${shift.shiftName}</td>
      <td class="px-6 py-4 text-gray-600">${shift.employeeId?.fullName || 'Không rõ'}</td>
      <td class="px-6 py-4 text-gray-600">${sDate} - ${eDate}</td>
      <td class="px-6 py-4">${statusBadge}</td>
      <td class="px-6 py-4 text-right">
        <button onclick='openShiftModal(${JSON.stringify(shift).replace(/'/g, "&#39;")})' class="text-blue-600 hover:text-blue-900 font-medium mr-3">Sửa</button>
        <button onclick="deleteShift('${shift._id}')" class="text-red-600 hover:text-red-900 font-medium">Xóa</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function loadEmployeeOptions() {
  const select = document.getElementById('shift-employee');
  select.innerHTML = '<option value="">-- Chọn nhân viên --</option>';
  allEmployees.forEach(emp => {
    if (emp.isActive) {
      select.innerHTML += `<option value="${emp._id}">${emp.fullName} (${emp.username})</option>`;
    }
  });
}

// --- Data Fetching & Rendering: Attendance & Settings ---
async function loadAttendances() {
  try {
    const res = await fetch(`${API_URL}/attendance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      renderAttendances(data.data);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderAttendances(list) {
  const tbody = document.getElementById('attendance-tbody');
  tbody.innerHTML = '';
  list.forEach(att => {
    const dateStr = att.date
      ? att.date.split('-').reverse().join('/')
      : (att.shiftId ? new Date(att.shiftId.date).toLocaleDateString('vi-VN') : '--');
    const sTime = att.shiftId ? new Date(att.shiftId.startTime).toTimeString().substring(0, 5) : '';
    const eTime = att.shiftId ? new Date(att.shiftId.endTime).toTimeString().substring(0, 5) : '';

    const checkIn = att.checkInTime ? new Date(att.checkInTime).toLocaleString('vi-VN') : '--';
    const checkOut = att.checkOutTime ? new Date(att.checkOutTime).toLocaleString('vi-VN') : '--';

    let statusBadge = '';
    if (att.status === 'present') statusBadge = `<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Đúng giờ</span>`;
    else if (att.status === 'late') statusBadge = `<span class="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Đi trễ</span>`;
    else if (att.status === 'early_leave') statusBadge = `<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Về sớm</span>`;
    else if (att.status === 'late_early_leave') statusBadge = `<span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Trễ & Về sớm</span>`;
    else statusBadge = `<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">${att.status}</span>`;

    const tr = document.createElement('tr');
    tr.className = "hover:bg-gray-50 transition-colors";
    tr.innerHTML = `
      <td class="px-6 py-4">
        <div class="font-medium text-gray-900">${att.employeeId?.fullName || 'N/A'}</div>
        <div class="text-xs text-gray-500">${att.employeeId?.username || ''}</div>
      </td>
      <td class="px-6 py-4 text-gray-600">${dateStr}</td>
      <td class="px-6 py-4">
        <div class="text-gray-900">${att.shiftId?.shiftName || 'Tự do'}</div>
        ${sTime && eTime ? `<div class="text-xs text-gray-500">${sTime} - ${eTime}</div>` : ''}
      </td>
      <td class="px-6 py-4 text-gray-600">${checkIn}</td>
      <td class="px-6 py-4 text-gray-600">${checkOut}</td>
      <td class="px-6 py-4">${statusBadge}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- WorkLog Functions ---
async function loadWorkLogs(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/worklog${query ? '?' + query : ''}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) renderWorkLogs(data.data);
  } catch (err) {
    console.error(err);
  }
}

function applyWorklogFilter() {
  const date = document.getElementById('wl-filter-date')?.value || '';
  const employeeId = document.getElementById('wl-filter-employee')?.value || '';
  const params = {};
  if (date) params.date = date;
  if (employeeId) params.employeeId = employeeId;
  loadWorkLogs(params);
}

async function loadWorklogEmployeeFilter() {
  const select = document.getElementById('wl-filter-employee');
  if (!select) return;
  select.innerHTML = '<option value="">-- Tất cả nhân viên --</option>';
  allEmployees.forEach(emp => {
    select.innerHTML += `<option value="${emp._id}">${emp.fullName} (${emp.username})</option>`;
  });
}

function renderWorkLogs(logs) {
  const tbody = document.getElementById('worklog-tbody');
  tbody.innerHTML = '';
  if (!logs || logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">Chưa có nhật ký đầu việc nào</td></tr>';
    return;
  }
  logs.forEach(log => {
    const dateParts = log.date ? log.date.split('-') : [];
    const dateDisplay = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : log.date;
    const tasksList = log.tasks.map(t =>
      `<li class="text-sm text-gray-700">• ${t.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</li>`
    ).join('');

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition-colors';
    tr.innerHTML = `
      <td class="px-6 py-4">
        <div class="font-medium text-gray-900">${log.employeeId?.fullName || 'N/A'}</div>
        <div class="text-xs text-gray-500">${log.employeeId?.username || ''}</div>
      </td>
      <td class="px-6 py-4 text-gray-600 whitespace-nowrap">${dateDisplay}</td>
      <td class="px-6 py-4">
        <ul class="space-y-1">${tasksList || '<span class="text-gray-400 text-sm">Không có đầu việc</span>'}</ul>
      </td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">${log.tasks.length} mục</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function exportExcel() {
  window.open(`${API_URL}/attendance/export?token=${token}`, '_blank');
}

async function loadSettings() {
  try {
    const res = await fetch(`${API_URL}/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok && data.data) {
      const cfg = data.data;
      document.getElementById('cfg-max-early').value = cfg.maxEarlyCheckInMins || 10;
      document.getElementById('cfg-location-enabled').checked = cfg.isLocationCheckEnabled || false;
      document.getElementById('cfg-lat').value = cfg.location?.lat || 10.0452;
      document.getElementById('cfg-lng').value = cfg.location?.lng || 105.7469;
      document.getElementById('cfg-radius').value = cfg.location?.radius || 100;
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleSettingsSubmit(e) {
  e.preventDefault();
  const payload = {
    maxEarlyCheckInMins: parseInt(document.getElementById('cfg-max-early').value),
    isLocationCheckEnabled: document.getElementById('cfg-location-enabled').checked,
    location: {
      lat: parseFloat(document.getElementById('cfg-lat').value),
      lng: parseFloat(document.getElementById('cfg-lng').value),
      radius: parseInt(document.getElementById('cfg-radius').value)
    }
  };

  try {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Lỗi hệ thống');
  }
}

// --- Form Handlers ---
async function handleEmployeeSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('emp-id').value;
  const payload = {
    fullName: document.getElementById('emp-fullname').value,
    role: document.getElementById('emp-role').value,
    phone: document.getElementById('emp-phone').value,
    isActive: document.getElementById('emp-active').checked
  };

  const password = document.getElementById('emp-password').value;
  if (password) payload.password = password;

  let url = `${API_URL}/employees`;
  let method = 'POST';

  if (id) {
    url += `/${id}`;
    method = 'PUT';
  } else {
    payload.username = document.getElementById('emp-username').value;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      closeModals();
      loadEmployees();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Lỗi hệ thống');
  }
}

async function deleteEmployee(id) {
  if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
  try {
    const res = await fetch(`${API_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      loadEmployees();
    }
  } catch (err) {
    alert('Lỗi hệ thống');
  }
}

async function handleShiftSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('shift-id').value;
  const dateStr = document.getElementById('shift-date').value;
  const startTimeStr = document.getElementById('shift-start').value;
  const endTimeStr = document.getElementById('shift-end').value;

  // Create Date objects
  const date = new Date(dateStr);
  const startTime = new Date(`${dateStr}T${startTimeStr}`);
  const endTime = new Date(`${dateStr}T${endTimeStr}`);

  const payload = {
    shiftName: document.getElementById('shift-name').value,
    employeeId: document.getElementById('shift-employee').value,
    date,
    startTime,
    endTime
  };

  let url = `${API_URL}/shifts`;
  let method = 'POST';

  if (id) {
    url += `/${id}`;
    method = 'PUT';
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      closeModals();
      loadShifts();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Lỗi hệ thống');
  }
}

async function deleteShift(id) {
  if (!confirm('Bạn có chắc muốn xóa ca làm việc này?')) return;
  try {
    const res = await fetch(`${API_URL}/shifts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      loadShifts();
    }
  } catch (err) {
    alert('Lỗi hệ thống');
  }
}

// --- Worklog Filter Tab ---
let cachedEmployeesList = [];

async function initWorklogTab() {
  await loadWorklogEmployeeFilter();
  const select = document.getElementById('wl-filter-employee');
  if (select && select.value) {
    onWorklogEmployeeChange();
  } else {
    const placeholder = document.getElementById('worklog-placeholder');
    const details = document.getElementById('worklog-details');
    if (placeholder) placeholder.classList.remove('hidden');
    if (details) details.classList.add('hidden');
  }
}

async function loadWorklogEmployeeFilter() {
  const select = document.getElementById('wl-filter-employee');
  if (!select) return;
  try {
    const res = await fetch(`${API_URL}/employees`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok && data.data) {
      cachedEmployeesList = data.data;
      const currentVal = select.value;
      select.innerHTML = '<option value="">-- Chọn nhân viên để xem nhật ký --</option>' +
        data.data.map(emp => `<option value="${emp._id}">${emp.fullName} (@${emp.username})</option>`).join('');
      if (currentVal) select.value = currentVal;
    }
  } catch (err) {
    console.error('Lỗi tải danh sách nhân viên lọc nhật ký:', err);
  }
}

async function onWorklogEmployeeChange() {
  const empId = document.getElementById('wl-filter-employee').value;
  const date = document.getElementById('wl-filter-date').value;

  if (!empId) {
    document.getElementById('worklog-placeholder').classList.remove('hidden');
    document.getElementById('worklog-details').classList.add('hidden');
    return;
  }

  const emp = cachedEmployeesList.find(e => e._id === empId);
  if (emp) {
    document.getElementById('wl-emp-name').textContent = emp.fullName;
    document.getElementById('wl-emp-username').textContent = `@${emp.username} · ${emp.role === 'admin' ? 'Quản trị viên' : 'Nhân viên / Thực tập sinh'}`;
    document.getElementById('wl-emp-avatar').textContent = (emp.fullName || 'NV').slice(0, 2).toUpperCase();
  }

  document.getElementById('worklog-placeholder').classList.add('hidden');
  document.getElementById('worklog-details').classList.remove('hidden');

  let url = `${API_URL}/worklog?employeeId=${empId}`;
  if (date) url += `&date=${date}`;

  try {
    const tbody = document.getElementById('worklog-tbody');
    tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-6 text-center text-gray-400">Đang tải dữ liệu nhật ký...</td></tr>';

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const logs = data.data || [];

    let totalTasks = 0;
    logs.forEach(l => { totalTasks += (l.tasks?.length || 0); });

    document.getElementById('wl-emp-days-count').textContent = `${logs.length} ngày làm việc`;
    document.getElementById('wl-emp-tasks-count').textContent = `${totalTasks} đầu việc đã ghi`;

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-gray-500">
        <p class="font-medium text-gray-600 mb-1">Không tìm thấy nhật ký công việc nào</p>
        <p class="text-xs text-gray-400">${date ? 'Nhân viên này không có đầu việc nào trong ngày ' + date : 'Nhân viên này chưa ghi nhận đầu việc nào'}</p>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(log => {
      const tasks = log.tasks || [];
      const tasksHtml = tasks.length === 0
        ? '<span class="text-xs text-gray-400 italic">Không có đầu việc</span>'
        : `<ul class="space-y-1.5">${tasks.map(t => `<li class="flex items-start gap-2 text-sm text-gray-800"><span class="text-emerald-500 font-bold mt-0.5">•</span><span>${escapeHtml(t.content)}</span></li>`).join('')}</ul>`;

      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4 font-semibold text-gray-700 text-sm whitespace-nowrap">
            📅 ${formatDateVN(log.date)}
          </td>
          <td class="px-6 py-4">
            ${tasksHtml}
          </td>
          <td class="px-6 py-4 text-center">
            <span class="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">${tasks.length}</span>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Lỗi tải nhật ký:', err);
    document.getElementById('worklog-tbody').innerHTML = '<tr><td colspan="3" class="px-6 py-6 text-center text-red-500">Lỗi khi tải nhật ký công việc</td></tr>';
  }
}

function onWorklogDateChange() {
  const empId = document.getElementById('wl-filter-employee').value;
  if (empId) {
    onWorklogEmployeeChange();
  }
}

function resetWorklogFilter() {
  document.getElementById('wl-filter-employee').value = '';
  document.getElementById('wl-filter-date').value = '';
  document.getElementById('worklog-placeholder').classList.remove('hidden');
  document.getElementById('worklog-details').classList.add('hidden');
}

function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function escapeHtml(t) {
  return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
