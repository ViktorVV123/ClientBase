import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cemtccfulgwewdptkukt.supabase.co';
const supabaseAnonKey = 'sb_publishable_JIjdKk8WElQRLsIx4IC0Sg_TS1cB-6T';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
