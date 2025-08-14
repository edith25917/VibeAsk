import { generateImageToolDefinition } from "./generateImages";
import { dadJokeToolDefinition } from "./dadJoke"
import { redditToolDefinition } from "./reddit"
import { webSearchToolDefinition } from "./webSearch"
import { weatherToolDefinition } from "./weather"

export const tools = [generateImageToolDefinition, redditToolDefinition, dadJokeToolDefinition, webSearchToolDefinition, weatherToolDefinition]