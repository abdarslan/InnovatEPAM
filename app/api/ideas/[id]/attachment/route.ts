import { type NextRequest } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ideaAttachments } from '@/lib/db/schema'
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
      content: ideaAttachments.content,
      mimeType: ideaAttachments.mimeType,
      originalName: ideaAttachments.originalName,
      sizeBytes: ideaAttachments.sizeBytes,
    })
    .from(ideaAttachments)
    .where(eq(ideaAttachments.ideaId, id))
    .orderBy(asc(ideaAttachments.createdAt))
    .limit(1)
    .all()

  if (rows.length === 0) {
    return new Response('Not Found', { status: 404 })
  }

  const { content, mimeType, originalName, sizeBytes } = rows[0]

  const buffer = Buffer.isBuffer(content)
    ? content
    : Buffer.from(content as Uint8Array)

  // Slice to get an ArrayBuffer (BodyInit-compatible across all lib targets)
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

  return new Response(arrayBuffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${originalName}"`,
      'Content-Length': String(sizeBytes),
    },
  })
}
