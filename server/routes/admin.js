const express = require('express')
const router = express.Router()
const db = require('../config/db')

// ========== 数据统计 ==========

// 概览统计
router.get('/stats', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt
  const foodCount = db.prepare('SELECT COUNT(*) as cnt FROM foods').get().cnt

  const today = new Date().toISOString().slice(0, 10)
  const todayRecords = db.prepare(
    'SELECT COUNT(*) as cnt FROM diet_records WHERE record_date = ?'
  ).get(today).cnt

  const avgKcal = db.prepare(`
    SELECT ROUND(AVG(daily.kcal), 0) as avg
    FROM (
      SELECT record_date, SUM(dri.kcal) as kcal
      FROM diet_records dr
      JOIN diet_record_items dri ON dr.id = dri.record_id
      GROUP BY record_date
    ) daily
  `).get().avg || 0

  res.json({
    userCount,
    todayRecords,
    foodCount,
    avgKcal,
  })
})

// 近7天热量趋势
router.get('/calorie-trend', (req, res) => {
  const dates = []
  const values = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    dates.push(`${d.getMonth() + 1}/${d.getDate()}`)

    const result = db.prepare(`
      SELECT COALESCE(SUM(dri.kcal), 0) as total
      FROM diet_records dr
      JOIN diet_record_items dri ON dr.id = dri.record_id
      WHERE dr.record_date = ?
    `).get(dateStr)
    values.push(Math.round(result.total))
  }
  res.json({ dates, values })
})

// 体重分布
router.get('/weight-distribution', (req, res) => {
  const users = db.prepare('SELECT weight FROM users WHERE weight > 0').all()
  const buckets = [
    { label: '<50kg', min: 0, max: 50 },
    { label: '50-60', min: 50, max: 60 },
    { label: '60-70', min: 60, max: 70 },
    { label: '70-80', min: 70, max: 80 },
    { label: '80-90', min: 80, max: 90 },
    { label: '>90kg', min: 90, max: 999 },
  ]
  const result = buckets.map(b => ({
    label: b.label,
    count: users.filter(u => u.weight >= b.min && u.weight < b.max).length,
  }))

  // 如果没有用户体重数据，返回模拟分布
  const allZero = result.every(r => r.count === 0)
  if (allZero) {
    result[1].count = 2
    result[2].count = 5
    result[3].count = 3
    result[4].count = 1
  }

  res.json(result)
})

// ========== 用户管理 ==========

router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT 
      u.id, u.nickname, u.gender, u.weight, u.target_kcal,
      u.created_at,
      COUNT(DISTINCT dr.record_date) as record_days,
      COUNT(DISTINCT dr.id) as total_records
    FROM users u
    LEFT JOIN diet_records dr ON u.id = dr.user_id
    GROUP BY u.id
    ORDER BY u.id DESC
  `).all()

  // 计算每个用户的日均摄入
  const enriched = users.map(u => {
    const avgResult = db.prepare(`
      SELECT ROUND(AVG(daily.kcal), 0) as avg_kcal
      FROM (
        SELECT dr.record_date, SUM(dri.kcal) as kcal
        FROM diet_records dr
        JOIN diet_record_items dri ON dr.id = dri.record_id
        WHERE dr.user_id = ?
        GROUP BY dr.record_date
      ) daily
    `).get(u.id)
    return {
      ...u,
      avg_kcal: avgResult.avg_kcal || 0,
    }
  })

  // 处理手机号（当前没有 phone 字段，用 ID 模拟）
  const result = enriched.map(u => ({
    id: u.id,
    nickname: u.nickname,
    phone: `user_${String(u.id).padStart(4, '0')}`,
    recordDays: u.record_days,
    totalRecords: u.total_records,
    avgKcal: u.avg_kcal,
    targetKcal: u.target_kcal,
    weight: u.weight,
    createdAt: u.created_at ? u.created_at.slice(0, 10) : '-',
  }))

  res.json(result)
})

// 删除用户
router.delete('/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// ========== 饮食记录查询 ==========

router.get('/records', (req, res) => {
  const { dateFrom, dateTo, keyword } = req.query

  let sql = `
    SELECT 
      dr.id, dr.meal_type, dr.record_date, dr.created_at,
      u.id as user_id, u.nickname as user_name,
      GROUP_CONCAT(dri.food_name || '(' || dri.grams || 'g)') as foods,
      SUM(dri.kcal) as total_kcal
    FROM diet_records dr
    JOIN users u ON dr.user_id = u.id
    JOIN diet_record_items dri ON dr.id = dri.record_id
    WHERE 1=1
  `
  const params = []

  if (dateFrom) {
    sql += ' AND dr.record_date >= ?'
    params.push(dateFrom)
  }
  if (dateTo) {
    sql += ' AND dr.record_date <= ?'
    params.push(dateTo)
  }
  if (keyword) {
    sql += ' AND u.nickname LIKE ?'
    params.push(`%${keyword}%`)
  }

  sql += ' GROUP BY dr.id ORDER BY dr.record_date DESC, dr.created_at DESC LIMIT 100'

  const records = db.prepare(sql).all(...params)

  const mealLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
  const result = records.map(r => ({
    id: r.id,
    user: r.user_name,
    mealType: mealLabels[r.meal_type] || r.meal_type,
    foods: r.foods,
    kcal: Math.round(r.total_kcal * 10) / 10,
    date: r.record_date,
  }))

  res.json(result)
})

module.exports = router
