import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useToast } from '../hooks/useToast'

export default function Profile() {
  const navigate = useNavigate()
  const { show } = useToast()
  const locked = (label: string) => show(`${label} 기능은 준비 중이에요 🔒`)

  const raw = localStorage.getItem('culetter_user')
  const user = raw ? JSON.parse(raw) as { id: number; nickname: string; email: string } : null

  const handleLogout = () => {
    localStorage.removeItem('culetter_access_token')
    localStorage.removeItem('culetter_refresh_token')
    localStorage.removeItem('culetter_user')
    show('로그아웃되었어요 👋')
    setTimeout(() => navigate('/login'), 600)
  }

  return (
    <section className="page active" id="page-profile">
      <Header right="back" />
      <main className="profile-main">
        <div className="profile-cluster">
          <h1 className="profile-title">내 정보</h1>

          <div className="profile-card">
            <div className="profile-avatar" aria-hidden>
              <svg viewBox="0 0 40 40" fill="currentColor" style={{ width: 30, height: 30 }}>
                <circle cx="20" cy="15" r="7"/>
                <path d="M20 24c-7.2 0-13 4.2-13 9.5V36h26v-2.5C33 28.2 27.2 24 20 24z"/>
              </svg>
            </div>
            <div className="profile-info">
              <p className="profile-name">{user?.nickname ?? '알 수 없음'}</p>
              <p className="profile-email">{user?.email ?? ''}</p>
            </div>
          </div>

          <div className="profile-section">
            <p className="profile-section-title">내 편지</p>
            <div className="profile-list">
              <button className="profile-list-item locked" onClick={() => locked('보낸 편지함')}>
                <span className="item-icon item-icon-green">📬</span>
                <span className="item-body">
                  <span className="item-title">보낸 편지함</span>
                  <span className="item-sub">내가 보낸 편지를 확인해요</span>
                </span>
                <span className="item-arrow">🔒</span>
              </button>
              <div className="profile-list-divider"></div>
              <button className="profile-list-item locked" onClick={() => locked('임시저장')}>
                <span className="item-icon item-icon-yellow">💾</span>
                <span className="item-body">
                  <span className="item-title">임시저장 편지</span>
                  <span className="item-sub">저장된 편지가 있어요</span>
                </span>
                <span className="item-arrow">🔒</span>
              </button>
            </div>
          </div>

          <button
            className="profile-logout"
            onClick={handleLogout}
          >로그아웃</button>
        </div>
        <button className="profile-withdraw" onClick={() => show('회원 탈퇴 기능은 준비 중이에요')}>
          회원가입 탈퇴
        </button>
      </main>
    </section>
  )
}
