import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import DashboardClient from "./client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch documents from database
  let documents = [];
  try {
    const res = await pool.query(
      "SELECT id, name, size_bytes, chunk_count, status, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC",
      [session.user.id]
    );
    documents = res.rows;
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    // If table doesn't exist yet, we just pass empty array
  }

  return <DashboardClient user={session.user} initialDocuments={documents} />;
}
