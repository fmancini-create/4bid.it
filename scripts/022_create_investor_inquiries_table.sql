-- Create investor_inquiries table for investment and collaboration requests
CREATE TABLE IF NOT EXISTS public.investor_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('investment', 'collaboration', 'partnership', 'other')),
    interested_projects TEXT[], -- Array of project IDs they're interested in
    investment_amount TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'in_progress', 'closed')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.investor_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert investor inquiries
CREATE POLICY "Public can insert investor inquiries"
ON public.investor_inquiries
FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Authenticated users can view all investor inquiries
CREATE POLICY "Authenticated can view all investor inquiries"
ON public.investor_inquiries
FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can update investor inquiries
CREATE POLICY "Authenticated can update investor inquiries"
ON public.investor_inquiries
FOR UPDATE
TO authenticated
USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_investor_inquiries_created_at ON public.investor_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investor_inquiries_status ON public.investor_inquiries(status);
