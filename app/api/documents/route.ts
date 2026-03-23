import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await pool.query(
      "SELECT id, name, size_bytes, chunk_count, status, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC",
      [session.user.id]
    );

    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error("Error fetching documents:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
