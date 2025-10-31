import React from 'react'

export default function MessageBubble({ role, content, loading = false, deletable = false, onDelete }) {
  const isUser = role === 'user'
  return (
    <div className={`message-row ${isUser ? 'from-user' : 'from-assistant'}`}>
      <div className="avatar">{isUser ? '🧑' : '🤖'}</div>
      <div className="bubble">
        {loading ? <span className="dots"><span>.</span><span>.</span><span>.</span></span> : content}
        {deletable && !loading && (
          <button className="bubble-delete" onClick={onDelete} title="Delete message">✕</button>
        )}
      </div>
    </div>
  )
}


