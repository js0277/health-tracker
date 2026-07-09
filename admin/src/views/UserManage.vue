<template>
  <div>
    <h2 style="margin-bottom:16px;">👥 用户管理</h2>

    <el-card shadow="hover">
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <el-input v-model="keyword" placeholder="搜索用户昵称..." style="width:260px;" clearable @clear="fetchUsers" @keyup.enter="fetchUsers" />
        <el-button type="primary" @click="fetchUsers">搜索</el-button>
      </div>

      <el-table :data="filteredUsers" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="nickname" label="昵称" width="150" />
        <el-table-column prop="phone" label="标识" width="140" />
        <el-table-column prop="recordDays" label="记录天数" width="100" />
        <el-table-column prop="totalRecords" label="总记录数" width="100" />
        <el-table-column prop="avgKcal" label="日均摄入(千卡)" width="130" />
        <el-table-column prop="targetKcal" label="目标热量" width="100" />
        <el-table-column prop="createdAt" label="注册时间" width="140" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)">查看</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 用户详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="'用户详情 - ' + detailUser.nickname" width="500px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID">{{ detailUser.id }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ detailUser.nickname }}</el-descriptions-item>
        <el-descriptions-item label="记录天数">{{ detailUser.recordDays }}</el-descriptions-item>
        <el-descriptions-item label="总记录数">{{ detailUser.totalRecords }}</el-descriptions-item>
        <el-descriptions-item label="日均摄入">{{ detailUser.avgKcal }} 千卡</el-descriptions-item>
        <el-descriptions-item label="目标热量">{{ detailUser.targetKcal }} 千卡</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ detailUser.createdAt }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const keyword = ref('')
const users = ref([])
const loading = ref(false)

// 详情弹窗
const detailVisible = ref(false)
const detailUser = ref({})

const filteredUsers = computed(() => {
  if (!keyword.value) return users.value
  const kw = keyword.value.toLowerCase()
  return users.value.filter(u =>
    u.nickname?.toLowerCase().includes(kw) ||
    String(u.id).includes(kw)
  )
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    users.value = data
  } catch (e) {
    ElMessage.error('加载用户失败')
  } finally {
    loading.value = false
  }
}

const viewDetail = (row) => {
  detailUser.value = row
  detailVisible.value = true
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除用户「${row.nickname}」及其所有记录吗？`, '确认删除', { type: 'warning' })
  try {
    const res = await fetch(`/api/admin/users/${row.id}`, { method: 'DELETE' })
    if (res.ok) {
      ElMessage.success('已删除')
      fetchUsers()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

onMounted(fetchUsers)
</script>
