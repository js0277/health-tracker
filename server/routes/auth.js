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
    'SELECT id, username, nickname, avatar, gender, height, weight, target_kcal, target_weight, target_date FROM users WHERE id = ?'
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
  if (req.body.target_date !== undefined) { fields.push('target_date=?'); values.push(req.body.target_date) }
  if (req.body.target_weight !== undefined) { fields.push('target_weight=?'); values.push(req.body.target_weight) }

  if (fields.length === 0) {
    return res.status(400).json({ message: '没有需要更新的字段' })
  }

  fields.push("updated_at=datetime('now','localtime')")
  values.push(req.user.id)

  db.prepare(`UPDATE users SET ${fields.join(',')} WHERE id=?`).run(...values)

  res.json({ success: true })
})

// 设置体重目标 - 自动计算每日热量
router.post('/goal', authenticate, (req, res) => {
  const { current_weight, target_weight, target_date } = req.body

  if (!current_weight || !target_weight || !target_date) {
    return res.status(400).json({ message: '请填写完整信息' })
  }
  if (current_weight <= 0 || target_weight <= 0) {
    return res.status(400).json({ message: '体重必须大于0' })
  }

  // 计算天数
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(target_date)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.max(1, Math.ceil((target - now) / (1000 * 60 * 60 * 24)))

  // 体重差值（正=增重，负=减重）
  const weightDiff = target_weight - current_weight
  const totalKcal = Math.abs(weightDiff) * 7700 // 1kg脂肪≈7700千卡

  // 基础代谢估算：体重(kg) × 24（粗略基础代谢率）
  // 日常消耗 ≈ BMR × 1.375（轻度活动）
  const tdee = Math.round(current_weight * 24 * 1.375)

  // 每日调整量
  const dailyAdjust = Math.round(totalKcal / diffDays)

  let targetKcal
  if (weightDiff < 0) {
    // 减重：TDEE - 每日缺口
    targetKcal = tdee - dailyAdjust
  } else if (weightDiff > 0) {
    // 增重：TDEE + 每日盈余
    targetKcal = tdee + dailyAdjust
  } else {
    // 维持体重
    targetKcal = tdee
  }

  // 安全下限：不低于1200千卡/天，上限不超5000
  targetKcal = Math.max(1200, Math.min(5000, targetKcal))

  // 保存到用户记录
  db.prepare(`
    UPDATE users SET weight=?, target_weight=?, target_date=?, target_kcal=?, updated_at=datetime('now','localtime')
    WHERE id=?
  `).run(current_weight, target_weight, target_date, targetKcal, req.user.id)

  // 同步写入一条体重记录
  const todayStr = new Date().toISOString().slice(0, 10)
  const existing = db.prepare(
    'SELECT id FROM weight_records WHERE user_id=? AND record_date=?'
  ).get(req.user.id, todayStr)
  if (!existing) {
    db.prepare(`
      INSERT INTO weight_records (user_id, weight, record_date, record_time, note)
      VALUES (?, ?, ?, '08:00', '目标设置初始记录')
    `).run(req.user.id, current_weight, todayStr)
  }

  res.json({
    target_kcal: targetKcal,
    tdee,
    daily_adjust: dailyAdjust,
    diff_days: diffDays,
    weight_diff: Math.round(weightDiff * 10) / 10,
    mode: weightDiff < 0 ? 'lose' : weightDiff > 0 ? 'gain' : 'maintain',
  })
})

module.exports = router
