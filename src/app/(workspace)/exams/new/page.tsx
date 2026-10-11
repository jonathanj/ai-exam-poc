import { requireUser } from "@/lib/auth";
import { Wizard } from "@/components/wizard";
export default async function NewPage() {
  const user = await requireUser();
  return <Wizard examiner={user.name} />;
}
