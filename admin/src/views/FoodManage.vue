<template>
  <div>
    <h2 style="margin-bottom:16px;">📖 食物库管理</h2>

    <el-card shadow="hover">
      <!-- 搜索栏 -->
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <el-input v-model="keyword" placeholder="搜索食物名称..." style="width:300px;" clearable @clear="fetchFoods" @keyup.enter="fetchFoods" />
        <el-select v-model="category" placeholder="分类筛选" style="width:160px;" clearable @change="fetchFoods">
          <el-option label="主食" value="staple" />
          <el-option label="肉类" value="meat" />
          <el-option label="蔬菜" value="vegetable" />
          <el-option label="水果" value="fruit" />
          <el-option label="饮品" value="drink" />
          <el-option label="零食" value="snack" />
        </el-select>
        <el-button type="primary" @click="fetchFoods">搜索</el-button>
        <el-button type="success" @click="openAdd">添加食物</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="foods" border stripe style="width:100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="catTag(row.category)">{{ catLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="kcal" label="热量(千卡/100g)" width="140" />
        <el-table-column prop="protein" label="蛋白质(g)" width="110" />
        <el-table-column prop="fat" label="脂肪(g)" width="100" />
        <el-table-column prop="carbs" label="碳水(g)" width="100" />
        <el-table-column label="常用" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.is_common ? '#4CAF50' : '#ccc' }">{{ row.is_common ? '✔' : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="total > pageSize"
        style="margin-top:16px;justify-content:flex-end;"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="fetchFoods"
      />
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="食物名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width:100%">
            <el-option label="主食" value="staple" />
            <el-option label="肉类" value="meat" />
            <el-option label="蔬菜" value="vegetable" />
            <el-option label="水果" value="fruit" />
            <el-option label="饮品" value="drink" />
            <el-option label="零食" value="snack" />
          </el-select>
        </el-form-item>
        <el-form-item label="热量(千卡/100g)">
          <el-input-number v-model="form.kcal" :min="0" :precision="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="蛋白质(g/100g)">
          <el-input-number v-model="form.protein" :min="0" :precision="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="脂肪(g/100g)">
          <el-input-number v-model="form.fat" :min="0" :precision="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="碳水(g/100g)">
          <el-input-number v-model="form.carbs" :min="0" :precision="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="设为常用">
          <el-switch v-model="form.is_common" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const keyword = ref('')
const category = ref('')
const foods = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(15)
const total = ref(0)

// 弹窗
const dialogVisible = ref(false)
const dialogTitle = computed(() => editId.value ? '编辑食物' : '添加食物')
const saving = ref(false)
const editId = ref(null)
const form = ref({
  name: '', category: 'meat', kcal: 0, protein: 0, fat: 0, carbs: 0, is_common: false,
})

const catLabel = (c) => {
  const map = { staple: '主食', meat: '肉类', vegetable: '蔬菜', fruit: '水果', drink: '饮品', snack: '零食' }
  return map[c] || c
}

const catTag = (c) => {
  const map = { staple: '', meat: 'danger', vegetable: 'success', fruit: 'warning', drink: 'info', snack: '' }
  return map[c] || ''
}

// 获取食物列表
const fetchFoods = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: currentPage.value, pageSize: pageSize.value })
    if (keyword.value) params.set('keyword', keyword.value)
    if (category.value) params.set('category', category.value)

    const res = await fetch(`/api/foods?${params}`)
    const data = await res.json()
    foods.value = data.list || data
    total.value = data.total || foods.value.length
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 打开添加弹窗
const openAdd = () => {
  editId.value = null
  form.value = { name: '', category: 'meat', kcal: 0, protein: 0, fat: 0, carbs: 0, is_common: false }
  dialogVisible.value = true
}

// 打开编辑弹窗
const openEdit = (row) => {
  editId.value = row.id
  form.value = {
    name: row.name,
    category: row.category,
    kcal: row.kcal,
    protein: row.protein,
    fat: row.fat,
    carbs: row.carbs,
    is_common: !!row.is_common,
  }
  dialogVisible.value = true
}

// 保存
const handleSave = async () => {
  saving.value = true
  try {
    const body = { ...form.value, is_common: form.value.is_common ? 1 : 0 }
    let res
    if (editId.value) {
      res = await fetch(`/api/foods/${editId.value}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
    } else {
      res = await fetch('/api/foods', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
    }
    if (res.ok) {
      ElMessage.success(editId.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      fetchFoods()
    } else {
      ElMessage.error('操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    saving.value = false
  }
}

// 删除
const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '确认删除', { type: 'warning' })
  try {
    const res = await fetch(`/api/foods/${row.id}`, { method: 'DELETE' })
    if (res.ok) {
      ElMessage.success('已删除')
      fetchFoods()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

onMounted(fetchFoods)
</script>
