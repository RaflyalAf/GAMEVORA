// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WEBHOOKS = {
  info: Deno.env.get('DISCORD_WEBHOOK_INFO'),
  maintenance: Deno.env.get('DISCORD_WEBHOOK_MAINTENANCE'),
  new_game: Deno.env.get('DISCORD_WEBHOOK_NEW_GAME'),
  giveaway: Deno.env.get('DISCORD_WEBHOOK_GIVEAWAY'),
}

const typeColors = {
  info: 0x5865F2,
  maintenance: 0xFFA500,
  new_game: 0x00FF00,
  giveaway: 0xFFD700,
}

const typeEmojis = {
  info: '📢',
  maintenance: '🔧',
  new_game: '🎮',
  giveaway: '🎉',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, message, type } = await req.json()
    const broadcastType = type || 'info'
    const color = typeColors[broadcastType] || typeColors.info
    const emoji = typeEmojis[broadcastType] || typeEmojis.info
    const webhookUrl = WEBHOOKS[broadcastType]

    if (!webhookUrl) {
      throw new Error(`DISCORD_WEBHOOK_${broadcastType.toUpperCase()} is not configured`)
    }

    const discordPayload = {
      embeds: [{
        title: `${emoji} ${title}`,
        description: message,
        color,
        timestamp: new Date().toISOString(),
        footer: { text: 'GAMEVORA' },
      }],
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Discord webhook responded with ${res.status}: ${text}`)
    }

    return new Response(JSON.stringify({ success: true }), {
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
