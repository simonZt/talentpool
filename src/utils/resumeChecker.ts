// src/utils/resumeChecker.ts

// 模拟 API 调用：检查是否存在相同 (name + phone)
export const checkDuplicateResume = async (
  name: string,
  phone: string
): Promise<{ exists: boolean; resumeId?: string }> => {
  // 实际应调用 GET /api/resumes/check-duplicate?name=xxx&phone=xxx
  // 此处为示例
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟查重结果
      resolve({ exists: false })
    }, 300)
  })
}