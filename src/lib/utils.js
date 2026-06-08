export const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)

export function getWeeklyISO() {
  const target = new Date()
  const dayNr = (target.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000)
  return `GV-${target.getFullYear()}-W${weekNumber}`
}

export async function getCurrentWeeklyPass(supabase) {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'manual_weekly_pass')
    .maybeSingle()
  return (data?.value && data.value.trim() !== '') ? data.value.trim() : getWeeklyISO()
}
