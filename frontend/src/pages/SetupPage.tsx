const STEPS = [
  {
    num: '01',
    title: 'Search',
    desc: 'Use the search bar or browse trending and popular anime on the home page. Filter by genre to narrow things down.',
    detail: 'Every result shows the cover image, episode count, and whether English dub is available.',
  },
  {
    num: '02',
    title: 'Select',
    desc: 'Choose between Dub or Sub, pick your preferred quality, and select which episodes to download.',
    detail: 'You can select individual episodes or use "Select All" for a batch. Episodes you\'ve already downloaded are marked with a check.',
  },
  {
    num: '03',
    title: 'Download',
    desc: 'Hit the download button. Multiple episodes run in parallel (up to 3 at a time).',
    detail: 'Progress shows in real-time — the episode number gradually turns white as it downloads. You can stop all active downloads from the Downloads page.',
  },
  {
    num: '04',
    title: 'Watch',
    desc: 'Find your files in the download destination folder (default: ~/Videos/anime/).',
    detail: 'Each show gets its own subfolder. Files are named by episode number for easy sorting.',
  },
]

const PREREQS = [
  { label: 'Python 3.11+', desc: 'Runtime for the backend server' },
  { label: 'Node.js 20+', desc: 'Runtime for the frontend dev server' },
  { label: 'yt-dlp', desc: 'Handles video downloading from streaming sources (install: pip install yt-dlp or brew install yt-dlp)' },
  { label: 'ffmpeg', desc: 'Required by yt-dlp for merging DASH streams (install: apt/brew/pacman install ffmpeg)' },
]

export default function SetupPage() {
  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
            How to Use
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 560 }}>
            Anime Downloader lets you search, browse, and download anime episodes
            directly from streaming sources. Everything runs on your machine — no ads, no trackers.
          </p>
        </div>

        {/* Prerequisites */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Prerequisites
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PREREQS.map(p => (
              <div
                key={p.label}
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: '14px 18px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <code style={{
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  minWidth: 130,
                }}>
                  {p.label}
                </code>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {p.desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Workflow
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {STEPS.map((s, i) => (
              <div
                key={s.num}
                style={{
                  display: 'flex',
                  gap: 20,
                  padding: 24,
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: i < 3 ? '2px solid rgba(255,255,255,0.15)' : '2px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.06)',
                  lineHeight: 1,
                  minWidth: 44,
                  fontFamily: 'monospace',
                }}>
                  {s.num}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>
                    {s.title}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 4 }}>
                    {s.desc}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {s.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tips */}
        <section>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Tips
          </h2>
          <div style={{
            padding: 24,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 2 }}>
              <li>English dubs are preferred when available — the Dub tab shows episodes with English audio.</li>
              <li>Downloads survive terminal restarts — both servers run as daemons.</li>
              <li>Use the History page to pick up where you left off on any show.</li>
              <li>Multiple episodes download in parallel. You can stop all downloads at any time.</li>
              <li>The search dropdown shows your recent searches and trending recommendations.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
