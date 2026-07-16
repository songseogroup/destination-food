import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    /**
     * SUPER_ADMIN satisfies every role requirement.
     *
     * This guard matched roles by exact equality with no hierarchy, so
     * super_admin was only allowed where it happened to be listed explicitly.
     * The admin, customers, banners and reviews modules do list it; the bars,
     * distilleries and events modules do not. The result was that super_admin —
     * the only role the CMS shows the "Add Bar"/"Add Distillery"/"Add Event"
     * buttons to — got a 403 from the very endpoints those buttons call, so
     * creating a listing was impossible for every role.
     *
     * Granting it here rather than appending UserRole.SUPER_ADMIN to ~20 @Roles
     * lists fixes the whole class of bug and stops it recurring on the next
     * controller someone adds.
     */
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
