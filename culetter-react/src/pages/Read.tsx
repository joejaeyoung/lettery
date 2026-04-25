import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SAMPLE_LETTER } from '../data'
import { api } from '../api/client'

type LetterState = {
  to: string
  body: string
  from: string
}

export default function Read() {
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  const [opened, setOpened] = useState(false)
  const [letter, setLetter] = useState<LetterState | null>(null)

  useEffect(() => {
    setOpened(false)

    if (token) {
      api.getLetter(token)
        .then(data => setLetter({ to: data.to, body: data.body, from: data.from }))
        .catch(() => setLetter(fallbackFromSession()))
    } else {
      setLetter(fallbackFromSession())
    }
  }, [token])

  const toName   = letter?.to   || '소중한 당신'
  const fromName = letter?.from || '연우'
  const body     = letter?.body || SAMPLE_LETTER

  return (
    <section className={`page active${opened ? ' opened' : ''}`} id="page-read">
      <main className="read-main">
        <span className="read-particle" style={{ left: '10%', top: '72%', animationDelay: '0s',   fontSize: 16 }}>☘️</span>
        <span className="read-particle" style={{ left: '86%', top: '66%', animationDelay: '1.4s', fontSize: 12 }}>✨</span>
        <span className="read-particle" style={{ left: '20%', top: '45%', animationDelay: '2.8s', fontSize: 13 }}>🌿</span>
        <span className="read-particle" style={{ left: '78%', top: '28%', animationDelay: '4s',   fontSize: 12 }}>✨</span>
        <span className="read-particle" style={{ left: '14%', top: '18%', animationDelay: '3.2s', fontSize: 14 }}>☘️</span>
        <span className="read-particle" style={{ left: '90%', top: '40%', animationDelay: '5.4s', fontSize: 11 }}>✨</span>

        <div className={`read-intro${opened ? ' hidden' : ''}`}>
          <div className="read-intro-kicker">
            <span>💌</span><span>편지가 도착했어요</span>
          </div>
          <h1 className="read-intro-title">소중한 마음이 담긴 편지예요</h1>
          <p className="read-intro-hint">봉투를 눌러서 열어보세요</p>
        </div>

        <div className="envelope-stage">
          <div className="envelope" onClick={() => setOpened(true)}>
            <div className="env-back"></div>
            <div className="env-letter"></div>
            <div className="env-front"></div>
            <div className="env-flap">
              <div className="wax-seal">C</div>
            </div>
          </div>
        </div>

        <article className="reveal-letter">
          <p className="letter-greeting">To. {toName}에게 💚</p>
          <p className="letter-body">{body}</p>
          <div className="letter-divider"></div>
          <p className="letter-signature">From. {fromName}</p>
        </article>

        <div className="read-actions">
          <button className="read-btn read-btn-outline" onClick={() => setOpened(false)}>다시 열어보기</button>
          <button className="read-btn read-btn-solid" onClick={() => navigate('/')}>처음으로</button>
        </div>
      </main>
    </section>
  )
}

function fallbackFromSession(): LetterState {
  try {
    const raw = sessionStorage.getItem('culetter_composed')
    const composed = raw ? JSON.parse(raw) : null
    return {
      to:   composed?.to   || '소중한 당신',
      body: composed?.body || SAMPLE_LETTER,
      from: composed?.from || '연우',
    }
  } catch {
    return { to: '소중한 당신', body: SAMPLE_LETTER, from: '연우' }
  }
}
