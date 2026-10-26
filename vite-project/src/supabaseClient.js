import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ewohghgmgczzrdurbtge.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_on10I6EnDuHPaNcI796EvA_oo98fSLT'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)