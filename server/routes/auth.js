const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const db = require('../config/db')
const { authenticate, generateToken } = require('../middleware/auth')

// 注册
router.post('/register', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' })
  }
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ message: '用户名需要2-20个字符' })
  }
  if (password.length < 6) {
    return res.status(400).json({ message: '密码至少6位' })
  }

  // 检查用户名是否已存在
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return res.status(409).json({ message: '用户名已被注册' })
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const nickname = `用户${Math.floor(Math.random() * 10000)}`

  const result = db.prepare(
    'INSERT INTO users (username, password_hash, nickname) VALUES (?, ?, ?)'
  ).run(username, passwordHash, nickname)

  const user = { id: result.lastInsertRowid, username }
  const token = generateToken(user)

  res.json({
    token,
    user: { id: user.id, username, nickname },
  })
})

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: '请输入用户名和密码' })
  }

  const user = db.prepare(
    'SELECT id, username, password_hash, nickname FROM users WHERE username = ?'
  ).get(username)

  if (!user || !bcrypt.compareSync(password, user.password_hash || '')) {
    return res.status(401).json({ message: '用户名或密码错误' })
  }

  const token = generateToken(user)

  res.json({
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname },
  })
})

// 获取当前用户信息
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, nickname, avatar, gender, height, weight, target_kcal FROM users WHERE id = ?'
  ).get(req.user.id)

  if (!user) {
    return res.status(404).json({ message: '用户不存在' })
  }

  res.json({ user })
})

// 更新用户信息
router.put('/profile', authenticate, (req, res) => {
  const { nickname, height, weight, target_kcal } = req.body
  const fields = []
  const values = []

  if (nickname !== undefined) { fields.push('nickname=?'); values.push(nickname) }
  if (height !== undefined) { fields.push('height=?'); values.push(height) }
  if (weight !== undefined) { fields.push('weight=?'); values.push(weight) }
  if (target_kcal !== undefined) { fields.push('target_kcal=?'); values.push(target_kcal) }

  if (fields.length === 0) {
    return res.status(400).json({ message: '没有需要更新的字段' })
  }

  fields.push("updated_at=datetime('now','localtime')")
  values.push(req.user.id)

  db.prepare(`UPDATE users SET ${fields.join(',')} WHERE id=?`).run(...values)

  res.json({ success: true })
})

module.exports = router
