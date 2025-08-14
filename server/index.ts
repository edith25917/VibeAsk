import 'dotenv/config'
import { addMessages, getMessages } from './src/memory'
import { runAgent } from './src/agent'
import { z } from 'zod'
import { tools } from './src/tools'

const userMessage = process.argv[2]

if (!userMessage) {
  console.error('Please provide a message')
  process.exit(1)
}


// agent: runAgent -> runLLM, runTool
const response = await runAgent({ userMessage, tools })

