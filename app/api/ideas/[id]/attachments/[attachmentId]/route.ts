import { type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ideaAttachments } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  try {
    await requireAuth()
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id: rawId, attachmentId: rawAttachmentId } = await params
  const id = parseInt(rawId, 10)
  const attachmentId = parseInt(rawAttachmentId, 10)

  if (Number.isNaN(id) || id <= 0 || Number.isNaN(attachmentId) || attachmentId <= 0) {
    return new Response('Bad Request', { status: 400 })
  }

  try {
    const rows = await db
      .select()
      .from(ideaAttachments)
      .where(and(eq(ideaAttachments.ideaId, id), eq(ideaAttachments.id, attachmentId)))
      .limit(1)
      .all()

    if (rows.length === 0) {
      return new Response('Not Found', { status: 404 })
    }

    const attachment = rows[0]
    const buffer = Buffer.isBuffer(attachment.content)
      ? attachment.content
      : Buffer.from(attachment.content as Uint8Array)
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    const forceDownload = new URL(request.url).searchParams.get('download') === '1'
    const disposition = forceDownload || !attachment.previewEligible ? 'attachment' : 'inline'

    return new Response(arrayBuffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `${disposition}; filename="${attachment.originalName}"`,
        'Content-Length': String(attachment.sizeBytes),
      },
    })
  } catch {
    return new Response('Internal Server Error', { status: 500 })
  }
}