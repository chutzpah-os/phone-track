import { SetMetadata } from '@nestjs/common';
import type { Papel } from '@phonetrack/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Papel[]) => SetMetadata(ROLES_KEY, roles);
