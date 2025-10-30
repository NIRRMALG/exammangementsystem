// @ts-ignore
import { serve } from "https://deno.fresh.dev/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
}

// Fix: add type to req, use Deno global only for Deno runtime, and fix error type handling
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, message } = await req.json() as EmailRequest;

    // Deno global is available in Supabase Edge Functions runtime
    // @ts-ignore
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    // @ts-ignore
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL');

    if (!SENDGRID_API_KEY || !FROM_EMAIL) {
      throw new Error('Missing email configuration');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: { email: FROM_EMAIL },
        subject: subject,
        content: [
          {
            type: 'text/plain',
            value: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});