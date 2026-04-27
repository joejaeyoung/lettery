import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import { useToast } from '../hooks/useToast'

export default function Send() {
  const navigate = useNavigate()
  const { show } = useToast()
  const [params] = useSearchParams()
  const token = params.get('t') || Math.random().toString(36).slice(2, 10)
  const shareUrl = useMemo(() => `${window.location.origin}/letter/${token}`, [token])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      show('링크가 복사되었어요! 💌')
    } catch {
      show('복사에 실패했어요 😢')
    }
  }

  return (
    <section className="page active" id="page-send">
      <Header />
      <main className="send-main">
        <div className="send-hero">
          <div className="send-envelope">💌</div>
          <h1 className="send-title">편지를 완성했어요</h1>
          <p className="send-sub">소중한 사람에게 전달해보세요 🌿</p>
        </div>
        <div className="send-options">
          <div className="share-section">
            <div className="share-label">
              <span className="share-divider"></span>
              <span>💌 링크로 공유하기 👀</span>
              <span className="share-divider"></span>
            </div>
            <div className="link-box">
              <span className="link-url">{shareUrl}</span>
              <button className="btn-copy" onClick={copyLink}>링크 복사</button>
            </div>
          </div>
          <div className="share-section">
            <div className="share-label">
              <span className="share-divider"></span>
              <span>💌 카카오톡으로 공유하기 👀</span>
              <span className="share-divider"></span>
            </div>
            <button className="btn-kakao-share" onClick={() => show('카카오톡 공유 기능은 준비 중이에요 🙏')}>
              <span style={{ fontSize: 16 }}>💬</span>
              <span>카카오톡으로 보내기</span>
            </button>
          </div>
        </div>
      </main>
      <div className="bottom-bar send-bar">
        <button className="btn-green-solid" onClick={() => navigate('/')}>
          <span>처음으로 돌아가기</span>
        </button>
      </div>
    </section>
  )
}
