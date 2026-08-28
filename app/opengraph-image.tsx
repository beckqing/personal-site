import { ImageResponse } from 'next/og'

export const alt = 'beck qing — interdisciplinary designer, painter, and writer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080b24',
          color: '#ced2cd',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 10, textTransform: 'uppercase', color: '#a79f99' }}>
          personal home of
        </div>
        <div style={{ display: 'flex', fontSize: 108, fontWeight: 700, marginTop: 20 }}>beck qing</div>
        <div style={{ display: 'flex', fontSize: 30, color: '#a79f99', marginTop: 28 }}>art · science · humanity</div>
      </div>
    ),
    { ...size },
  )
}
