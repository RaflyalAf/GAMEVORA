// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import webPush from 'https://esm.sh/web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required secrets: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Edge Function secrets')
    }
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('Missing required secrets: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in Edge Function secrets')
    }

    webPush.setVapidDetails('mailto:admin@gamevora.com', vapidPublicKey, vapidPrivateKey)

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

    const body = await req.json()
    const { title, message, target_user_id } = body

    if (!title || !message) {
      throw new Error('Missing required fields: title and message are required')
    }

    let query = supabaseClient.from('push_subscriptions').select('*')
    if (target_user_id) {
      query = query.eq('user_id', target_user_id)
    }

    const { data: subscriptions, error } = await query
    if (error) throw error

    const payload = JSON.stringify({ title, message })

    const sendPromises = (subscriptions || []).map(async (sub) => {
      try {
        if (!sub.endpoint || !sub.auth_key || !sub.p256dh_key) {
          console.error('Invalid subscription data, skipping:', sub.id)
          return
        }

        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { auth: sub.auth_key, p256dh: sub.p256dh_key },
        }

        await webPush.sendNotification(pushSubscription, payload)
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('Error sending push to', sub.endpoint, err)
        }
      }
    })

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ success: true, count: subscriptions?.length || 0 }), {
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
