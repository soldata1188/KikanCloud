import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Khởi tạo SDK bằng API Key từ Environment (.env)
const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

export async function POST(req: Request) {
    try {
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Chưa cấu hình GEMINI_API_KEY trong hệ thống' },
                { status: 500 }
            )
        }

        const body = await req.json()
        const { messages } = body

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Mảng rỗng hoặc thiếu param messages' }, { status: 400 })
        }

        // Chọn Model phù hợp (gemini-2.5-flash là model tốc độ nhanh, thông minh, hợp với chatbot)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        // Extract tin nhắn cuối cùng để làm Input mới cho AI
        const currentMessage = messages[messages.length - 1].parts[0].text
        // Các tin nhắn còn lại sẽ được đẩy vào History Context của Chat Session
        const history = messages.slice(0, -1)

        // Bắt đầu một luồng chat mang theo ngữ cảnh (lịch sử)
        const chat = model.startChat({ history })

        // 🚀 Gọi Gemini API để sinh nội dung
        const result = await chat.sendMessage(currentMessage)
        const response = await result.response
        const text = response.text()

        // Trả kết quả thành công về Frontend
        return NextResponse.json({ reply: text })

    } catch (error) {
        console.error('Gemini API Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate content' },
            { status: 500 }
        )
    }
}
