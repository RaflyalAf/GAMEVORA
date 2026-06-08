import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://meruqlvbymsaeaxybxaz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_JpMK5MzO-awEkOOvr7t-xg_bBkobHLf'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
