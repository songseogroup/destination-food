import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceUserId = request.body?.userId || request.params?.userId || request.query?.userId;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }
    
    // Admin can access everything
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    
    // Users can only access their own resources
    if (resourceUserId && parseInt(resourceUserId) !== user.id) {
      throw new ForbiddenException('You can only access your own resources');
    }
    
    return true;
  }
}

