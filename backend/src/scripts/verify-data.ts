// Verify sample data in database
// Run with: npm run verify

import 'dotenv/config'
import { supabase } from '../lib/supabase'

// Type definitions for joined data
interface ApplicationWithRelations {
  id: string
  status: string
  users?: { full_name: string }
  tasks?: { title: string }
}

interface TransactionWithRelations {
  id: string
  amount: number
  platform_fee: number
  worker_payout: number
  status: string
  client?: { full_name: string }
  worker?: { full_name: string }
  tasks?: { title: string }
}

async function verifyData() {
  console.log('🔍 Verifying database data...\n')

  try {
    // 1. Check users
    console.log('👥 Users:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })

    if (usersError) {throw usersError}

    users?.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name} (${user.email})`)
      console.log(`      Role: ${user.role}`)
      console.log(`      ID: ${user.id}`)
      console.log('')
    })

    // 2. Check tasks
    console.log('📋 Tasks:')
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })

    if (tasksError) {throw tasksError}

    tasks?.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.title}`)
      console.log(`      Category: ${task.category}`)
      console.log(`      Amount: $${task.amount}`)
      console.log(`      Status: ${task.status}`)
      console.log(`      ID: ${task.id}`)
      console.log('')
    })

    // 3. Check applications
    console.log('📝 Applications:')
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select(`
        *,
        tasks (title),
        users!applications_worker_id_fkey (full_name)
      `)
      .order('created_at', { ascending: true })

    if (applicationsError) {throw applicationsError}

    applications?.forEach((app: ApplicationWithRelations, index) => {
      console.log(`   ${index + 1}. ${app.users?.full_name} → ${app.tasks?.title}`)
      console.log(`      Status: ${app.status}`)
      console.log(`      ID: ${app.id}`)
      console.log('')
    })

    // 4. Check transactions
    console.log('💰 Transactions:')
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        tasks (title),
        client:users!transactions_client_id_fkey (full_name),
        worker:users!transactions_worker_id_fkey (full_name)
      `)
      .order('created_at', { ascending: true })

    if (transactionsError) {throw transactionsError}

    transactions?.forEach((tx: TransactionWithRelations, index) => {
      console.log(`   ${index + 1}. ${tx.client?.full_name} → ${tx.worker?.full_name}`)
      console.log(`      Task: ${tx.tasks?.title}`)
      console.log(`      Amount: $${tx.amount} (Fee: $${tx.platform_fee}, Payout: $${tx.worker_payout})`)
      console.log(`      Status: ${tx.status}`)
      console.log(`      ID: ${tx.id}`)
      console.log('')
    })

    // 5. Summary statistics
    console.log('📊 Database Statistics:')
    console.log(`   Total Users: ${users?.length || 0}`)
    console.log(`   Total Tasks: ${tasks?.length || 0}`)
    console.log(`      - Published: ${tasks?.filter(t => t.status === 'published').length || 0}`)
    console.log(`      - Draft: ${tasks?.filter(t => t.status === 'draft').length || 0}`)
    console.log(`   Total Applications: ${applications?.length || 0}`)
    console.log(`      - Pending: ${applications?.filter(a => a.status === 'pending').length || 0}`)
    console.log(`      - Accepted: ${applications?.filter(a => a.status === 'accepted').length || 0}`)
    console.log(`   Total Transactions: ${transactions?.length || 0}`)

    console.log('\n✅ Data verification completed!\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  }
}

verifyData()
