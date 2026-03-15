'use client'

import Link from 'next/link'

export default function WorkersError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#fff',
        }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111', marginBottom: '0.5rem' }}>
                人材ページでエラー発生
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1rem' }}>Workers Page Error</p>
            <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '1rem 1.5rem',
                maxWidth: '600px',
                width: '100%',
                marginBottom: '1.5rem',
            }}>
                <p style={{ fontSize: '13px', color: '#dc2626', fontFamily: 'monospace', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                    {error.message || 'Unknown error'}
                </p>
                {error.digest && (
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '0.5rem' }}>
                        Digest: {error.digest}
                    </p>
                )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '10px 24px',
                        backgroundColor: '#059669',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                    }}
                >
                    再試行
                </button>
                <Link
                    href="/"
                    style={{
                        padding: '10px 24px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        textDecoration: 'none',
                    }}
                >
                    ホームに戻る
                </Link>
            </div>
        </div>
    )
}
