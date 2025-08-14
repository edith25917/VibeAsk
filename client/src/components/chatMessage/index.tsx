import React from 'react'
import './index.css'
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface Message {
    role: 'user' | 'assistant'
    hasImg: boolean
    content: string
    timestamp: Date
    toolCalls?: any[]
    toolResults?: any[]
}

interface ChatMessageProps {
    message: Message
    className?: string
}

function isImageHref(href?: string) {
    if (!href) return false;
    try {
        const u = new URL(href);
        // 1) Azure/簽名網址常帶 rsct=image/png 之類
        const ct = u.searchParams.get("rsct");
        if (ct && /^image\//i.test(ct)) return true;
        // 2) 常見副檔名
        if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(u.pathname)) return true;
        return false;
    } catch {
        return false;
    }
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, className = '' }) => {
    const isUser = message.role === 'user'
    const hasToolCalls = message.toolCalls && message.toolCalls.length > 0

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const renderToolCalls = () => {
        if (!hasToolCalls) return null
        return (
            <div className="tool-calls">
                {message.toolCalls?.map((toolCall, index) => {
                    return (
                        <div key={index} className="tool-call">
                            <div className="tool-header">
                                <span className="tool-icon">🔧</span>
                                <span className="tool-name">{toolCall.function.name}</span>
                            </div>
                            <div className="tool-args">
                                <strong>Arguments:</strong> {JSON.stringify(toolCall.function.arguments, null, 2)}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    const renderToolResults = () => {
        if (!message.toolResults || message.toolResults.length === 0) return null

        return (
            <div className="tool-results">
                {message.toolResults.map((result, index) => {
                    return (
                        <div key={index} className="tool-result">
                            <div className="result-header">
                                <span className="result-icon">✅</span>
                                <span className="result-label">Tool Result</span>
                            </div>
                            <div className="result-content">
                                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    const renderContent = (message: Message) => {
        if (message.hasImg) {
            // const html = mdImageToHtml(message.content)
            // return <div className="message-text" dangerouslySetInnerHTML={{ __html: html }} />
        }
        return <div className="message-text">
            {message.content}
        </div>
    }



    return (
        <div className={`message ${isUser ? 'user-message' : 'assistant-message'} ${className}`}>
            <div className="message-avatar">
                {isUser ? '👤' : '🤖'}
            </div>
            <div className="message-content">
                <div className="message-header">
                    <span className="message-role">
                        {isUser ? 'You' : 'AI Assistant'}
                    </span>
                    <span className="message-time">
                        {formatTime(message.timestamp)}
                    </span>
                </div>

                {message.content && (
                    <div className="message-text">
                        <ReactMarkdown
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                a: ({ href, children }) =>
                                    isImageHref(href)
                                        ? (
                                            <img
                                                src={href!}
                                                alt={String(children)}
                                                loading="lazy"
                                                decoding="async"
                                                style={{ maxWidth: "100%", height: "auto" }}
                                            />
                                        )
                                        : (
                                            <a href={href!} target="_blank" rel="noreferrer">
                                                {children}
                                            </a>
                                        ),
                                img: (props) => (
                                    <img {...props} loading="lazy" decoding="async" style={{ maxWidth: "100%", height: "auto" }} />
                                ),
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}

                {renderToolCalls()}
                {renderToolResults()}
            </div>
        </div>
    )
}

export default ChatMessage
