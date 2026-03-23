import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { query } from '@/lib/db'
import { embedText } from '@/lib/embeddings'
import { auth } from '@/lib/auth'

export const maxDuration = 60

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = await req.json()
    const { question, documentId } = body

    if (!question || !documentId) {
      return new Response(JSON.stringify({ error: 'Missing question or documentId' }), { status: 400 })
    }

    // 1. Embed the question
    let queryEmbedding: number[]
    try {
      queryEmbedding = await embedText(question)
    } catch (embErr) {
      console.error('Embedding error:', embErr)
      return new Response('Embedding failed', { status: 500 })
    }

    // 2. Find top 5 relevant chunks
    let chunks: any[]
    try {
      const result = await query(
        `SELECT id, content, chunk_index,
          1 - (embedding <=> $1::vector) AS similarity
         FROM chunks
         WHERE document_id = $2 AND user_id = $3
           AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT 5`,
        [`[${queryEmbedding.join(',')}]`, documentId, session.user.id]
      )
      chunks = result.rows
    } catch (dbErr) {
      console.error('DB similarity search error:', dbErr)
      return new Response('Database error', { status: 500 })
    }

    if (!chunks || chunks.length === 0) {
      const fallback = new TextEncoder().encode(
        "I couldn't find relevant content in this document to answer your question. Try rephrasing or ask something else about the document."
      )
      return new Response(fallback, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      })
    }

    const context = chunks.map((c) => c.content).join('\n\n---\n\n')

    // 3. Save user message
    try {
      await query(
        'INSERT INTO messages (document_id, user_id, role, content) VALUES ($1, $2, $3, $4)',
        [documentId, session.user.id, 'user', question]
      )
    } catch (msgErr) {
      console.error('Failed to save user message:', msgErr)
      // Non-fatal — continue
    }

    // 4. Stream from Groq
    let stream: any
    try {
      stream = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        stream: true,
        temperature: 0.3,
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: `You are a helpful document assistant. Answer the user's question using ONLY the context provided below. Be concise and accurate. If the answer is not in the context, say "I don't see that information in this document."

Context from document:
${context}`,
          },
          { role: 'user', content: question },
        ],
      })
    } catch (groqErr) {
      console.error('Groq API error:', groqErr)
      return new Response('AI service error', { status: 500 })
    }

    // 5. Stream tokens back, collect full response
    const encoder = new TextEncoder()
    let fullResponse = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              fullResponse += text
              controller.enqueue(encoder.encode(text))
            }
          }
        } catch (streamErr) {
          console.error('Stream error:', streamErr)
          controller.enqueue(encoder.encode('\n\n[Stream interrupted]'))
        } finally {
          controller.close()
          // Save assistant message after stream ends
          if (fullResponse) {
            query(
              'INSERT INTO messages (document_id, user_id, role, content) VALUES ($1, $2, $3, $4)',
              [documentId, session.user.id, 'assistant', fullResponse]
            ).catch(console.error)
          }
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })

  } catch (err) {
    console.error('Unhandled chat error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}
