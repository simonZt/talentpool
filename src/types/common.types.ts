// src/types/common.types.ts

/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

/**
 * 分页查询参数
 */
export interface PaginationQuery {
  page?: number;      // 默认 1
  limit?: number;     // 默认 10
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}