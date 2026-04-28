import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import LoadingOverlay from '../components/LoadingOverlay'
import { PAPERS } from '../data'
import { useToast } from '../hooks/useToast'
import { api } from '../api/client'

const FILTERS = ['추천', '생일', '심플한'] as const
type Filter = typeof FILTERS[number]

export default function Write() {
  const navigate = useNavigate()
  const { show } = useToast()

  const initialTmpl = sessionStorage.getItem('culetter_selected_tmpl') || PAPERS[0].id
  const [paperId, setPaperId] = useState(initialTmpl)
  const [sbTab, setSbTab] = useState<'letter' | 'sticker'>('letter')
  const [filter, setFilter] = useState<Filter>('추천')
  const [to, setTo] = useState('')
  const [body, setBody] = useState('')
  const [from, setFrom] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('culetter_draft')
    if (!raw) return
    sessionStorage.removeItem('culetter_draft')
    const draft = JSON.parse(raw) as { paperId: string; to: string; body: string; from: string }
    setPaperId(draft.paperId)
    setTo(draft.to)
    setBody(draft.body)
    setFrom(draft.from)
  }, [])
  const [loading, setLoading] = useState(false)
  const [loginRequired, setLoginRequired] = useState(false)

  const paper = PAPERS.find(p => p.id === paperId) || PAPERS[0]
  const visibleThumbs = useMemo(
    () => PAPERS.filter(p => p.categories.includes(filter)),
    [filter]
  )

  const lockedToast = () => show('임시저장 기능은 준비 중이에요 🔒')

  const sendLetter = async () => {
    if (!body.trim()) {
      show('편지 내용을 먼저 작성해 주세요 ✏️')
      return
    }
    if (!localStorage.getItem('culetter_access_token')) {
      setLoginRequired(true)
      return
    }
    setLoading(true)
    try {
      const data = await api.sendLetter({
        templateId: paperId,
        to: to.trim() || '받는 사람',
        body: body.trim(),
        from: from.trim() || '보내는 사람',
        stickers: [],
      })
      navigate(`/send?t=${data.shareToken}`)
    } catch (err) {
      show('편지 전송에 실패했어요 😢')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {loginRequired && (
        <div className="modal-overlay visible" onClick={() => setLoginRequired(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <p className="modal-title">로그인이 필요해요</p>
            <p className="modal-desc">편지를 보내려면 로그인하셔야 사용 가능해요</p>
            <div className="modal-actions">
              <button className="modal-btn-secondary" onClick={() => setLoginRequired(false)}>취소</button>
              <button className="modal-btn-primary" onClick={() => {
                sessionStorage.setItem('culetter_draft', JSON.stringify({ paperId, to, body, from }))
                navigate('/login')
              }}>로그인하러 가기</button>
            </div>
          </div>
        </div>
      )}
      <section className="page active" id="page-write">
        <Header right="write-actions" onDraftClick={lockedToast} onDoneClick={sendLetter} />

        {/* Mobile toolbar */}
        <div className="write-mobile-toolbar">
          <button className="btn-draft locked" onClick={lockedToast}>
            <span>임시저장</span>
            <span className="lock-icon">🔒</span>
          </button>
          <button className="btn-done" onClick={sendLetter}>
            <span>완료</span>
            <span className="arrow arrow-right-sm" style={{ borderColor: 'white' }}></span>
          </button>
        </div>

        <div className="write-body">
          {/* Desktop sidebar */}
          <aside className="write-sidebar">
            <nav className="sidebar-nav">
              <div
                className={`sidebar-nav-item${sbTab === 'letter' ? ' active' : ''}`}
                onClick={() => setSbTab('letter')}
              >편지지</div>
              <div
                className={`sidebar-nav-item${sbTab === 'sticker' ? ' active' : ''}`}
                onClick={() => setSbTab('sticker')}
              >스티커</div>
            </nav>
            <div className="sidebar-content">
              {sbTab === 'letter' ? (
                <>
                  <div className="sidebar-filter-bar">
                    {FILTERS.map(f => (
                      <button
                        key={f}
                        className={`sb-filter-tab${filter === f ? ' active' : ''}`}
                        onClick={() => setFilter(f)}
                      >{f}</button>
                    ))}
                  </div>
                  {visibleThumbs.length > 0 ? (
                    <div className="sidebar-thumbs">
                      {visibleThumbs.map(p => (
                        <div
                          key={p.id}
                          className={`thumb-item${paperId === p.id ? ' selected' : ''}`}
                          onClick={() => setPaperId(p.id)}
                        >
                          <img src={p.imageUrl} alt={p.name} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="filter-empty filter-empty-compact" style={{ display: 'flex' }}>
                      <span className="filter-empty-emoji">💭</span>
                      <p className="filter-empty-title">편지지가 없어요</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="sticker-placeholder" style={{ display: 'flex' }}>
                  <span className="sticker-lock">🔒</span>
                  <p className="sticker-title">스티커 준비 중이에요</p>
                  <p className="sticker-sub">곧 만나요 🌿</p>
                </div>
              )}
            </div>
          </aside>

          {/* Canvas */}
          <div className="write-canvas-area">
            <div className="letter-canvas">
              <img className="letter-canvas-bg" src={paper.imageUrl} alt="편지지" />
              <div className="letter-canvas-area">
                <div className="letter-to">
                  <span className="letter-prefix">To.</span>
                  <input
                    className="letter-name"
                    type="text"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    placeholder="받는 사람"
                    maxLength={20}
                  />
                </div>
                <textarea
                  className="letter-textarea"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="여기에 편지 내용을 적어보세요 ✍️"
                />
                <div className="letter-from">
                  <span className="letter-prefix">From.</span>
                  <input
                    className="letter-name"
                    type="text"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    placeholder="보내는 사람"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile inline template */}
          <div className="write-inline-tmpl">
            <div className="inline-tmpl-nav">
              <div
                className={`inline-tab${sbTab === 'letter' ? ' active' : ''}`}
                onClick={() => setSbTab('letter')}
              >편지지</div>
              <div
                className={`inline-tab${sbTab === 'sticker' ? ' active' : ''}`}
                onClick={() => setSbTab('sticker')}
              >스티커</div>
            </div>
            {sbTab === 'letter' ? (
              <>
                <div className="inline-filter-row">
                  {FILTERS.map(f => (
                    <button
                      key={f}
                      className={`inline-filter-tab${filter === f ? ' active' : ''}`}
                      onClick={() => setFilter(f)}
                    >{f}</button>
                  ))}
                </div>
                {visibleThumbs.length > 0 ? (
                  <div className="inline-tmpl-grid">
                    {visibleThumbs.map(p => (
                      <div
                        key={p.id}
                        className={`inline-thumb${paperId === p.id ? ' selected' : ''}`}
                        onClick={() => setPaperId(p.id)}
                      >
                        <img src={p.imageUrl} alt={p.name} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="filter-empty filter-empty-compact" style={{ display: 'flex' }}>
                    <span className="filter-empty-emoji">💭</span>
                    <p className="filter-empty-title">편지지가 없어요</p>
                  </div>
                )}
              </>
            ) : (
              <div className="sticker-placeholder inline-sticker-placeholder" style={{ display: 'flex' }}>
                <span className="sticker-lock">🔒</span>
                <p className="sticker-title">스티커 준비 중이에요</p>
                <p className="sticker-sub">곧 만나요 🌿</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom action bar */}
        <div className="write-bottom-bar">
          <button className="btn-draft locked" onClick={lockedToast}>
            <span>임시저장</span>
            <span className="lock-icon">🔒</span>
          </button>
          <button className="btn-done" onClick={sendLetter}>
            <span>완료</span>
            <span className="arrow arrow-right-sm" style={{ borderColor: 'white' }}></span>
          </button>
        </div>
      </section>
      <LoadingOverlay show={loading} />
    </>
  )
}
