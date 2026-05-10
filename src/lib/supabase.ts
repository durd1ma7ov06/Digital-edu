import { createClient } from '@supabase/supabase-js'

// Kodda to'g'ridan-to'g'ri kiritilgan URL va Key
const supabaseUrl = 'https://ihsjfhvvxaaezmgljdnq.supabase.co'
const supabaseAnonKey = 'sb_publishable_Tcpc6CySePsV3wWZ6Un5Jg_SK410NSI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
