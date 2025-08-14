// server/server.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { runAgent } from './src/agent'
import { tools } from './src/tools'
import { openai } from './src/ai'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body

        if (!message) {
            return res.status(400).json({ error: 'Message is required' })
        }

        const response = await runAgent({ userMessage: message, tools })

        res.json({
            success: true,
            messages: response,
            lastMessage: response[response.length - 1]
        })
    } catch (error) {
        console.error('Chat error:', error)
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// SSE endpoint for vibe asking questions (auto-completion)
app.post('/api/vibe-ask', async (req, res) => {
    const { question, mode = 'analysis', position } = req.body

    if (!question) {
        return res.status(400).json({ error: 'Question is required' })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control')

    try {
        res.write('data: {"type": "start", "message": "Starting..."}\n\n')

        let prompt: string
        let systemMessage: string

        if (mode === 'completion') {
            // Auto-completion mode
            systemMessage = `You are an intelligent auto-completion assistant. Your task is to continue the user's question naturally and helpfully. 
            
            Rules:
            1. Continue the question in a natural, conversational way
            2. Keep the completion concise (1-2 sentences max)
            3. Maintain the same tone and style as the user's input
            4. Don't repeat what the user has already written
            5. Focus on completing the thought or question
            6. Respond in English only
            
            User's partial question: "${question}"
            Cursor position: ${position}
            
            Continue the question naturally:`

            prompt = `Continue this question naturally: "${question}"`
        } else {
            // Analysis mode
            systemMessage = `You are an intelligent question analysis assistant, helping users refine and optimize their questions. Please answer in English and stream suggestions in real time.`

            prompt = `Analyze this question and provide suggestions for improvement: "${question}"`
        }

        const stream = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: systemMessage
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            stream: true,
            max_tokens: mode === 'completion' ? 100 : 500,
            temperature: mode === 'completion' ? 0.3 : 0.7
        })

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
                res.write(`data: {"type": "content", "text": "${content.replace(/"/g, '\\"')}"}\n\n`)
            }
        }

        res.write('data: {"type": "complete", "message": "Complete"}\n\n')
        res.end()

    } catch (error) {
        console.error('Vibe ask error:', error)
        res.write(`data: {"type": "error", "message": "Error: ${error instanceof Error ? error.message : 'Unknown error'}"}\n\n`)
        res.end()
    }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    console.log(`Frontend will be available on http://localhost:3000`)
})