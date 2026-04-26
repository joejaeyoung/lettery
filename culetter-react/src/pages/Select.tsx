import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { PAPERS } from '../data'
import { useToast } from '../hooks/useToast'

const FILTERS = ['추천', '생일', '심플한'] as const
type Filter = typeof FILTERS[number]

export default function Select() {
  const navigate = useNavigate()
  const { show } = useToast()
  const [filter, setFilter] = useState<Filter>('추천')
  const [pickedId, setPickedId] = useState(PAPERS[0].id)

  const visible = useMemo(
    () => PAPERS.filter(p => p.categories.includes(filter)),
    [filter]
  )

  const goWrite = () => {
    sessionStorage.setItem('culetter_selected_tmpl', pickedId)
    navigate('/write')
  }

  return (
    <section className="page active" id="page-select">
      <Header />
      <main className="select-main">
        <div className="select-title-group">
          <h1 className="select-title">편지지 선택</h1>
          <p className="select-subtitle">마음에 드는 편지지를 골라주세요</p>
        </div>
        <div className="filter-tabs">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        {visible.length > 0 ? (
          <div className="templates-grid">
            {visible.map(p => (
              <div
                key={p.id}
                className={`tmpl-card${pickedId === p.id ? ' selected' : ''}`}
                onClick={() => {
                  setPickedId(p.id)
                  show('편지지를 선택했어요 ✅')
                }}
              >
                <img className="tmpl-bg" src={p.imageUrl} alt={p.name} />
                <div className="tmpl-overlay"></div>
                <div className="tmpl-tag">
                  <i className="check-icon">✓</i>
                  <span>{p.name} {p.emoji}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="filter-empty" style={{ display: 'flex' }}>
            <span className="filter-empty-emoji">💭</span>
            <p className="filter-empty-title">아직 준비된 편지지가 없어요</p>
            <p className="filter-empty-sub">곧 만나요!</p>
          </div>
        )}
      </main>
      <div className="bottom-bar select-bar">
        <button className="btn-green-solid" onClick={goWrite}>
          <span>다음 단계</span>
          <span className="arrow arrow-right" style={{ borderColor: 'white' }}></span>
        </button>
      </div>
    </section>
  )
}
