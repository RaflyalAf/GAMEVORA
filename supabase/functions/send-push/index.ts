// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import webPush from 'https://esm.sh/web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// VAPID keys
// In production, these should be stored in Supabase Edge Function Secrets
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BKN9gcHtQK7rhW0Er-NzizKLXomuPfBan-uDzwT-cCVIUeSdnlCyDxDY4P4cx5gjnslkDQvh495bv9ZcuEdtKqA'
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || 'X3me4EDHFDQCID3VSCb7DmZ4uZDSudw5-vMFodzGcrM'

webPush.setVapidDetails(
  'mailto:admin@gamevora.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { title, message, target_user_id } = await req.json()

    let query = supabaseClient.from('push_subscriptions').select('*')
    if (target_user_id) {
      query = query.eq('user_id', target_user_id)
    }

    const { data: subscriptions, error } = await query

    if (error) throw error

    const payload = JSON.stringify({ title, message })

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth_key,
          p256dh: sub.p256dh_key
        }
      }
      
      try {
        await webPush.sendNotification(pushSubscription, payload)
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription has expired or is no longer valid
          await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('Error sending push:', err)
        }
      }
    })

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ success: true, count: subscriptions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
