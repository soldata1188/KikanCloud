import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GEMINI_API_KEY || ''

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

        const ai = new GoogleGenAI({ apiKey })
        const currentMessage = messages[messages.length - 1].parts[0].text
        const history = messages.slice(0, -1)
        const chat = ai.chats.create({ model: 'gemini-2.5-flash', history })
        const response = await chat.sendMessage({ message: currentMessage })
        const text = response.text

        return NextResponse.json({ reply: text })

    } catch {
        return NextResponse.json(
            { error: 'Failed to generate content' },
            { status: 500 }
        )
    }
}