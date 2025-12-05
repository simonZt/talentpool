// src/utils/durationValidator.ts
// 支持："1个月", "11个月", "1年", "2年"
const MONTH_PATTERN = /^(1[01]|[1-9])个月$/
const YEAR_PATTERN = /^[1-9]\d*年$/

export const isValidDuration = (input: string): boolean => {
  input = input.trim()
  return MONTH_PATTERN.test(input) || YEAR_PATTERN.test(input)
}

// 示例：isValidDuration("3个月") → true
//       isValidDuration("13个月") → false（需求未允许）