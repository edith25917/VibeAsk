import { z } from 'zod'
import got from 'got'

const searchSchema = z.object({
    query: z.string().describe('The search query to look up on the web')
})

export const webSearchToolDefinition = {
    name: 'web_search',
    description: 'Search the web for current information about a topic',
    parameters: searchSchema
}

export const webSearch = async ({ query }: z.infer<typeof searchSchema>) => {
    try {
        // Using DuckDuckGo Instant Answer API
        const response = await got(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`).json() as any

        if (response.Abstract) {
            return {
                success: true,
                data: {
                    abstract: response.Abstract,
                    source: response.AbstractSource,
                    url: response.AbstractURL,
                    related_topics: response.RelatedTopics?.slice(0, 3) || []
                }
            }
        } else if (response.RelatedTopics && response.RelatedTopics.length > 0) {
            return {
                success: true,
                data: {
                    abstract: "No direct answer found, but here are related topics:",
                    related_topics: response.RelatedTopics.slice(0, 5)
                }
            }
        } else {
            return {
                success: false,
                error: "No relevant information found for this query"
            }
        }
    } catch (error) {
        return {
            success: false,
            error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}
