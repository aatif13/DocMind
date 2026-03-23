import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/db'
import PdfChatViewer from '@/components/ui/pdf-chat-viewer'

export default async function ChatPage({
  params,
}: {
  params: { docId: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const result = await query(
    'SELECT id, name FROM documents WHERE id = $1 AND user_id = $2',
    [params.docId, session.user.id]
  )

  if (!result.rows[0]) redirect('/dashboard')

  const doc = result.rows[0]

  return (
    <PdfChatViewer
      documentId={doc.id}
      documentName={doc.name}
      pdfUrl={`/api/documents/${doc.id}/file`}
    />
  )
}
