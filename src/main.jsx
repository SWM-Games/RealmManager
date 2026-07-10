import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const SAVE_KEY = "realm_manager_v2"

// Crash reporter — turns the white-screen-of-death into a readable, copyable
// report (error + component stack + the current save blob). Critical on mobile,
// where there's no console: the "Copy report" button is the only practical way
// to get a save + stack trace off the device. A render error anywhere in <App/>
// lands here instead of unmounting the whole tree to a blank page.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null, copied: false }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    this.setState({ error, info })
    try { console.error("Realm Manager crash:", error, info) } catch { /* noop */ }
  }
  buildReport() {
    let save = null
    try { save = localStorage.getItem(SAVE_KEY) } catch { /* private mode */ }
    const e = this.state.error
    return JSON.stringify({
      message: e && (e.message || String(e)),
      stack: e && e.stack,
      componentStack: this.state.info && this.state.info.componentStack,
      save,
    }, null, 2)
  }
  copyReport = async () => {
    const report = this.buildReport()
    try {
      await navigator.clipboard.writeText(report)
      this.setState({ copied: true })
    } catch {
      // Clipboard API unavailable — fall back to selecting the textarea so the
      // user can long-press → Copy manually.
      const ta = document.getElementById("rm-crash-report")
      if (ta) { ta.focus(); ta.select() }
      this.setState({ copied: false })
    }
  }
  render() {
    if (!this.state.error) return this.props.children
    const report = this.buildReport()
    const msg = this.state.error.message || String(this.state.error)
    return (
      <div style={{
        position: "fixed", inset: 0, overflowY: "auto", zIndex: 9999,
        background: "#E9E1CE", color: "#23201A", padding: "24px 16px",
        fontFamily: "'Alegreya Sans', system-ui, sans-serif",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontFamily: "'IM Fell English SC', serif", fontWeight: 900, fontSize: 22, color: "#7E2D26", marginBottom: 6 }}>
            Something broke
          </div>
          <div style={{ fontSize: 13, color: "#4A4335", lineHeight: 1.55, marginBottom: 14 }}>
            The game hit an error while drawing the screen. Your save is not lost. Tap
            <b> Copy report</b> and paste it to Claude — it includes the error and your
            save so the bug can be reproduced and fixed.
          </div>

          <div style={{ padding: "10px 12px", borderRadius: 3, background: "rgba(126,45,38,0.08)", border: "1px solid rgba(126,45,38,0.35)", marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#7E2D26", marginBottom: 3 }}>ERROR</div>
            <div style={{ fontSize: 12, color: "#4A4335", wordBreak: "break-word", fontFamily: "monospace" }}>{msg}</div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <button onClick={this.copyReport}
              style={{ flex: 1, minWidth: 140, padding: "12px 0", borderRadius: 3, border: "none", cursor: "pointer",
                background: "#40614F", color: "#F0E8D5", fontFamily: "'IM Fell English SC', serif", fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>
              {this.state.copied ? "Copied ✓" : "Copy report"}
            </button>
            <button onClick={() => window.location.reload()}
              style={{ flex: 1, minWidth: 140, padding: "12px 0", borderRadius: 3, border: "1px solid rgba(60,52,38,0.3)", cursor: "pointer",
                background: "rgba(60,52,38,0.06)", color: "#4A4335", fontFamily: "'Alegreya Sans', sans-serif", fontWeight: 700, fontSize: 13 }}>
              Reload
            </button>
          </div>
          {this.state.copied && (
            <div style={{ fontSize: 11, color: "#40614F", marginBottom: 12 }}>Copied to clipboard — paste it into the chat with Claude.</div>
          )}

          <div style={{ fontSize: 10, color: "#6E6350", marginBottom: 4 }}>
            If the button didn't work, long-press the box below → Select all → Copy:
          </div>
          <textarea id="rm-crash-report" readOnly value={report}
            onFocus={e => e.target.select()}
            style={{ width: "100%", height: 180, boxSizing: "border-box", fontSize: 11, fontFamily: "monospace",
              padding: 10, borderRadius: 3, border: "1px solid rgba(60,52,38,0.3)", background: "rgba(60,52,38,0.04)", color: "#4A4335", resize: "vertical" }}/>
        </div>
      </div>
    )
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
