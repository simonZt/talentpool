<template>
  <div class="resume-detail">
    <el-page-header @back="$router.back()" :content="resume.name + ' 的简历'" />

    <el-card class="info-card">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="姓名">{{ resume.name }}</el-descriptions-item>
        <el-descriptions-item label="电话">
          <el-input
            v-model="editableFields.phone"
            size="small"
            @blur="saveField('phone', editableFields.phone)"
          />
        </el-descriptions-item>
        <el-descriptions-item label="学历">
          <el-input
            v-model="editableFields.education"
            size="small"
            @blur="saveField('education', editableFields.education)"
          />
        </el-descriptions-item>
        <el-descriptions-item label="工作年限">
          <el-input
            v-model="editableFields.workYears"
            size="small"
            @blur="saveField('workYears', editableFields.workYears)"
          />
        </el-descriptions-item>
        <el-descriptions-item label="简历来源">
          <el-select
            v-model="editableFields.source"
            size="small"
            @change="(val) => saveField('source', val)"
            placeholder="请选择"
          >
            <el-option label="BOSS直聘" value="BOSS直聘" />
            <el-option label="智联招聘" value="智联招聘" />
            <el-option label="内部推荐" value="内部推荐" />
          </el-select>
        </el-descriptions-item>
        <el-descriptions-item label="推荐岗位">
          <el-select
            v-model="editableFields.recommendedPositionId"
            size="small"
            @change="(val) => saveField('recommendedPositionId', val)"
            placeholder="请选择招募中岗位"
            filterable
          >
            <el-option
              v-for="pos in recruitingPositions"
              :key="pos.id"
              :label="`${pos.name} - ${pos.city}`"
              :value="pos.id"
            />
          </el-select>
        </el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 16px">
        <el-button type="primary" @click="previewResume(resume.resumeUrl)">
          预览原始简历
        </el-button>
      </div>
    </el-card>

    <!-- 回访记录 -->
    <el-card class="section-card" style="margin-top: 16px">
      <template #header>
        <div class="card-header">
          <span>回访记录</span>
          <el-button class="button" type="primary" size="small" @click="addFollowUp">
            添加回访
          </el-button>
        </div>
      </template>
      <div v-if="resume.followUps.length === 0">暂无回访记录</div>
      <el-timeline v-else>
        <el-timeline-item
          v-for="item in resume.followUps"
          :key="item.id"
          :timestamp="formatDate(item.followUpTime)"
          placement="top"
        >
          <el-card>
            <p><strong>{{ item.operator }}</strong></p>
            <p>{{ item.content }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 编辑留痕 -->
    <el-card class="section-card" style="margin-top: 16px">
      <template #header>编辑历史</template>
      <el-table :data="resume.editHistories" style="width: 100%">
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="operateTime" label="操作时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.operateTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="field" label="字段" width="100" />
        <el-table-column prop="oldValue" label="原值" />
        <el-table-column prop="newValue" label="新值" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import { getResumeById, updateResumeField, addFollowUp } from '@/api/resume'
import type { ResumeDetail } from '@/types/resume'
import { formatDate } from '@/utils/helpers'
import { getPositionList } from '@/api/position'
import type { PositionItem } from '@/types/position'

const route = useRoute()
const resume = ref<ResumeDetail>({
  id: '',
  name: '',
  phone: '',
  education: '',
  workYears: '',
  source: '',
  recommendedPositionId: '',
  recommendedPositionName: '',
  hrName: '',
  uploadTime: '',
  resumeUrl: '',
  editHistories: [],
  followUps: [],
})

const recruitingPositions = ref<PositionItem[]>([])

// 可编辑字段（用于双向绑定）
const editableFields = reactive({
  phone: '',
  education: '',
  workYears: '',
  source: '',
  recommendedPositionId: '',
})

onMounted(async () => {
  const id = route.params.id as string
  const data = await getResumeById(id)
  resume.value = data

  // 同步可编辑字段
  Object.assign(editableFields, {
    phone: data.phone,
    education: data.education,
    workYears: data.workYears,
    source: data.source,
    recommendedPositionId: data.recommendedPositionId,
  })

  // 获取招募中岗位（用于下拉）
  const allPositions = await getPositionList()
  recruitingPositions.value = allPositions.filter(p => p.status === '招募中')
})

const saveField = async (field: string, value: string) => {
  try {
    await updateResumeField(resume.value.id, field, value)
    ElMessage.success('保存成功')
    // 更新本地数据（简化，实际可重新拉取或局部更新）
    if (field === 'recommendedPositionId') {
      const pos = recruitingPositions.value.find(p => p.id === value)
      resume.value.recommendedPositionName = pos?.name || ''
    } else {
      ;(resume.value as any)[field] = value
    }
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

const previewResume = (url: string) => {
  window.open(url, '_blank')
}

const addFollowUp = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入回访内容', '添加回访', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
    await addFollowUp(resume.value.id, value)
    ElMessage.success('添加成功')
    // 刷新详情（简化：重新加载）
    onMounted()
  } catch (err) {}
}
</script>

<style scoped>
.info-card {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-card :deep(.el-card__header) {
  padding: 12px 20px;
}
</style>