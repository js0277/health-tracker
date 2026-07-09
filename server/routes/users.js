const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')
const auth = require('../middleware/auth')

const router = express.Router()

// 微信小程序登录
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body
    // TODO: 调用微信 code2Session 获取 openid
    const openid = code // 临时处理
    let [rows] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid])

    if (rows.length === 0) {
      // 新用户，注册
      const [result] = await pool.query(
        'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
        [openid, '新用户', '']
      )
      rows = [{ id: result.insertId, openid, nickname: '新用户', avatar: '' }]
    }

    const user = rows[0]
    const token = jwt.sign(
      { userId: user.id, openid: user.openid },
      process.env.JWT_SECRET || 'health-tracker-secret',
      { expiresIn: '30d' }
    )

    res.json({ code: 0, data: { token, user: { id: user.id, nickname: user.nickname, avatar: user.avatar } } })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// 获取个人资料
router.get('/profile', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, nickname, avatar, gender, height, weight, target_kcal, target_weight, created_at FROM users WHERE id = ?',
      [req.userId]
    )
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    res.json({ code: 0, data: rows[0] })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

// 更新个人资料
router.put('/profile', auth, async (req, res) => {
  try {
    const { nickname, avatar, gender, height, weight, targetKcal, targetWeight } = req.body
    await pool.query(
      `UPDATE users SET nickname=?, avatar=?, gender=?, height=?, weight=?, target_kcal=?, target_weight=?, updated_at=NOW()
       WHERE id=?`,
      [nickname, avatar, gender, height, weight, targetKcal, targetWeight, req.userId]
    )
    res.json({ code: 0, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message })
  }
})

module.exports = router
