import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useSupabaseChat(companyId: string | null) {
    const [messages, setMessages] = useState<any[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const supabase = createClient();

    // Load user
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) setCurrentUserId(data.user.id);
        });
    }, [supabase.auth]);

    // Load tin nhắn ban đầu khi chọn 1 công ty
    useEffect(() => {
        if (!companyId) {
            setMessages([]);
            return;
        }

        const fetchInitialMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: true }); // Cổ nhất xếp trên cùng để scroll xuống dưới cùng thấy tin mới nhất

            if (!error && data) {
                setMessages(data);
            }
        };

        fetchInitialMessages();
    }, [companyId]);

    // Thiết lập Realtime Channel để chớp lấy tin nhắn mới thêm vào
    useEffect(() => {
        if (!companyId) return;

        let channel: RealtimeChannel;

        // Subscribe to INSERT events on the messages table where company_id matches
        channel = supabase.channel(`custom-company-${companyId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `company_id=eq.${companyId}`
                },
                (payload) => {
                    // Bắt được payload tin nhắn mới, nhúng vào list hiện tại
                    setMessages((prev) => [...prev, payload.new]);
                }
            )
            .subscribe();

        // Cleanup: hủy đăng ký channel khi component unmount hoặc companyId đổi
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [companyId]);

    // Hàm helper để Send Message
    const sendMessage = async (payload: { company_id: string, content: string, sender_name: string, sender_role: string, file_data?: any }) => {
        if (!payload.content && !payload.file_data) return { error: new Error("Empty message") };

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return { error: new Error("Unauthorized") };

        const { data: userProfile } = await supabase.from('users').select('tenant_id').eq('id', userData.user.id).single();

        const newMsg = {
            tenant_id: userProfile?.tenant_id,
            company_id: payload.company_id,
            sender_id: userData.user.id,
            sender_name: payload.sender_name,
            sender_role: payload.sender_role,
            content: payload.content,
            // (Nếu db messages của ta có cột file_data/file_url thì ta gắn vào đây)
            // file_url: payload.file_data?.url || null
        };

        const { data, error } = await supabase.from('messages').insert(newMsg).select().single();

        return { data, error };
    };

    return { messages, setMessages, sendMessage, currentUserId };
}
