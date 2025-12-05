// src/services/permission.service.ts
import { ManagerPermissions } from '../models/User';

export class PermissionService {
  /**
   * 检查管理人员是否拥有某项权限
   * @param userId 用户ID
   * @param resource 资源类型 ('position' | 'user')
   * @param action 操作 ('create', 'edit', 'delete', 'viewBudget')
   */
  static async hasPermission(
    userId: string,
    resource: keyof ManagerPermissions,
    action: keyof NonNullable<ManagerPermissions[keyof ManagerPermissions]>
  ): Promise<boolean> {
    // 实际项目：从数据库查询用户
    const user = await getUserById(userId); // 假设有此函数

    if (!user || user.role !== 'manager') {
      return false;
    }

    return Boolean(user.permissions?.[resource]?.[action]);
  }
}

// 模拟 DB 查询（替换为真实 Mongoose/MongoDB 调用）
async function getUserById(id: string) {
  // return await User.findById(id);
  return null;
}