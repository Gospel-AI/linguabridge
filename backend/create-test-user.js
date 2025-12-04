import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function createUser() {
  // サインアップ
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'info@gospel-ai.tech',
    password: 'test1234',
    options: {
      data: {
        full_name: 'Gospel AI Worker',
        role: 'worker'
      }
    }
  })

  if (signUpError) {
    console.error('Sign up error:', signUpError)
    process.exit(1)
  }

  console.log('✅ User created successfully!')
  console.log('📧 Email:', signUpData.user.email)
  console.log('🆔 User ID:', signUpData.user.id)

  if (signUpData.session) {
    console.log('\n🔑 Access Token:')
    console.log(signUpData.session.access_token)
  } else {
    console.log('\n⚠️  Email confirmation required. Please check your email.')
  }
}

createUser()
