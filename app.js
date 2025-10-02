const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const config = require('./config');

const app = express();
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体

// 管理员登录接口
app.post('/api/admin/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    // 查询管理员
    const [rows] = await pool.query('SELECT * FROM admins WHERE phone = ?', [phone]);
    if (rows.length === 0) {
      return res.status(401).json({ message: '手机号码或密码不正确' });
    }
    const admin = rows[0];
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '手机号码或密码不正确' });
    }
    // 生成JWT令牌
    const token = jwt.sign(
      { id: admin.id, phone: admin.phone, role: admin.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    res.json({ 
      success: true, 
      data: { 
        token,
        admin: {
          id: admin.id,
          name: admin.admin_name,
          phone: admin.phone,
          role: admin.role
        }
      } 
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '服务器错误，请重试' });
  }
});

// 报名信息提交接口（学生端）
app.post('/api/registrations', async (req, res) => {
  try {
    const { className, name, phone, event, group, description } = req.body;
    // 验证必填字段
    if (!className || !name || !phone || !event || !group) {
      return res.status(400).json({ message: '请填写所有必填字段' });
    }
    // 防止重复报名
    const [existing] = await pool.query(
      'SELECT * FROM registrations WHERE student_name = ? AND phone = ? AND event = ?',
      [name, phone, event]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: '您已报名该项目，无需重复提交' });
    }
    // 插入报名数据
    const [result] = await pool.query(
      'INSERT INTO registrations (class_name, student_name, phone, event, group_type, description) VALUES (?, ?, ?, ?, ?, ?)',
      [className, name, phone, event, group, description || '']
    );
    res.status(201).json({ 
      success: true, 
      message: '报名成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('报名失败:', error);
    res.status(500).json({ message: '服务器错误，报名失败' });
  }
});

// 获取所有报名信息（管理员端，带筛选）
app.get('/api/registrations', authenticateToken, async (req, res) => {
  try {
    const { class: className, event, group, search } = req.query;
    // 构建查询条件
    let query = 'SELECT * FROM registrations WHERE 1=1';
    const params = [];
    
    if (className) {
      query += ' AND class_name = ?';
      params.push(className);
    }
    if (event) {
      query += ' AND event = ?';
      params.push(event);
    }
    if (group) {
      query += ' AND group_type = ?';
      params.push(group);
    }
    if (search) {
      query += ' AND (class_name LIKE ? OR student_name LIKE ? OR phone LIKE ? OR event LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    // 按报名时间倒序
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.query(query, params);
    res.json({ 
      success: true, 
      data: rows 
    });
  } catch (error) {
    console.error('获取报名信息失败:', error);
    res.status(500).json({ message: '服务器错误，无法获取数据' });
  }
});

// JWT认证中间件（保护管理员接口）
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ message: '请先登录' });
  }
  
  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '登录已过期，请重新登录' });
    }
    req.user = user;
    next();
  });
}

// 启动服务
app.listen(config.port, () => {
  console.log(`服务器运行在 http://localhost:${config.port}`);
});