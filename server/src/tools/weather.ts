import { z } from 'zod'
import got from 'got'

const weatherSchema = z.object({
    location: z.string().describe('The city name or location to get weather for'),
    units: z.enum(['metric', 'imperial']).optional().default('metric').describe('Temperature units (metric for Celsius, imperial for Fahrenheit)')
})

export const weatherToolDefinition = {
    name: 'get_weather',
    description: 'Get current weather information for a specific location',
    parameters: weatherSchema
}

export const getWeather = async ({ location, units = 'metric' }: z.infer<typeof weatherSchema>) => {
    try {
        // Using OpenWeatherMap API (free tier)
        const apiKey = process.env.OPENWEATHER_API_KEY || 'demo'
        const response = await got(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${units}&appid=${apiKey}`).json() as any

        if (response.cod === 200) {
            const tempUnit = units === 'metric' ? '°C' : '°F'
            const windUnit = units === 'metric' ? 'm/s' : 'mph'

            return {
                success: true,
                data: {
                    location: response.name,
                    country: response.sys.country,
                    temperature: `${Math.round(response.main.temp)}${tempUnit}`,
                    feels_like: `${Math.round(response.main.feels_like)}${tempUnit}`,
                    humidity: `${response.main.humidity}%`,
                    description: response.weather[0].description,
                    wind_speed: `${response.wind.speed} ${windUnit}`,
                    pressure: `${response.main.pressure} hPa`,
                    visibility: `${response.visibility / 1000} km`
                }
            }
        } else {
            return {
                success: false,
                error: `Weather data not found for ${location}`
            }
        }
    } catch (error) {
        return {
            success: false,
            error: `Weather lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}
