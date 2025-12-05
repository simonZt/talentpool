// src/utils/helpers.ts
export const formatDate = (isoStr: string): string => {
  const date = new Date(isoStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 示例城市数据（实际应从接口获取）
export const cityOptions = [
  {
    value: 'Zhejiang',
    label: '浙江省',
    children: [{ value: 'Hangzhou', label: '杭州市' }],
  },
  // ...其他省份
]

// src/utils/helpers.ts
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-')
}