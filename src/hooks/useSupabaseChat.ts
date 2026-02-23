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

    // Load initial messages when a company is selected.
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
                .order('created_at', { ascending: true }); // Oldest messages at the top to allow scrolling to the newest messages at the bottom.

            if (!error && data) {
                setMessages(data);
            }
        };

        fetchInitialMessages();
    }, [companyId]);

    // Set up Realtime Channel to capture newly added messages.
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
                    // Upon receiving a new message payload, append it to the current list.
                    setMessages((prev) => [...prev, payload.new]);
                }
            )
            .subscribe();

        // Cleanup: unsubscribe from the channel when the component unmounts or companyId changes.
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [companyId]);

    // Helper function to send a message.
    const sendMessage = async (payload: { company_id: string, content: string, sender_name: string, sender_role: string, file_data?: any }) => {
        if (!payload.content && !payload.file_data) return { error: new Error("メッセージが空でございます") };

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return { error: new Error("認証されておりません") };

        const { data: userProfile } = await supabase.from('users').select('tenant_id').eq('id', userData.user.id).single();

        const newMsg = {
            tenant_id: userProfile?.tenant_id,
            company_id: payload.company_id,
            sender_id: userData.user.id,
            sender_name: payload.sender_name,
            sender_role: payload.sender_role,
            content: payload.content,
            // (If our messages database has a file_data/file_url column, we would attach it here)
            // file_url: payload.file_data?.url || null
        };

        const { data, error } = await supabase.from('messages').insert(newMsg).select().single();

        return { data, error };
    };

    return { messages, setMessages, sendMessage, currentUserId };
}