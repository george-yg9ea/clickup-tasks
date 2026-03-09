import { cookies } from "next/headers";
import { Dashboard } from "./dashboard";

export default async function Home() {
  const cookieStore = await cookies();
  const cachedName = cookieStore.get("tasks_user_name")?.value || null;

  return <Dashboard initialName={cachedName} />;
}
