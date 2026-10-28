import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const configured = Boolean(url && key && !url.includes('your-project'))
const db = configured ? createClient(url, key) : null

const fail = (error, what) => { if (error) throw new Error(`Could not ${what}: ${error.message}`) }

export async function listIssues() {
  const { data, error } = await db.from('issues').select('*').order('created_at', { ascending: false })
  fail(error, 'load issues')
  return data
}
export async function createIssue(issue) {
  const { data, error } = await db.from('issues').insert({ ...issue, status: 'Submitted' }).select().single()
  fail(error, 'submit the issue')
  return data
}
// Status/priority changes go through a database function that checks the staff passcode.
export async function updateIssue(id, { status, priority }, code) {
  const { error } = await db.rpc('update_issue', { p_id: id, p_status: status, p_priority: priority, p_code: code })
  fail(error, 'update the issue')
}
