import { NextResponse } from 'next/server';
import { clearDemoData, injectDemoData } from '@/app/actions/demo';

export async function GET() {
    try {
        await injectDemoData();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        // Read the fs log if it exists
        let insertErr = null;
        try { insertErr = require('fs').readFileSync('insert_error.txt', 'utf8') } catch (e) { }
        return NextResponse.json({ success: false, error: error.message, stack: error.stack, insertError: insertErr });
    }
}
