import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function getToken() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'info@gospel-ai.tech',
    password: 'test1234',
  })

  if (error) {
    console.error('❌ Login error:', error.message)
    process.exit(1)
  }

  console.log('✅ Login successful!')
  console.log('\n🔑 Access Token:')
  console.log(data.session.access_token)
  console.log('\n📋 Token expires at:', new Date(data.session.expires_at * 1000).toISOString())
}

getToken()
