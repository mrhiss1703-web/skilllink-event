// --- Worklog API & Network Service ---
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = isLocal ? 'http://localhost:5000/api' : 'https://vinh-long-marathon.onrender.com/api';

export function getAuthHeaders() {
  const token = localStorage.getItem('skilllink_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function loginEmployee(username, password) {
  const res = await fetch(`${API_URL}/employees/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function fetchTodayAttendanceAPI() {
  const res = await fetch(`${API_URL}/attendance/me/today`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

export async function fetchAttendanceHistoryAPI(month) {
  const res = await fetch(`${API_URL}/attendance/me/history?month=${month}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function fetchWorklogHistoryAPI(month = '') {
  let url = `${API_URL}/worklog/me/history`;
  if (month) url += `?month=${month}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function addTaskAPI(content, date) {
  const res = await fetch(`${API_URL}/worklog/add-task`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, date })
  });
  return res.json();
}

export async function updateTaskAPI(logId, taskId, content) {
  const res = await fetch(`${API_URL}/worklog/task/${logId}/${taskId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content })
  });
  return res.json();
}

export async function deleteTaskAPI(logId, taskId) {
  const res = await fetch(`${API_URL}/worklog/task/${logId}/${taskId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return res.json();
}

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Trình duyệt không hỗ trợ GPS'));
    } else {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error('Không thể lấy vị trí GPS'))
      );
    }
  });
}

export async function checkInAPI(location = {}) {
  const res = await fetch(`${API_URL}/attendance/free-checkin`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(location)
  });
  return res.json();
}

export async function checkOutAPI() {
  const res = await fetch(`${API_URL}/attendance/free-checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({})
  });
  return res.json();
}
