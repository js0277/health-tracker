const express = require('express')
const router = express.Router()
const db = require('../config/db')

// 获取体重记录列表
router.get('/', (req, res) => {
  const userId = req.user.id
  const { days = 30 } = req.query
  const since = new Date()
  since.setDate(since.getDate() - parseInt(days))
  const sinceStr = since.toISOString().slice(0, 10)

  const records = db.prepare(`
    SELECT id, weight, record_date as date, record_time as time, note
    FROM weight_records
    WHERE user_id = ? AND record_date >= ?
    ORDER BY record_date ASC
  `).all(userId, sinceStr)

  res.json(records)
})

// 添加体重记录
router.post('/', (req, res) => {
  const userId = req.user.id
  const { weight, date, time, note } = req.body
  const recordDate = date || new Date().toISOString().slice(0, 10)
  const recordTime = time || '08:00'

  // 同一天已有记录则更新
  const existing = db.prepare(
    'SELECT id FROM weight_records WHERE user_id = ? AND record_date = ?'
  ).get(userId, recordDate)

  if (existing) {
    db.prepare(
      'UPDATE weight_records SET weight=?, record_time=?, note=?, updated_at=datetime("now","localtime") WHERE id=?'
    ).run(weight, recordTime, note || '', existing.id)
    return res.json({ id: existing.id, updated: true })
  }

  const result = db.prepare(
    'INSERT INTO weight_records (user_id, weight, record_date, record_time, note) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, weight, recordDate, recordTime, note || '')

  res.json({ id: result.lastInsertRowid })
})

// 删除体重记录
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM weight_records WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ success: true })
})

module.exports = router
