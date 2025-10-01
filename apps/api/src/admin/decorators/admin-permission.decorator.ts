import { SetMetadata } from '@nestjs/common'
import { AdminPermission } from '../guards/admin-role.guard'

export const RequirePermission = (permission: AdminPermission) =>
  SetMetadata('adminPermission', permission)
