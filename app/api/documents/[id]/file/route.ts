import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const result = await query(
    'SELECT file_data, name FROM documents WHERE id = $1 AND user_id = $2',
    [params.id, session.user.id]
  )

  if (!result.rows[0]) {
    return new NextResponse('Not found', { status: 404 })
  }

  const { file_data, name } = result.rows[0]

  return new NextResponse(file_data, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${name}"`,
    },
  })
}
