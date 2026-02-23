import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the SDK using the API Key from the Environment (.env)
const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

export async function POST(req: Request) {
 try {
 if (!apiKey) {
 return NextResponse.json(
 { error: 'システムにGEMINI_API_KEYが設定されておりません' },
 { status: 500 }
 )
 }

 const body = await req.json()
 const { messages } = body

 if (!messages || !Array.isArray(messages) || messages.length === 0) {
 return NextResponse.json({ error: 'メッセージ配列が空であるか、messagesパラメータが不足しております' }, { status: 400 })
 }

 // Select an appropriate model (gemini-2.5-flash is a fast, intelligent model suitable for chatbots)
 const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

 // Extract the last message to use as new input for the AI
 const currentMessage = messages[messages.length - 1].parts[0].text
 // The remaining messages will be pushed into the Chat Session's History Context
 const history = messages.slice(0, -1)

 // Start a chat stream with context (history)
 const chat = model.startChat({ history })

 // 🚀 Call Gemini API to generate content
 const result = await chat.sendMessage(currentMessage)
 const response = await result.response
 const text = response.text()

 // Return successful results to the Frontend
 return NextResponse.json({ reply: text })

 } catch (error) {
 console.error('Gemini API Error:', error)
 return NextResponse.json(
 { error: 'Failed to generate content' },
 { status: 500 }
 )
 }
}