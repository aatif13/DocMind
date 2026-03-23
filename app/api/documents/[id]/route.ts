import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await pool.query(
      "DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id",
      [params.id, session.user.id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Document not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: res.rows[0].id });
  } catch (err: any) {
    console.error("Error deleting document:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
