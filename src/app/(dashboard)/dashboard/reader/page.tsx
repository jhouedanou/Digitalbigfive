import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import OfflineLibraryClient from "./OfflineLibraryClient";

export default async function OfflineLibraryPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return <OfflineLibraryClient />;
}
