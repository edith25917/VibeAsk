import React, { useState, useRef, useEffect } from 'react'
import './index.css'

interface VibeAskingProps {
    onQuestionSubmit: (question: string) => void
    disabled?: boolean
}

const VibeAsking: React.FC<VibeAskingProps> = ({ onQuestionSubmit, disabled = false }) => {
    const [question, setQuestion] = useState('')
    const [completion, setCompletion] = useState('')
    const [isCompleting, setIsCompleting] = useState(false)
    const [showCompletion, setShowCompletion] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const timeoutRef = useRef<number | null>(null)

    const getCompletion = async (currentQuestion: string, position: number) => {
        if (currentQuestion.length < 3) {
            setCompletion('')
            setShowCompletion(false)
            return
        }

        setIsCompleting(true)
        setCompletion('')
        setShowCompletion(true)

        try {
            const response = await fetch('/api/vibe-ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: currentQuestion,
                    position: position,
                    mode: 'completion'
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            while (reader) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6))

                            switch (data.type) {
                                case 'start':
                                    setCompletion('')
                                    break
                                case 'content':
                                    setCompletion(prev => prev + data.text)
                                    break
                                case 'complete':
                                    break
                                case 'error':
                                    setCompletion(`Error: ${data.message}`)
                                    break
                            }
                        } catch (parseError) {
                            console.error('Failed to parse SSE data:', parseError)
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Completion error:', error)
            setCompletion(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsCompleting(false)
        }
    }

    const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newQuestion = e.target.value
        const newPosition = e.target.selectionStart
        setQuestion(newQuestion)

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            getCompletion(newQuestion, newPosition)
        }, 200)
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        } else if (e.key === 'Tab' && showCompletion && completion) {
            e.preventDefault()
            acceptCompletion()
        }
    }

    const handleSubmit = () => {
        if (question.trim() && !disabled) {
            onQuestionSubmit(question.trim())
            setQuestion('')
            setCompletion('')
            setShowCompletion(false)
        }
    }

    const acceptCompletion = () => {
        if (completion && textareaRef.current) {
            const newQuestion = question + completion
            setQuestion(newQuestion)
            setCompletion('')
            setShowCompletion(false)

            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus()
                    textareaRef.current.setSelectionRange(newQuestion.length, newQuestion.length)
                }
            }, 0)
        }
    }

    const rejectCompletion = () => {
        setCompletion('')
        setShowCompletion(false)
        textareaRef.current?.focus()
    }

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return (
        <div className="vibe-asking-container">
            <div className="question-input-section">
                <div className="textarea-wrapper">
                    <textarea
                        ref={textareaRef}
                        value={question}
                        onChange={handleQuestionChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your question here... AI will suggest completions as you type"
                        disabled={disabled}
                        className="question-textarea"
                        rows={3}
                    />
                    {showCompletion && completion && (
                        <div className="completion-overlay">
                            <span className="completion-prefix">{question}</span>
                            <span className="completion-text">{completion}</span>
                            {isCompleting && (
                                <span className="completing-indicator">
                                    <span className="typing-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="input-actions">
                    <button
                        onClick={handleSubmit}
                        disabled={!question.trim() || disabled}
                        className="submit-button"
                    >
                        {disabled ? 'AI Thinking...' : 'Send'}
                    </button>

                    {showCompletion && completion && !isCompleting && (
                        <div className="completion-actions">
                            <button
                                onClick={acceptCompletion}
                                className="accept-button"
                                title="Press Tab to accept"
                            >
                                Accept (Tab)
                            </button>
                            <button
                                onClick={rejectCompletion}
                                className="reject-button"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default VibeAsking