// 后端API基础地址（根据实际部署地址修改）
const API_BASE_URL = 'http://你的服务器IP:3000/api';

// 封装请求工具
export const api = {
  // 管理员登录
  adminLogin: async (phone, password) => {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    return response.json();
  },
  
  // 提交报名信息
  submitRegistration: async (data) => {
    const response = await fetch(`${API_BASE_URL}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  // 获取报名信息（管理员）
  getRegistrations: async (params = {}) => {
    // 拼接查询参数
    const queryString = new URLSearchParams(params).toString();
    const token = localStorage.getItem('adminToken');
    
    const response = await fetch(`${API_BASE_URL}/registrations?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
};