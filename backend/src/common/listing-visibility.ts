import { SelectQueryBuilder } from 'typeorm';
import { UserRole } from '../users/entities/user.entity';

/** Platform staff. See everything, published or not. */
export const isStaffRole = (role?: UserRole | string) =>
  role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

/**
 * The roles that can own a listing.
 *
 * This matters because customer tokens are signed with the same secret and carry
 * their own id in `sub`. Treating "has a token" as "is a vendor" would scope a
 * signed-in customer's query to `listing.userId = <customer id>` and 404 the
 * whole catalogue at them. Only these roles get the owner branch.
 */
const VENDOR_ROLES: string[] = [
  UserRole.BAR,
  UserRole.DISTILLERY,
  UserRole.TOUR_OPERATOR,
  UserRole.EVENT_HOST,
];

export const isVendorRole = (role?: UserRole | string) =>
  !!role && VENDOR_ROLES.includes(role as string);

/**
 * Scope a listing query to what this caller is allowed to see.
 *
 * Three audiences, and they were previously conflated:
 *
 *  - staff: everything, including unpublished.
 *  - the owning vendor: their own listings, including unpublished and while
 *    their account is still pending approval. Without this an operator can't
 *    see the listing they just created — the page tells them they have none and
 *    they create it again.
 *  - everyone else (anonymous visitors and signed-in customers alike): only
 *    published listings whose owner has been approved.
 */
export function applyListingVisibility<T>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  userId?: number,
  userRole?: UserRole | string,
): SelectQueryBuilder<T> {
  if (isStaffRole(userRole)) {
    return qb;
  }

  if (isVendorRole(userRole) && userId) {
    return qb.andWhere(`${alias}.userId = :visibilityUid`, { visibilityUid: userId });
  }

  return qb
    .andWhere(`${alias}.isActive = :visibilityActive`, { visibilityActive: true })
    .leftJoin('users', 'visibilityOwner', `visibilityOwner.id = ${alias}.userId`)
    .andWhere(
      `(${alias}.userId IS NULL OR (visibilityOwner.approvalStatus = :visibilityApproved AND visibilityOwner.isActive = :visibilityOwnerActive))`,
      { visibilityApproved: 'approved', visibilityOwnerActive: true },
    );
}
