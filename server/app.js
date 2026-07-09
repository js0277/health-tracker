const express = require('express')
const cors = require('cors')
const path = require('path')
const foodsRouter = require('./routes/foods')
const dietsRouter = require('./routes/diets')
const weightsRouter = require('./routes/weights')
const adminRouter = require('./routes/admin')
const authRouter = require('./routes/auth')
const { authenticate } = require('./middleware/auth')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// 认证路由（无需登录）
app.use('/api/auth', authRouter)

// 需要登录的 API 路由
app.use('/api/foods', authenticate, foodsRouter)
app.use('/api/diets', authenticate, dietsRouter)
app.use('/api/weights', authenticate, weightsRouter)
app.use('/api/admin', adminRouter)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 静态文件服务
const clientDist = path.join(__dirname, '..', 'client', 'dist')
const adminDist = path.join(__dirname, '..', 'admin', 'dist')

app.use('/', express.static(clientDist))
app.use('/admin', express.static(adminDist))

// SPA fallback — client
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    // 管理后台 fallback
    res.sendFile(path.join(adminDist, 'index.html'))
  } else if (!req.path.startsWith('/api')) {
    // 用户端 fallback
    res.sendFile(path.join(clientDist, 'index.html'))
  } else {
    res.status(404).json({ message: 'Not found' })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
  console.log(`   用户端:    http://localhost:${PORT}/`)
  console.log(`   管理后台:  http://localhost:${PORT}/admin/`)
  console.log(`   API:       http://localhost:${PORT}/api/`)
})
