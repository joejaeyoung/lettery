import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { LOGO_SVG } from '../data'
import { api } from '../api/client'
import { useToast } from '../hooks/useToast'

export default function Login() {
  const navigate = useNavigate()
  const { show } = useToast()
  const [loading, setLoading] = useState(false)

  const handleKakaoLogin = async () => {
    setLoading(true)
    try {
      const data = await api.mockLogin()
      localStorage.setItem('culetter_access_token', data.accessToken)
      localStorage.setItem('culetter_refresh_token', data.refreshToken)
      navigate('/select')
    } catch {
      show('로그인에 실패했어요 😢')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page active" id="page-login">
      <Header right="back" />
      <main className="login-wrap">
        <div className="login-card">
          <div className="login-brand">
            <img className="login-brand-logo" src={LOGO_SVG} alt="Culetter" />
            <div className="login-brand-texts">
              <div className="login-brand-title">Culetter</div>
              <div className="login-brand-sub">마음을 전할 때 큐레터가 함께해요</div>
            </div>
          </div>
          <div className="login-form-wrap">
            <div className="login-form-inner">
              <div className="login-form-title">로그인</div>
              <div className="login-form-body">
                <div className="login-hint">3초만에 로그인하기</div>
                <button className="btn-kakao" onClick={handleKakaoLogin} disabled={loading}>
                  <span style={{ fontSize: 16 }}>💬</span>
                  <span>{loading ? '로그인 중...' : '카카오로 시작하기'}</span>
                </button>
              </div>
            </div>
            <div className="login-terms">
              로그인 시 <a>서비스 이용약관</a> 및 <a>개인정보처리방침</a>에 동의하게 됩니다.
            </div>
          </div>
        </div>
      </main>
    </section>
  )
}
