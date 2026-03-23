import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { pool } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    // Validation
    if (!name || !email || !password)
      return NextResponse.json({ error: "All fields required" }, { status: 400 })

    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })

    // Check if email already taken
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email])
    if (existing.rows.length > 0)
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })

    // Hash password and insert
    const password_hash = await bcrypt.hash(password, 12)

    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, password_hash]
    )

    return NextResponse.json({ user: result.rows[0] }, { status: 201 })
  } catch (err: any) {
    console.error("Registration error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
