-- Create chat_conversations table for AI support conversations
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_email TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('free', 'pro', 'business')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'escalated')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table for individual messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'admin', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_email ON public.chat_conversations(user_email);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON public.chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_started_at ON public.chat_conversations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations

-- Users can view their own conversations
CREATE POLICY "Users can view their own conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (user_email = auth.jwt()->>'email');

-- Users can insert their own conversations
CREATE POLICY "Users can insert their own conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (user_email = auth.jwt()->>'email');

-- Users can update their own conversations
CREATE POLICY "Users can update their own conversations"
ON public.chat_conversations
FOR UPDATE
TO authenticated
USING (user_email = auth.jwt()->>'email');

-- Super admin can view all conversations
CREATE POLICY "Super admin can view all conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (auth.jwt()->>'email' = 'f.mancini@4bid.it');

-- Super admin can update all conversations
CREATE POLICY "Super admin can update all conversations"
ON public.chat_conversations
FOR UPDATE
TO authenticated
USING (auth.jwt()->>'email' = 'f.mancini@4bid.it');

-- RLS Policies for chat_messages

-- Users can view messages from their own conversations
CREATE POLICY "Users can view their own messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
    conversation_id IN (
        SELECT id FROM public.chat_conversations
        WHERE user_email = auth.jwt()->>'email'
    )
);

-- Users can insert messages to their own conversations
CREATE POLICY "Users can insert their own messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
    conversation_id IN (
        SELECT id FROM public.chat_conversations
        WHERE user_email = auth.jwt()->>'email'
    )
);

-- Super admin can view all messages
CREATE POLICY "Super admin can view all messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (auth.jwt()->>'email' = 'f.mancini@4bid.it');

-- Super admin can insert messages to any conversation
CREATE POLICY "Super admin can insert all messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.jwt()->>'email' = 'f.mancini@4bid.it');

-- Create function to update conversation stats
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_conversations
    SET 
        message_count = message_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update conversation stats
DROP TRIGGER IF EXISTS trigger_update_conversation_stats ON public.chat_messages;
CREATE TRIGGER trigger_update_conversation_stats
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_stats();
