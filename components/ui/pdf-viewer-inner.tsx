'use client'
import { useState, useEffect, useRef } from 'react'

interface Props {
    pdfUrl: string
}

export default function PdfViewerInner({ pdfUrl }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [numPages, setNumPages] = useState(0)
    const [pageNumber, setPageNumber] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const pdfRef = useRef<any>(null)

    useEffect(() => {
        let cancelled = false

        async function loadPdf() {
            try {
                setLoading(true)
                setError('')

                // Dynamically import pdfjs only on client
                const pdfjsLib = await import('pdfjs-dist')
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`

                const pdf = await pdfjsLib.getDocument(pdfUrl).promise
                if (cancelled) return

                pdfRef.current = pdf
                setNumPages(pdf.numPages)
                setLoading(false)
                renderPage(pdf, 1)
            } catch (err) {
                if (!cancelled) {
                    setError('Failed to load PDF')
                    setLoading(false)
                }
            }
        }

        loadPdf()
        return () => { cancelled = true }
    }, [pdfUrl])

    async function renderPage(pdf: any, pageNum: number) {
        try {
            const page = await pdf.getPage(pageNum)
            const canvas = canvasRef.current
            if (!canvas) return

            const viewport = page.getViewport({ scale: 1.4 })
            canvas.width = viewport.width
            canvas.height = viewport.height

            const ctx = canvas.getContext('2d')
            await page.render({ canvasContext: ctx, viewport }).promise
        } catch (err) {
            console.error('Render error:', err)
        }
    }

    function goToPage(num: number) {
        setPageNumber(num)
        if (pdfRef.current) renderPage(pdfRef.current, num)
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center gap-3 mt-20">
            <div className="w-8 h-8 rounded-full border-2 border-[rgba(79,127,255,0.40)]
        border-t-[rgba(79,127,255,0.90)] animate-spin" />
            <span className="text-xs text-[rgba(100,120,180,0.60)] tracking-widest uppercase">
                Rendering PDF...
            </span>
        </div>
    )

    if (error) return (
        <div className="mt-20 text-center text-[rgba(255,100,100,0.70)] text-sm">
            {error}
        </div>
    )

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Page controls */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl
        bg-[rgba(6,12,28,0.70)] border border-[rgba(100,130,255,0.15)]">
                <button onClick={() => goToPage(Math.max(1, pageNumber - 1))}
                    disabled={pageNumber <= 1}
                    className="w-7 h-7 rounded-lg border border-[rgba(100,130,255,0.20)]
            text-[rgba(140,160,210,0.70)] hover:text-[rgba(200,215,255,0.90)]
            disabled:opacity-30 flex items-center justify-center transition-all text-sm">
                    ‹
                </button>
                <span className="text-xs text-[rgba(100,120,180,0.70)] font-mono min-w-[70px] text-center">
                    {pageNumber} / {numPages}
                </span>
                <button onClick={() => goToPage(Math.min(numPages, pageNumber + 1))}
                    disabled={pageNumber >= numPages}
                    className="w-7 h-7 rounded-lg border border-[rgba(100,130,255,0.20)]
            text-[rgba(140,160,210,0.70)] hover:text-[rgba(200,215,255,0.90)]
            disabled:opacity-30 flex items-center justify-center transition-all text-sm">
                    ›
                </button>
            </div>

            {/* Canvas */}
            <canvas ref={canvasRef}
                className="rounded-xl shadow-[0_0_60px_rgba(0,0,0,0.60)] max-w-full"
                style={{ background: 'white' }}
            />
        </div>
    )
}