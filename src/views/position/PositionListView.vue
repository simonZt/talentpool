<template>
  <div class="position-list">
    <el-page-header @back="$router.go(-1)" content="岗位管理" />

    <div class="toolbar">
      <el-button
        v-if="canEditPosition"
        type="primary"
        @click="handleAdd"
      >
        新增岗位
      </el-button>
    </div>

    <el-table :data="positions" style="width: 100%">
      <el-table-column prop="name" label="岗位名称" />
      <el-table-column prop="city" label="工作城市" />
      <el-table-column prop="location" label="具体地点" />
      <el-table-column prop="duration" label="工期" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === '招募中' ? 'success' : 'info'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button
            v-if="canEditPosition && row.status === '招募中'"
            size="small"
            type="danger"
            @click="handleDown(row)"
          >
            下架
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
import { getPositionList, downPosition } from '@/api/position'
import type { PositionItem } from '@/types/position'

const { canEditPosition } = usePermission()
const positions = ref<PositionItem[]>([])

onMounted(async () => {
  positions.value = await getPositionList()
})

const handleAdd = () => {
  // 跳转到新增表单
}

const handleEdit = (row: PositionItem) => {
  // 跳转到编辑页
}

const handleDown = async (row: PositionItem) => {
  try {
    await ElMessageBox.confirm('确认下架该岗位？', '提示')
    await downPosition(row.id)
    ElMessage.success('下架成功')
    positions.value = await getPositionList()
  } catch (err) {
    // 取消或错误
  }
}
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
  text-align: right;
}
</style>