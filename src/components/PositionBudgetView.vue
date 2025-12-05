<!-- src/components/PositionBudgetView.vue -->
<template>
  <div v-if="canView" class="budget-view">
    <el-form-item label="项目预算（元）">
      <el-input-number
        v-model="localBudget"
        :min="0"
        :step="1000"
        controls-position="right"
        placeholder="请输入预算"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  modelValue?: number
  managerPermissions?: {
    canViewBudget?: boolean
  }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
}>()

const authStore = useAuthStore()
const localBudget = ref(props.modelValue)

// 权限判断：super_admin 或 manager 且有权限
const canView = computed(() => {
  if (authStore.role === 'super_admin') return true
  if (authStore.role === 'manager' && props.managerPermissions?.canViewBudget) return true
  return false
})

// 同步外部值
watch(() => props.modelValue, (newVal) => {
  localBudget.value = newVal
})

// 内部值变化时 emit
watch(localBudget, (newVal) => {
  emit('update:modelValue', newVal)
})
</script>

<style scoped>
.budget-view {
  margin-top: 12px;
}
</style>