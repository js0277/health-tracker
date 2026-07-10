# 轻食记 — 健康饮食记录应用

> Vue 3 全栈项目 | 毕业设计 | 饮食记录 & 体重管理

## 在线体验

> 🎯 **需要试用？** 这是一个全栈应用（前端 + 后端 + 数据库）
> http://118.126.95.203

- 用户端：手机 H5 页面，注册登录后记录饮食/体重
- 管理后台：PC 端，食物库管理、用户管理、数据看板

---

## 项目介绍

轻食记是一款面向普通用户的健康饮食记录应用，功能对标"薄荷健康"核心体验。用户可以记录每日饮食、追踪体重变化，并获得热量与营养摄入的直观反馈。

### 核心功能

| 模块 | 功能 |
| --- | --- |
| 🔐 用户系统 | 注册 / 登录 / JWT 鉴权，数据完全隔离 |
| 🍽️ 饮食记录 | 按早餐/午餐/晚餐/加餐分类添加食物，支持搜索与推荐 |
| 🔥 热量环 | SVG 实时渲染热量摄入进度，直观展示三大营养素 |
| ⚖️ 体重追踪 | 记录每日体重，折线图展示变化趋势 |
| 📊 管理后台 | 食物库 CRUD、用户管理、数据看板（ECharts） |
| ❌ 删除功能 | 单条食物可删除，空餐次自动清理 |

---

## 技术栈

| 层 | 技术 |
| --- | --- |
| 用户端 | Vue 3 + Vite + Vue Router + Pinia |
| 管理后台 | Vue 3 + Element Plus + ECharts |
| 后端 | Node.js + Express |
| 数据库 | SQLite（better-sqlite3） |
| 认证 | JWT（jsonwebtoken + bcryptjs） |
| 部署 | Cloudflare Tunnel（公网访问） |

---

## 项目结构

```
health-tracker/
├── client/           # 用户端（Vue 3 移动端风格）
│   └── src/
│       ├── views/    # Home / Weight / Mine / Login / Register
│       ├── components/  # CalorieRing / MealCard / FoodSearch
│       ├── api/      # API 封装（自动携带 Token）
│       ├── store.js  # 全局状态管理
│       └── router/   # 路由 + 登录守卫
├── admin/            # 管理后台（Vue 3 + Element Plus）
│   └── src/views/    # Dashboard / FoodManage / UserManage / DietRecords
├── server/           # Express 后端
│   ├── routes/       # auth / diets / foods / weights / admin
│   ├── middleware/   # JWT 认证中间件
│   ├── config/       # 数据库连接
│   └── data/         # SQLite 数据库文件
└── deploy/           # 部署打包目录
```

---

## 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/js0277/health-tracker.git
cd health-tracker

# 2. 安装依赖
cd server && npm install
cd ../client && npm install
cd ../admin && npm install

# 3. 启动后端（端口 3456）
cd ../server
npm start

# 4. 启动前端（开发模式）
# 用户端 — http://localhost:5175
cd ../client && npm run dev
# 管理后台 — http://localhost:5174
cd ../admin && npm run dev
```

---

## API 接口

| 方法 | 路径 | 说明 | 认证 |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | 注册 | × |
| POST | `/api/auth/login` | 登录 | × |
| GET | `/api/auth/me` | 获取用户信息 | ✓ |
| GET | `/api/diets/today` | 今日饮食记录 | ✓ |
| POST | `/api/diets` | 添加饮食记录 | ✓ |
| DELETE | `/api/diets/items/:id` | 删除单条食物 | ✓ |
| GET | `/api/weights` | 体重记录列表 | ✓ |
| POST | `/api/weights` | 添加体重记录 | ✓ |
| GET | `/api/admin/stats` | 管理后台统计数据 | × |

---

## 作者

计算机科学与技术 2027 届毕业设计作品
