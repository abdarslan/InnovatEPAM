import { type NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ideas } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth/session'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Authentication
  try {
    await requireAuth()
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  // Validate id param
  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  if (isNaN(id) || id <= 0) {
    return new Response('Bad Request', { status: 400 })
  }

  // Fetch attachment
  const rows = await db
    .select({
      attachmentContent: ideas.attachmentContent,
      attachmentMimeType: ideas.attachmentMimeType,
      attachmentName: ideas.attachmentName,
      attachmentSize: ideas.attachmentSize,
    })
    .from(ideas)
    .where(eq(ideas.id, id))
    .all()

  if (rows.length === 0 || rows[0].attachmentContent === null) {
    return new Response('Not Found', { status: 404 })
  }

  const { attachmentContent, attachmentMimeType, attachmentName, attachmentSize } = rows[0]

  const buffer = Buffer.isBuffer(attachmentContent)
    ? attachmentContent
    : Buffer.from(attachmentContent as Uint8Array)

  // Slice to get an ArrayBuffer (BodyInit-compatible across all lib targets)
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

  return new Response(arrayBuffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': attachmentMimeType ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${attachmentName}"`,
      'Content-Length': String(attachmentSize ?? buffer.byteLength),
    },
  })
}
