import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jhsuoikzwhkrguawhlyz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impoc3VvaWt6d2hrcmd1YXdobHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzkyODEsImV4cCI6MjA5MDcxNTI4MX0.ifi4B7-9Ht356lvQlNBsxvroXMJzWeC0eGJ1VOQ-Xwg'

export const supabase = createClient(supabaseUrl, supabaseKey)