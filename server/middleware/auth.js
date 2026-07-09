const jwt = require('jsonwebtoken')

const JWT_SECRET = 'health_tracker_secret_key_2026'

// 生成 token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// JWT 验证中间件
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '请先登录' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: '登录已过期，请重新登录' })
  }
}

// 可选认证（不强制登录）
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET)
    } catch (e) {
      // ignore invalid token
    }
  }
  next()
}

module.exports = { authenticate, optionalAuth, generateToken, JWT_SECRET }
