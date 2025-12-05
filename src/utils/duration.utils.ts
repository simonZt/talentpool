// src/utils/duration.utils.ts
/**
 * 校验工期格式是否符合要求
 * 允许: "1个月", "2个月", ..., "11个月", "1年", "2年", "6个月" 等合理表述
 */
export function isValidDuration(duration: string): boolean {
  if (!duration || typeof duration !== 'string') return false;

  // 去除首尾空格
  const trimmed = duration.trim();

  // 支持格式：数字 + (个月|年)
  const monthPattern = /^([1-9]|1[01])个月$/; // 1-11个月
  const yearPattern = /^[1-9]\d*年$/;         // 1年、2年、10年...

  return monthPattern.test(trimmed) || yearPattern.test(trimmed);
}

// 示例：
// isValidDuration("2个月") → true
// isValidDuration("13个月") → false（超过11个月）
// isValidDuration("1年") → true