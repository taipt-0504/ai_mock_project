import { getUnreadCountForUser } from "@/src/repositories/notification-repository";

export async function getUnreadCount(userId: string): Promise<number> {
  return getUnreadCountForUser(userId);
}
