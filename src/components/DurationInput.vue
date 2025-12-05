<!-- src/components/DurationInput.vue -->
<template>
  <el-input
    v-model="localValue"
    :placeholder="placeholder"
    @blur="validateAndEmit"
    :class="{ 'is-invalid': !!errorMessage }"
  />
  <div v-if="errorMessage" class="error-tip">{{ errorMessage }}</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const localValue = ref(props.modelValue)
const errorMessage = ref('')

// 校验规则：1-11个月 或 1-N年
const MONTH_PATTERN = /^(1[01]|[1-9])个月$/
const YEAR_PATTERN = /^[1-9]\d*年$/

const isValid = (input: string): boolean => {
  input = input.trim()
  return MONTH_PATTERN.test(input) || YEAR_PATTERN.test(input)
}

const validateAndEmit = () => {
  const val = localValue.value.trim()
  if (val === '') {
    errorMessage.value = ''
    emit('update:modelValue', '')
    return
  }
  if (isValid(val)) {
    errorMessage.value = ''
    emit('update:modelValue', val)
  } else {
    errorMessage.value = '格式示例：1个月、6个月、11个月、1年、2年'
  }
}

// 外部值变化时同步
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})
</script>

<style scoped>
.is-invalid :deep(.el-input__inner) {
  border-color: #f56c6c !important;
}
.error-tip {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
}
</style>