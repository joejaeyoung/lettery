type Props = { show: boolean }

export default function LoadingOverlay({ show }: Props) {
  return (
    <div className={`loading-overlay${show ? ' show' : ''}`}>
      <div className="seal-stage">
        <span className="seal-particle">☘️</span>
        <span className="seal-particle">✨</span>
        <span className="seal-particle">🌿</span>
        <span className="seal-particle">✨</span>
        <span className="seal-particle">💚</span>
        <span className="seal-particle">☘️</span>
        <div className="seal-env-back"></div>
        <div className="seal-paper"></div>
        <div className="seal-env-front"></div>
        <div className="seal-env-flap"></div>
        <div className="seal-wax">C</div>
      </div>
      <div className="seal-text">
        <p className="seal-title">
          봉투를 봉인하는 중
          <span className="dots"><span>.</span><span>.</span><span>.</span></span>
        </p>
        <p className="seal-sub">소중한 마음을 정성껏 담고 있어요 🌿</p>
      </div>
    </div>
  )
}
