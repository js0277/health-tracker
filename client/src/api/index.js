const BASE_URL = '/api'

// 获取存储的 token
function getToken() {
  return localStorage.getItem('token')
}

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(BASE_URL + url, { headers, ...options })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '请求失败' }))
    if (res.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.hash = '/login'
    }
    throw new Error(err.message || '请求失败')
  }
  return res.json()
}

export const authApi = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  setGoal: (data) => request('/auth/goal', { method: 'POST', body: JSON.stringify(data) }),
}

export const foodApi = {
  search: (keyword) => request(`/foods/search?keyword=${encodeURIComponent(keyword)}`),
  common: () => request('/foods/common'),
  getAll: () => request('/foods?page=1&pageSize=999'),
}

export const dietApi = {
  getToday: (date) => {
    const params = date ? `?date=${date}` : ''
    return request(`/diets/today${params}`)
  },
  addRecord: (data) => request('/diets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteRecord: (id) => request(`/diets/${id}`, { method: 'DELETE' }),
  deleteItem: (id) => request(`/diets/items/${id}`, { method: 'DELETE' }),
}

export const weightApi = {
  getList: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/weights?${qs}`)
  },
  add: (data) => request('/weights', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}
