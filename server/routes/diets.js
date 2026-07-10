const express = require('express')
const router = express.Router()
const db = require('../config/db')

// 获取指定日期记录（默认今天）
router.get('/today', (req, res) => {
  const recordDate = req.query.date || new Date().toISOString().slice(0, 10)
  const userId = req.user.id

  const records = db.prepare(`
    SELECT dr.*, dri.id as item_id, dri.food_id, dri.food_name,
           dri.grams, dri.kcal, dri.protein, dri.fat, dri.carbs
    FROM diet_records dr
    LEFT JOIN diet_record_items dri ON dr.id = dri.record_id
    WHERE dr.user_id = ? AND dr.record_date = ?
  `).all(userId, recordDate)

  // 按 meal_type 分组
  const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] }
  for (const r of records) {
    if (!grouped[r.meal_type]) grouped[r.meal_type] = []
    grouped[r.meal_type].push({
      id: r.item_id,
      food_id: r.food_id,
      food_name: r.food_name,
      grams: r.grams,
      kcal: r.kcal,
      protein: r.protein,
      fat: r.fat,
      carbs: r.carbs,
    })
  }
  res.json(grouped)
})

// 获取指定日期记录
router.get('/date/:date', (req, res) => {
  const userId = req.user.id
  const records = db.prepare(`
    SELECT dr.*, dri.id as item_id, dri.food_name, dri.grams, dri.kcal, dri.protein, dri.fat, dri.carbs
    FROM diet_records dr
    LEFT JOIN diet_record_items dri ON dr.id = dri.record_id
    WHERE dr.user_id = ? AND dr.record_date = ?
  `).all(userId, req.params.date)
  res.json(records)
})

// 添加记录
router.post('/', (req, res) => {
  const userId = req.user.id
  const { meal_type, foods } = req.body

  if (!meal_type || !foods || !foods.length) {
    return res.status(400).json({ message: '参数错误' })
  }

  const recordDate = req.body.record_date || new Date().toISOString().slice(0, 10)

  const insertRecord = db.transaction(() => {
    // 创建饮食记录
    const record = db.prepare(
      'INSERT INTO diet_records (user_id, meal_type, record_date) VALUES (?, ?, ?)'
    ).run(userId, meal_type, recordDate)

    // 添加明细
    const insertItem = db.prepare(
      'INSERT INTO diet_record_items (record_id, food_id, food_name, grams, kcal, protein, fat, carbs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    for (const f of foods) {
      insertItem.run(
        record.lastInsertRowid,
        f.food_id || 0,
        f.name || f.food_name,
        f.grams,
        Math.round(f.kcal * f.grams / 100 * 10) / 10,
        Math.round(f.protein * f.grams / 100 * 10) / 10,
        Math.round(f.fat * f.grams / 100 * 10) / 10,
        Math.round(f.carbs * f.grams / 100 * 10) / 10
      )
    }
    return record.lastInsertRowid
  })

  const recordId = insertRecord()
  res.json({ id: recordId, meal_type, foods })
})

// 删除单条食物明细
router.delete('/items/:id', (req, res) => {
  const item = db.prepare('SELECT record_id FROM diet_record_items WHERE id = ?').get(req.params.id)
  if (!item) return res.status(404).json({ message: '记录不存在' })
  
  db.prepare('DELETE FROM diet_record_items WHERE id = ?').run(req.params.id)
  
  // 如果该餐次没有其他食物了，删除 diet_records 空行
  const remain = db.prepare('SELECT COUNT(*) as c FROM diet_record_items WHERE record_id = ?').get(item.record_id)
  if (remain.c === 0) {
    db.prepare('DELETE FROM diet_records WHERE id = ?').run(item.record_id)
  }
  
  res.json({ success: true })
})

// 删除记录
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM diet_records WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ success: true })
})

module.exports = router
