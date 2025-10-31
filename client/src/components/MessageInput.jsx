import React, { useState } from 'react'

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Send a message..."
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || text.trim().length === 0}>Send</button>
    </form>
  )
}


