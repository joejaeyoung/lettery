import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { PAPERS } from '../data'

const EASE = 'linear'
const SLIDE_DUR = 500
const WRAP_DUR = 500
const IDLE_DUR = 1700
const TRANS = `transform ${SLIDE_DUR}ms ${EASE}, opacity ${SLIDE_DUR}ms ${EASE}, border-color 400ms ease, box-shadow 400ms ease`

const STYLES: Record<string, Partial<CSSStyleDeclaration>> = {
  left: {
    transform: 'translate(calc(-50% - 210px), -50%) scale(0.72) rotateY(5deg)',
    opacity: '0.4', zIndex: '1',
    borderColor: 'transparent', boxShadow: 'none',
  },
  center: {
    transform: 'translate(-50%, -50%) scale(1) rotateY(0deg)',
    opacity: '1', zIndex: '3',
    borderColor: '#a2ee48', boxShadow: '0 0 40px rgba(162,238,72,0.45)',
  },
  right: {
    transform: 'translate(calc(-50% + 210px), -50%) scale(0.72) rotateY(-5deg)',
    opacity: '0.4', zIndex: '1',
    borderColor: 'transparent', boxShadow: 'none',
  },
}

export default function Home() {
  const navigate = useNavigate()
  const stageRef = useRef<HTMLDivElement>(null)
  const busy = useRef(false)

  // 홈 캐러셀에서 보여줄 3장 (테마 편지지)
  const cards = PAPERS.slice(0, 3)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const cardEls = Array.from(stage.querySelectorAll<HTMLElement>('.letter-card'))
    if (cardEls.length < 3) return

    function applyStyle(card: HTMLElement, posName: keyof typeof STYLES, animate: boolean) {
      const s = STYLES[posName]
      card.style.transition = animate ? TRANS : 'none'
      Object.assign(card.style, s)
      card.dataset.pos = posName
      if (!animate) void card.offsetHeight
    }

    applyStyle(cardEls[0], 'left',   false)
    applyStyle(cardEls[1], 'center', false)
    applyStyle(cardEls[2], 'right',  false)

    function rotate() {
      if (busy.current) return
      busy.current = true
      const leftCard   = cardEls.find(c => c.dataset.pos === 'left')
      const centerCard = cardEls.find(c => c.dataset.pos === 'center')
      const rightCard  = cardEls.find(c => c.dataset.pos === 'right')
      if (!leftCard || !centerCard || !rightCard) { busy.current = false; return }

      rightCard.style.cssText = ''
      rightCard.classList.add('wrapping')
      rightCard.dataset.pos = 'left'

      applyStyle(leftCard, 'center', true)
      applyStyle(centerCard, 'right', true)

      window.setTimeout(() => {
        rightCard.classList.remove('wrapping')
        applyStyle(rightCard, 'left', false)
        busy.current = false
      }, WRAP_DUR + 40)
    }

    let timer = window.setInterval(rotate, WRAP_DUR + IDLE_DUR)
    let startX = 0
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; window.clearInterval(timer) }
    const onTouchEnd = (e: TouchEvent) => {
      if (Math.abs(startX - e.changedTouches[0].clientX) > 40) rotate()
      timer = window.setInterval(rotate, WRAP_DUR + IDLE_DUR)
    }
    stage.addEventListener('touchstart', onTouchStart, { passive: true })
    stage.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.clearInterval(timer)
      stage.removeEventListener('touchstart', onTouchStart)
      stage.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return (
    <section className="page active" id="page-home">
      <Header right="login" />
      <main className="home-main">
        <div className="home-cards-label">
          <span>큐레터가 엄선한 오늘의 편지</span>
          <span style={{ fontSize: '20px', marginLeft: 4 }}>☘️</span>
        </div>
        <div className="cards-stage" ref={stageRef}>
          {cards.map((p, i) => (
            <div className="letter-card" key={p.id} data-pos={['left', 'center', 'right'][i]}>
              <img className="card-img" src={p.imageUrl} alt={p.name} />
              <div className="card-label"><span>{p.name} {p.emoji}</span></div>
            </div>
          ))}
        </div>
        <div className="home-cta">
          <div className="home-cta-hint">이 편지로 할래요</div>
          <button className="btn-green-outline" onClick={() => navigate('/select')}>
            <span>편지 쓰러 가기</span>
            <span className="arrow arrow-right"></span>
          </button>
        </div>
        <div className="home-more" onClick={() => navigate('/select')}>
          <span>모든 편지지</span>
          <span className="chevron-down"></span>
        </div>
      </main>
    </section>
  )
}
