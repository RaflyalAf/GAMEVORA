// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: setting } = await supabaseClient
      .from('settings')
      .select('value')
      .eq('key', 'last_new_game_broadcast')
      .maybeSingle()

    const lastBroadcast = setting?.value || '1970-01-01T00:00:00Z'

    const { count } = await supabaseClient
      .from('games')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', lastBroadcast)

    if (count < 10) {
      return new Response(JSON.stringify({ sent: false, reason: `Only ${count} new games, need 10` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const { data: newGames } = await supabaseClient
      .from('games')
      .select('title')
      .gt('created_at', lastBroadcast)
      .order('created_at', { ascending: false })

    const gameList = newGames.map(g => `• ${g.title}`).join('\n')

    const description = [
      '╔══════════════════════════╗',
      '🔥 **Game Baru Sudah Tersedia!** 🔥',
      '╚══════════════════════════╝',
      '',
      '⭐ **Daftar Game Terbaru PENTING!** ⭐',
      '',
      gameList,
      '',
      '━━━━━━━━━━━━━━━━━━━━━━',
      '⚠️ Kami tidak pernah menjual produk di Shopee, Tokopedia, atau marketplace sejenis.',
      '✅ Game hanya tersedia di website resmi kami:',
      '🌐 **https://gamevora.my.id/**',
    ].join('\n')

    const webhookUrls = {
      info: Deno.env.get('DISCORD_WEBHOOK_INFO'),
      maintenance: Deno.env.get('DISCORD_WEBHOOK_MAINTENANCE'),
      new_game: Deno.env.get('DISCORD_WEBHOOK_NEW_GAME'),
    }

    if (!webhookUrls.new_game) {
      throw new Error('DISCORD_WEBHOOK_NEW_GAME is not configured')
    }

    const discordPayload = {
      content: '@everyone',
      allowed_mentions: { parse: ['everyone'] },
      embeds: [{
        title: '🎮🕹️ GAME BARU TERSEDIA! 🕹️🎮',
        description,
        color: 0x00FF00,
        timestamp: new Date().toISOString(),
        footer: { text: 'GAMEVORA' },
      }],
    }

    const res = await fetch(webhookUrls.new_game, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Discord webhook responded with ${res.status}: ${text}`)
    }

    await supabaseClient
      .from('settings')
      .upsert({ key: 'last_new_game_broadcast', value: new Date().toISOString() })

    return new Response(JSON.stringify({ sent: true, count }), {
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
