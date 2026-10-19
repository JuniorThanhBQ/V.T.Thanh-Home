import { useState, useCallback } from 'react'
import { apiClient } from '../../../configs/apis'

export interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: string
}

export function useChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'chat.welcome_message',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: String(Date.now()),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          content: m.text,
        }))

      const response = await apiClient.post<{ text: string }>('/chat/message', {
        text: text.trim(),
        history,
      })

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          text: response.data.text,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } catch (err: unknown) {
      const isRateLimit = (err as { response?: { status?: number } })?.response?.status === 429
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 2),
          text: isRateLimit ? 'chat.reply_rate_limit' : 'I encountered an error trying to process your request. Please try again.',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setIsTyping(false)
    }
  }, [messages])

  return {
    isOpen,
    toggleChat,
    messages,
    inputText,
    setInputText,
    isTyping,
    sendMessage
  }
}
