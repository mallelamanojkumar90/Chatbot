import React, { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble.jsx'

export default function ChatWindow({ messages, isLoading, onDeleteMessage }) {
  const listRef = useRef(null)

  useEffect(() => {
    const el = listRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, isLoading])

  return (
    <div className="chat-window" ref={listRef}>
      {messages.map(m => (
        <MessageBubble
          key={m.id}
          role={m.role}
          content={m.content}
          onDelete={() => onDeleteMessage?.(m.id)}
          deletable
        />
      ))}
      {isLoading && (
        <MessageBubble role="assistant" content="Thinking…" loading />
      )}
    </div>
  )
}


