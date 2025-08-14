import type OpenAI from "openai/index.mjs"
import { generateImage, generateImageToolDefinition } from './tools/generateImages'
import { reddit, redditToolDefinition } from './tools/reddit'
import { dadJoke, dadJokeToolDefinition } from './tools/dadJoke'
import { webSearch, webSearchToolDefinition } from './tools/webSearch'
import { getWeather, weatherToolDefinition } from './tools/weather'

export const runTool = async (toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall, userMessage: string) => {
    const input = {
        userMessage,
        toolArgs: JSON.parse(toolCall.function.arguments || '{}')
    }

    switch (toolCall.function.name) {
        case generateImageToolDefinition.name:
            return generateImage(input)
        case redditToolDefinition.name:
            return reddit(input)
        case dadJokeToolDefinition.name:
            return dadJoke(input)
        case webSearchToolDefinition.name:
            return webSearch(input.toolArgs)
        case weatherToolDefinition.name:
            return getWeather(input.toolArgs)
        default:
            throw new Error(`Unknown tool: ${toolCall.function.name}`)
    }
}