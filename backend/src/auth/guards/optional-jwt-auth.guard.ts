import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Populates `req.user` when a valid token is present, and stays quiet otherwise.
 *
 * Public listing endpoints still have to serve anonymous visitors, but they also
 * need to recognise a signed-in operator asking for their own listing — which a
 * plain JwtAuthGuard can't do (it 401s anonymous callers) and no guard at all
 * can't do either (`req.user` is never set, so the owner branch is dead code).
 *
 * A missing, expired or malformed token is not an error here: the request simply
 * proceeds as anonymous and gets the public view.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    return user || null;
  }
}
