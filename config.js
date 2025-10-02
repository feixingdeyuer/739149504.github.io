require('dotenv').config();
module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: 'art_festival',
    port: process.env.DB_PORT || 3306
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key', // 生产环境需更换为复杂密钥
    expiresIn: '24h'
  },
  port: process.env.PORT || 3000
};