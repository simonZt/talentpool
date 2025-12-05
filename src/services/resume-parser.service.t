// src/services/resume-parser.service.ts
export class ResumeParser {
  static parse(text: string) {
    const result: any = {};

    // 示例：提取姓名
    const nameMatch = text.match(/姓名[:：]\s*([\u4e00-\u9fa5a-zA-Z]+)/);
    if (nameMatch) result.candidateName = nameMatch[1];

    // 示例：提取电话
    const phoneMatch = text.match(/(?:电话|手机|联系方式)[:：]?\s*(1[3-9]\d{9})/);
    if (phoneMatch) result.phone = phoneMatch[1];

    // 可扩展更多字段...
    return result;
  }
}