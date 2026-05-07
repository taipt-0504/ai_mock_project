/**
 * Notification repository — v1 stub.
 *
 * Returns a hard-coded `0` while the notification panel feature is on the
 * backlog. The real implementation will read from a `Notification` table
 * (or join through `User`) — until then any caller of `getUnreadCount`
 * receives 0 without a DB hit. Keeping the boundary here means the route
 * handler + service contracts stay stable when persistence lands.
 */

export async function getUnreadCountForUser(
  userId: string,
): Promise<number> {
  void userId;
  return 0;
}
