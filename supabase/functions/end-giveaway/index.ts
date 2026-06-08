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

    const { giveaway_id } = await req.json()
    if (!giveaway_id) throw new Error('giveaway_id is required')

    const { data: giveaway, error: gErr } = await supabaseClient
      .from('giveaways')
      .select('*, games(title)')
      .eq('id', giveaway_id)
      .single()

    if (gErr || !giveaway) throw new Error('Giveaway not found')
    if (giveaway.status !== 'active') throw new Error('Giveaway is not active')

    const { data: entries, error: eErr } = await supabaseClient
      .from('giveaway_entries')
      .select('*, profiles(username, full_name)')
      .eq('giveaway_id', giveaway_id)

    if (eErr) throw new Error('Failed to fetch entries')
    if (!entries?.length) throw new Error('No entries in this giveaway')

    const count = Math.min(giveaway.winner_count, entries.length)
    const shuffled = [...entries].sort(() => Math.random() - 0.5)
    const winners = shuffled.slice(0, count)

    for (const winner of winners) {
      await supabaseClient.from('library').upsert({
        user_id: winner.user_id,
        game_id: giveaway.game_id,
        status: 'approved',
        is_giveaway: true,
      }, { onConflict: 'user_id, game_id' })

      await supabaseClient.from('vault_notifications').insert([{
        user_id: winner.user_id,
        title: '🎉 You Won a Giveaway!',
        message: `Selamat! Kamu memenangkan ${giveaway.games?.title || 'Game'} dari giveaway "${giveaway.title}". Game sudah masuk ke Vault kamu!`,
      }])
    }

    await supabaseClient.from('giveaways').update({ status: 'ended' }).eq('id', giveaway_id)

    // Send Discord notification
    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_GIVEAWAY') || Deno.env.get('DISCORD_WEBHOOK_NEW_GAME')
    if (webhookUrl) {
      const winnerNames = winners.map(w => w.profiles?.username || w.profiles?.full_name || 'User').join(', ')
      const discordPayload = {
        content: '@everyone',
        allowed_mentions: { parse: ['everyone'] },
        embeds: [{
          title: '🎉 GIVEAWAY WINNER! 🎉',
          description: [
            `**${giveaway.title}**`,
            '',
            `🏆 **Winner${winners.length > 1 ? 's' : ''}:** ${winnerNames}`,
            `🎮 **Game:** ${giveaway.games?.title || 'Unknown'}`,
            `👥 **Total Peserta:** ${entries.length}`,
            '',
            '✅ Game sudah otomatis masuk ke library pemenang!',
          ].join('\n'),
          color: 0xFFD700,
          timestamp: new Date().toISOString(),
          footer: { text: 'GAMEVORA' },
        }],
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
      })
    }

    return new Response(JSON.stringify({ success: true, winners: winners.map(w => w.user_id), count }), {
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
