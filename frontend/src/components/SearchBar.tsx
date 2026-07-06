import { useState, type FormEvent } from 'react'

interface Props {
  onSearch: (q: string) => void
  initial?: string
}

export default function SearchBar({ onSearch, initial = '' }: Props) {
  const [value, setValue] = useState(initial)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        transition: 'border-color 0.15s',
      }}
        onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
        onBlurCapture={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
      >
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Search anime..."
          style={{
            flex: 1,
            padding: '14px 0',
            fontSize: '1.25rem',
            fontWeight: 400,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#fff',
          }}
          autoFocus
        />
        <button
          type="submit"
          style={{
            padding: '14px 24px',
            fontSize: '0.85rem',
            fontWeight: 600,
            border: 'none',
            background: 'transparent',
            color: value.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
            cursor: value.trim() ? 'pointer' : 'default',
          }}
        >
          SEARCH
        </button>
      </div>
    </form>
  )
}
