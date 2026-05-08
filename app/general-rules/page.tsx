import { redirect } from "next/navigation";

import StubPage from "@/src/components/ui/StubPage";
import { auth } from "@/src/lib/auth";

export const dynamic = "force-dynamic";

export default async function GeneralRulesPage() {
  const session = await auth().catch(() => null);
  if (!session?.user) redirect("/login");
  return <StubPage title="Tiêu chuẩn chung" />;
}
