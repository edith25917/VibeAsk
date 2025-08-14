import { useState, useRef, useEffect } from 'react'
import ChatMessage, { type Message } from './components/chatMessage'
import Header from './components/header'
import './App.css'
import VibeAsking from './components/vibeAsking'


function App() {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const sendMessage = async (message: string) => {
        if (!message.trim()) return

        const userMessage: Message = {
            role: 'user',
            content: message,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            })

            const data = await response.json() as any

            if (data.success) {
                const allMessages = data.messages.map((msg: any, idx: any) => {
                    return ({
                        role: msg.role as 'user' | 'assistant',
                        hasImg: data.messages[idx - 2]?.tool_calls?.[0].function.name === "generate_image",
                        content: msg.content || '',
                        timestamp: new Date(),
                        toolCalls: msg.tool_calls,
                        toolResults: msg.tool_results
                    })
                }).filter((msg: any) => msg.role !== 'tool' && !msg.toolCalls)

                setMessages(allMessages)
            } else {
                throw new Error(data.error || 'Failed to get response')
            }
        } catch (error) {
            const errorMessage: Message = {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleVibeQuestion = (question: string) => {
        sendMessage(question)
    }


    return (
        <div className="app">
            <Header />
            <div className="chat-container">
                <div className="messages-container">
                    {messages.length === 0 && (
                        <div className="welcome-message">
                            <h2>🤖 Welcome to Vibe Ask</h2>
                            <p>I'm your AI assistant with powerful tools. I can:</p>
                            <ul>
                                <li>🔍 Search the web for current information</li>
                                <li>🌤️ Get weather updates for any location</li>
                                <li>🎨 Generate images from descriptions</li>
                                <li>📱 Browse Reddit content</li>
                                <li>😄 Tell you dad jokes</li>
                            </ul>
                            <p>Try asking me anything!</p>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <ChatMessage
                            key={index}
                            message={message}
                            className={index === messages.length - 1 ? 'slide-up' : 'fade-in'}
                        />
                    ))}

                    {isLoading && (
                        <div className="loading-message">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <p>AI is thinking...</p>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="input-section">
                    <VibeAsking
                        onQuestionSubmit={handleVibeQuestion}
                        disabled={isLoading}
                    />
                </div>
            </div>
        </div>
    )
}

export default App
