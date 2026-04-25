import { useNavigate } from 'react-router-dom'
import { LOGO_SVG, AVATAR_SVG } from '../data'

type HeaderProps = {
  right?: 'back' | 'login' | 'avatar' | 'write-actions' | 'none'
  onDraftClick?: () => void
  onDoneClick?: () => void
}

export default function Header({ right = 'avatar', onDraftClick, onDoneClick }: HeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="header">
      <div className="logo" onClick={() => navigate('/')}>
        <img src={LOGO_SVG} alt="Culetter 로고" />
        <span className="logo-text">Culetter</span>
      </div>
      {right === 'back' && (
        <button className="header-btn" onClick={() => navigate('/')}>뒤로</button>
      )}
      {right === 'login' && (
        <button className="header-btn" onClick={() => navigate('/login')}>로그인</button>
      )}
      {right === 'avatar' && (
        <img className="header-avatar" src={AVATAR_SVG} alt="프로필" onClick={() => navigate('/profile')} />
      )}
      {right === 'write-actions' && (
        <div className="write-header-actions">
          <button className="btn-draft locked" onClick={onDraftClick}>
            <span>임시저장</span>
            <span className="lock-icon">🔒</span>
          </button>
          <button className="btn-done" onClick={onDoneClick}>
            <span>완료</span>
            <span className="arrow arrow-right-sm" style={{ borderColor: 'white' }}></span>
          </button>
          <img className="header-avatar" src={AVATAR_SVG} alt="프로필" onClick={() => navigate('/profile')} />
        </div>
      )}
    </header>
  )
}
