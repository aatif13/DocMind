'use client'
import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'

type Message = { role: 'user' | 'assistant'; content: string }

interface Props {
  documentId: string
  documentName: string
  pdfUrl: string
}

// Dynamically import the PDF viewer with no SSR
const PDFViewer = dynamic(() => import('./pdf-viewer-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[rgba(79,127,255,0.40)] border-t-[rgba(79,127,255,0.90)] animate-spin" />
      <span className="text-xs text-[rgba(100,120,180,0.60)] tracking-widest uppercase">
        Loading PDF...
      </span>
    </div>
  ),
})

export default function PdfChatViewer({ documentId, documentName, pdfUrl }: Props) {
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const suggestions = [
    'Summarize this document',
    'What are the key points?',
    'What is this document about?',
  ]

  async function handleSend() {
    if (!input.trim() || streaming) return
    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, documentId }),
      })

      if (!res.ok) {
        const errText = await res.text()
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1].content = `Error: ${errText || 'Something went wrong'}`
          return updated
        })
        setStreaming(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1].content += text
          return updated
        })
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1].content = 'Network error. Please try again.'
        return updated
      })
    }
    setStreaming(false)
    if (!chatOpen) setHasNewMessage(true)
  }

  function toggleChat() {
    setChatOpen(v => !v)
    setHasNewMessage(false)
  }

  return (
    <div className="relative w-full flex flex-col" style={{ minHeight: '100dvh' }}>

      {/* Toolbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3
        bg-[rgba(6,12,28,0.80)] backdrop-blur-xl border-b border-[rgba(100,130,255,0.15)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[rgba(79,127,255,0.15)] border border-[rgba(79,127,255,0.30)]
            flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="rgba(140,180,255,0.80)" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <span className="text-sm text-[rgba(200,215,255,0.85)] truncate max-w-xs font-light tracking-wide">
            {documentName}
          </span>
        </div>
        <a href="/dashboard"
          className="text-xs text-[rgba(100,120,180,0.60)] hover:text-[rgba(140,160,210,0.90)]
            border border-[rgba(100,130,255,0.15)] hover:border-[rgba(100,130,255,0.35)]
            px-3 py-1.5 rounded-lg transition-all duration-200">
          ← Back
        </a>
      </div>

      {/* PDF Area — no SSR */}
      <div className="flex-1 overflow-y-auto flex justify-center px-4 py-8"
        style={{ background: 'rgba(4,8,20,0.60)', minHeight: 'calc(100dvh - 56px)' }}>
        <PDFViewer pdfUrl={pdfUrl} />
      </div>

      {/* Floating chat bubble */}
      <button onClick={toggleChat}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full
          bg-[rgba(79,127,255,0.20)] border border-[rgba(79,127,255,0.50)]
          hover:bg-[rgba(79,127,255,0.35)] hover:border-[rgba(79,127,255,0.80)]
          flex items-center justify-center transition-all duration-300 backdrop-blur-xl">
        {hasNewMessage && !chatOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#4f7fff]
            border-2 border-black animate-pulse" />
        )}
        {chatOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="rgba(140,180,255,0.90)" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="rgba(140,180,255,0.90)" strokeWidth="1.8" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      <div className={`fixed bottom-24 right-6 z-40 w-[380px] rounded-2xl
        bg-[rgba(6,12,28,0.85)] border border-[rgba(100,130,255,0.20)]
        backdrop-blur-xl flex flex-col overflow-hidden
        transition-all duration-300 ease-out
        ${chatOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        style={{ height: '480px' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3
          border-b border-[rgba(100,130,255,0.12)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[rgba(79,127,255,0.80)] animate-pulse" />
            <span className="text-xs font-light tracking-widest uppercase text-[rgba(140,180,255,0.80)]">
              Document AI
            </span>
          </div>
          <span className="text-[10px] text-[rgba(100,120,180,0.45)] font-mono truncate max-w-[160px]">
            {documentName}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <p className="text-xs text-[rgba(100,120,180,0.55)] text-center tracking-wide">
                Ask anything about this document
              </p>
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-left px-3 py-2 rounded-xl text-xs
                    bg-[rgba(79,127,255,0.06)] border border-[rgba(79,127,255,0.15)]
                    text-[rgba(140,160,210,0.70)]
                    hover:bg-[rgba(79,127,255,0.12)] hover:border-[rgba(79,127,255,0.30)]
                    hover:text-[rgba(180,200,255,0.90)] transition-all duration-200">
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2.5 rounded-xl text-xs leading-relaxed
                whitespace-pre-wrap break-words
                ${m.role === 'user'
                  ? 'bg-[rgba(79,127,255,0.15)] border border-[rgba(79,127,255,0.28)] text-[rgba(200,215,255,0.90)] rounded-br-sm'
                  : 'bg-[rgba(20,30,60,0.60)] border border-[rgba(100,130,255,0.14)] text-[rgba(180,200,240,0.85)] rounded-bl-sm'
                }`}>
                {m.content || (
                  <span className="animate-pulse text-[rgba(100,120,180,0.50)]">▋</span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-[rgba(100,130,255,0.12)]">
          <div className="flex gap-2 items-end">
            <textarea rows={1}
              className="flex-1 px-3 py-2.5 rounded-xl text-xs resize-none
                bg-[rgba(6,12,28,0.70)] border border-[rgba(100,130,255,0.20)]
                focus:border-[rgba(79,127,255,0.55)] focus:outline-none
                text-[rgba(210,225,255,0.90)] placeholder:text-[rgba(100,120,180,0.35)]
                transition-colors duration-200 max-h-24 overflow-y-auto"
              placeholder="Ask about this document..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              disabled={streaming}
            />
            <button onClick={handleSend} disabled={streaming || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                bg-[rgba(79,127,255,0.18)] border border-[rgba(79,127,255,0.35)]
                hover:bg-[rgba(79,127,255,0.30)] disabled:opacity-30 transition-all duration-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="rgba(140,180,255,0.90)" strokeWidth="2" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-[rgba(80,100,150,0.40)] mt-1.5 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}