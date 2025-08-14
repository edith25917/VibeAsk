import { runLLM } from "./llm"
import { addMessages, getMessages, saveToolMessages } from "./memory"
import { runTool } from "./toolRunner"
import { showLoader, logMessage } from "./ui"

export const runAgent = async ({ userMessage, tools }: { userMessage: string, tools: any }) => {
    await addMessages([{ role: 'user', content: userMessage }])

    const loader = showLoader('🤔')

    while (true) {
        const history = await getMessages()
        const response = await runLLM({ messages: history, tools })
        await addMessages([response])

        if (response.content) {
            loader.stop()
            logMessage(response)
            return getMessages()
        }

        if (response.tool_calls) {
            const toolCall = response.tool_calls[0]
            logMessage(response)
            loader.update(`executing: ${toolCall.function.name}`)

            const toolResponse = await runTool(toolCall, userMessage)
            await saveToolMessages(toolCall.id, typeof toolResponse === 'string' ? toolResponse : JSON.stringify(toolResponse))
            loader.update(`done: ${toolCall.function.name}`)
        }
    }
}