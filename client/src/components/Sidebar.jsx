import React from 'react'

export default function Sidebar({ conversations, selectedId, onSelect, onNew, onDelete }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button className="new-chat" onClick={onNew}>+ New chat</button>
      </div>
      <div className="sidebar-list">
        {conversations.length === 0 && (
          <div className="empty">No conversations</div>
        )}
        {conversations.map(c => {
          const title = c.title || deriveTitle(c)
          const isActive = c.id === selectedId
          return (
            <div key={c.id} className={`conv-item ${isActive ? 'active' : ''}`}>
              <button className="conv-button" onClick={() => onSelect(c.id)} title={title}>
                <span className="conv-title">{title}</span>
              </button>
              <button className="conv-delete" onClick={() => onDelete(c.id)} title="Delete conversation">✕</button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

function deriveTitle(conv) {
  const firstUser = conv.messages.find(m => m.role === 'user')
  if (!firstUser) return 'New chat'
  const text = firstUser.content.trim()
  return text.length > 40 ? text.slice(0, 40) + '…' : text
}


