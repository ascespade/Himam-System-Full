/**
 * Supabase Edge Function for Auto Sync
 * Handles real-time sync events from Supabase
 * 
 * Deploy: supabase functions deploy autosync
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    const { table, record, event } = await req.json()

    console.log('Auto sync event:', { table, event, recordKey: record?.key })

    // Handle settings updates
    if (table === 'settings' && record) {
      console.log('Settings updated:', record.key, '=', record.value)

      // You can add custom logic here for specific settings
      // For example, invalidate cache, notify other services, etc.
    }

    // Handle appointment updates
    if (table === 'appointments' && record) {
      console.log('Appointment updated:', record.id, record.status)

      // Sync with CRM if configured
      // This is a placeholder - implement based on your CRM requirements
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Auto sync error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})



