const express = require('express')
const router = express.Router()
const db = require('../config/db')

// 食物列表（管理后台用，支持分页+搜索+分类）
router.get('/', (req, res) => {
  const { keyword, category, page = 1, pageSize = 15 } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)

  let where = 'WHERE 1=1'
  const params = []

  if (keyword) {
    where += ' AND name LIKE ?'
    params.push(`%${keyword}%`)
  }
  if (category) {
    where += ' AND category = ?'
    params.push(category)
  }

  const count = db.prepare(`SELECT COUNT(*) as cnt FROM foods ${where}`).get(...params).cnt
  const list = db.prepare(
    `SELECT * FROM foods ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset)

  res.json({ list, total: count })
})

// 搜索食物
router.get('/search', (req, res) => {
  const { keyword } = req.query
  if (!keyword) return res.json([])

  const foods = db.prepare(
    'SELECT * FROM foods WHERE name LIKE ? LIMIT 20'
  ).all(`%${keyword}%`)
  res.json(foods)
})

// 常用食物
router.get('/common', (req, res) => {
  const foods = db.prepare(
    'SELECT * FROM foods WHERE is_common = 1 LIMIT 30'
  ).all()
  res.json(foods)
})

// 食物详情
router.get('/:id', (req, res) => {
  const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id)
  if (!food) return res.status(404).json({ message: '食物不存在' })
  res.json(food)
})

// 添加食物（管理后台用）
router.post('/', (req, res) => {
  const { name, category, kcal, protein, fat, carbs, is_common } = req.body
  const result = db.prepare(
    'INSERT INTO foods (name, category, kcal, protein, fat, carbs, is_common) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name, category || '', kcal, protein, fat, carbs, is_common || 0)
  res.json({ id: result.lastInsertRowid })
})

// 更新食物
router.put('/:id', (req, res) => {
  const { name, category, kcal, protein, fat, carbs, is_common } = req.body
  db.prepare(
    'UPDATE foods SET name=?, category=?, kcal=?, protein=?, fat=?, carbs=?, is_common=? WHERE id=?'
  ).run(name, category, kcal, protein, fat, carbs, is_common || 0, req.params.id)
  res.json({ success: true })
})

// 删除食物
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM foods WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

module.exports = router
