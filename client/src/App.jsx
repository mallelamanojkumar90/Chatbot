import React, { useEffect, useMemo, useState } from 'react'
import ChatWindow from './components/ChatWindow.jsx'
import MessageInput from './components/MessageInput.jsx'
import Sidebar from './components/Sidebar.jsx'
import { loadConversations, saveConversations } from './storage.js'

export default function App() {
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const apiBase = useMemo(() => {
    return import.meta.env.VITE_API_BASE || 'http://localhost:3001'
  }, [])

  useEffect(() => {
    const { conversations, selectedId } = loadConversations()
    if (conversations.length === 0) {
      const firstId = `c-${Date.now()}`
      const base = [{ id: 'sys-1', role: 'assistant', content: 'Hi! Ask me anything.' }]
      setConversations([{ id: firstId, title: '', messages: base }])
      setSelectedId(firstId)
    } else {
      setConversations(conversations)
      setSelectedId(selectedId || conversations[0]?.id || null)
    }
  }, [])

  useEffect(() => {
    saveConversations(conversations, selectedId)
  }, [conversations, selectedId])

  function getActive() {
    return conversations.find(c => c.id === selectedId)
  }

  function updateActiveMessages(updater) {
    setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, messages: updater(c.messages) } : c))
  }

  async function sendMessage(userText) {
    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: userText }
    const active = getActive()
    const next = active ? [...active.messages, userMsg] : [userMsg]
    updateActiveMessages(() => next)
    setIsLoading(true)
    try {
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          model: 'gpt-4o-mini'
        })
      })
      const data = await response.json()
      const assistantMsg = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data?.message?.content || ''
      }
      updateActiveMessages(prev => [...prev, assistantMsg])
    } catch (e) {
      const errorMsg = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I ran into an error.'
      }
      updateActiveMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  function handleNewChat() {
    const newId = `c-${Date.now()}`
    const base = [{ id: 'sys-1', role: 'assistant', content: 'Hi! Ask me anything.' }]
    setConversations(prev => [{ id: newId, title: '', messages: base }, ...prev])
    setSelectedId(newId)
  }

  function handleSelectChat(id) {
    setSelectedId(id)
  }

  function handleDeleteConversation(id) {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (id === selectedId) {
      const remaining = conversations.filter(c => c.id !== id)
      setSelectedId(remaining[0]?.id || null)
    }
  }

  function handleDeleteMessage(messageId) {
    updateActiveMessages(prev => prev.filter(m => m.id !== messageId))
  }

  return (
    <div className="app-container layout">
      <aside className="app-sidebar">
        <Sidebar
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelectChat}
          onNew={handleNewChat}
          onDelete={handleDeleteConversation}
        />
      </aside>
      <section className="app-content">
        <header className="app-header">
          <div className="title">ChatGPT Clone</div>
        </header>
        <main className="app-main">
          <ChatWindow
            messages={getActive()?.messages || []}
            isLoading={isLoading}
            onDeleteMessage={handleDeleteMessage}
          />
        </main>
        <footer className="app-footer">
          <MessageInput onSend={sendMessage} disabled={isLoading || !selectedId} />
        </footer>
      </section>
    </div>
  )
}


