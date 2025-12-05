<template>
  <el-form :model="form" label-width="120px" :rules="rules" ref="formRef">
    <el-form-item label="岗位名称" prop="name">
      <el-input v-model="form.name" :disabled="isEdit" />
    </el-form-item>

    <el-form-item label="工作城市" prop="city">
      <el-cascader
        v-model="form.cityPath"
        :options="cityOptions"
        :props="{ checkStrictly: true }"
        placeholder="请选择省/市"
      />
    </el-form-item> 

    <el-form-item label="具体地点" prop="location">
      <el-input v-model="form.location" placeholder="如：西湖区XX大厦15层" />
    </el-form-item>

    <el-form-item label="工期时间" prop="duration">
      <el-input
        v-model="form.duration"
        placeholder="如：3个月、1年"
        :disabled="!canEditPosition"
      />
    </el-form-item>

    <!-- 其他字段... -->

    <el-form-item v-if="showBudget" label="项目预算">
      <el-input v-model="form.budget" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submit">提交</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
import { cityOptions } from '@/utils/helpers' // 假设有城市数据
import type { PositionForm } from '@/types/position'

const props = defineProps<{
  modelValue?: PositionForm
  isEdit?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'submit'])

const { isSuperAdmin, isManager } = usePermission()
const showBudget = computed(() => isSuperAdmin() || isManager())

const form = ref<PositionForm>({
  name: '',
  cityPath: [],
  location: '',
  duration: '',
  budget: '',
  // ...
})

// 同步外部传入值
watch(
  () => props.modelValue,
  (val) => {
    if (val) form.value = { ...val }
  },
  { immediate: true }
)

const rules = {
  name: [{ required: true, message: '请输入岗位名称' }],
  duration: [{ required: true, message: '请输入工期' }],
}

const submit = () => {
  emit('submit', form.value)
}
</script>