import { useEffect, useMemo, useState } from 'react'
import { configured, listIssues, createIssue, updateIssue } from './supabase'
import { suggestPriority } from './priority'
import { DEMO } from './demo'

const CATS = ['Infrastructure', 'Cleanliness', 'Water', 'Electrical', 'Equipment', 'Safety', 'Other']
const STATUSES = ['Submitted', 'In Progress', 'Resolved']
const PRIOS = ['High', 'Medium', 'Low']
const fmt = d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const Badge = ({ v }) => <span className={`badge b-${v.replace(' ', '')}`}>{v}</span>

function Field({ label, err, children }) {
  return <label className="field"><span>{label}</span>{children}{err && <em role="alert">{err}</em>}</label>
}

function ReportForm({ onSubmit, onCancel }) {
  const [f, setF] = useState({ title: '', category: 'Infrastructure', location: '', description: '' })
  const [errs, setErrs] = useState({}), [busy, setBusy] = useState(false), [fail, setFail] = useState('')
  const sug = useMemo(() => suggestPriority(f), [f])
  const set = k => e => setF({ ...f, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault()
    const x = {}
    if (f.title.trim().length < 3) x.title = 'Enter a title (at least 3 characters).'
    if (f.location.trim().length < 2) x.location = 'Enter the building or location.'
    if (f.description.trim().length < 10) x.description = 'Describe the problem (at least 10 characters).'
    setErrs(x); setFail('')
    if (Object.keys(x).length) return
    setBusy(true)
    try { await onSubmit({ ...f, title: f.title.trim(), location: f.location.trim(), description: f.description.trim(), priority: sug.priority, priority_reason: sug.reason }) }
    catch (err) { setFail(err.message); setBusy(false) }
  }
  return (
    <form className="card form" onSubmit={submit} noValidate>
      <h2>Report an issue</h2>
      {fail && <div className="alert err" role="alert">{fail}</div>}
      <Field label="Issue title" err={errs.title}><input value={f.title} onChange={set('title')} maxLength={120} placeholder="e.g. Projector not working" /></Field>
      <div className="row">
        <Field label="Category"><select value={f.category} onChange={set('category')}>{CATS.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Building / location" err={errs.location}><input value={f.location} onChange={set('location')} maxLength={120} placeholder="e.g. Room 204, Main Building" /></Field>
      </div>
      <Field label="Description" err={errs.description}><textarea rows={4} value={f.description} onChange={set('description')} maxLength={1000} placeholder="What is wrong and where exactly?" /></Field>
      <div className="prio-box"><span>Suggested priority</span><Badge v={sug.priority} /><small>{sug.reason} Staff can override.</small></div>
      <div className="row end">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Submitting…' : 'Submit issue'}</button>
      </div>
    </form>)
}

export default function App() {
  const demo = !configured
  const [issues, setIssues] = useState(demo ? DEMO : [])
  const [loading, setLoading] = useState(!demo), [error, setError] = useState('')
  const [view, setView] = useState('dash'), [code, setCode] = useState(''), [toast, setToast] = useState(null)
  const [q, setQ] = useState(''), [fc, setFc] = useState(''), [fp, setFp] = useState(''), [fs, setFs] = useState('')
  const staff = demo || Boolean(code)
  const note = (msg, bad) => { setToast({ msg, bad }); setTimeout(() => setToast(null), 3500) }

  async function load() {
    if (demo) return
    setLoading(true); setError('')
    try { setIssues(await listIssues()) } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function add(issue) {
    if (demo) setIssues(l => [{ ...issue, id: `demo-${Date.now()}`, status: 'Submitted', created_at: new Date().toISOString() }, ...l])
    else { await createIssue(issue); await load() }
    setView('dash'); note(demo ? 'Added to the demo preview only (not saved).' : 'Issue submitted. Thank you!')
  }
  async function change(i, patch) {
    const next = { status: i.status, priority: i.priority, ...patch }
    try {
      if (demo) setIssues(l => l.map(x => x.id === i.id ? { ...x, ...next } : x))
      else { await updateIssue(i.id, next, code); await load() }
      note('Issue updated.')
    } catch (e) { if (/passcode/i.test(e.message)) setCode(''); note(e.message, true) }
  }
  const unlock = () => { const c = window.prompt('Enter staff passcode'); if (c) setCode(c) }

  const count = s => issues.filter(i => i.status === s).length
  const stats = [['Total issues', issues.length, ''], ['Submitted', count('Submitted'), 'amber'], ['In progress', count('In Progress'), 'blue'], ['Resolved', count('Resolved'), 'green']]
  const shown = issues.filter(i =>
    (!q || `${i.title} ${i.location}`.toLowerCase().includes(q.toLowerCase())) &&
    (!fc || i.category === fc) && (!fp || i.priority === fp) && (!fs || i.status === fs))

  return (
    <>
      <header className="top">
        <div className="brand"><span className="logo" aria-hidden>◉</span><div><b>CampusPulse</b><small>Report it. Track it. Improve campus life.</small></div></div>
        <div className="actions">
          {!demo && (staff ? <button className="btn ghost" onClick={() => setCode('')}>Leave staff mode</button> : <button className="btn ghost" onClick={unlock}>Staff login</button>)}
          <button className="btn" onClick={() => setView('report')}>+ Report an issue</button>
        </div>
      </header>
      {demo && <div className="banner">Demo preview: fictional sample data, nothing is saved. Add your Supabase keys to use the real database.</div>}
      <main>
        {view === 'report' ? <ReportForm onSubmit={add} onCancel={() => setView('dash')} /> : (<>
          <section className="hero"><h1>Your campus, your voice.</h1><p>Report problems, see what is being fixed, and watch campus life get better.</p></section>
          <section className="stats">{stats.map(([l, n, c]) => <div key={l} className={`card stat ${c}`}><span>{l}</span><strong>{loading ? '–' : n}</strong></div>)}</section>
          <section className="card">
            <div className="filters">
              <input aria-label="Search" placeholder="Search title or location…" value={q} onChange={e => setQ(e.target.value)} />
              <select aria-label="Category" value={fc} onChange={e => setFc(e.target.value)}><option value="">All categories</option>{CATS.map(c => <option key={c}>{c}</option>)}</select>
              <select aria-label="Priority" value={fp} onChange={e => setFp(e.target.value)}><option value="">All priorities</option>{PRIOS.map(c => <option key={c}>{c}</option>)}</select>
              <select aria-label="Status" value={fs} onChange={e => setFs(e.target.value)}><option value="">All statuses</option>{STATUSES.map(c => <option key={c}>{c}</option>)}</select>
            </div>
            {error && <div className="alert err" role="alert">{error} <button className="link" onClick={load}>Retry</button></div>}
            {loading ? <p className="empty">Loading issues…</p> : !error && shown.length === 0 ? <p className="empty">{issues.length ? 'No issues match your filters.' : 'No issues reported yet. Be the first to report one!'}</p> :
              <ul className="list">{shown.map(i => (
                <li key={i.id} className={`issue p-${i.priority}`}>
                  <div className="main"><b>{i.title}</b><small>{i.category} · {i.location} · {fmt(i.created_at)}</small><small className="why">Priority: {i.priority_reason}</small></div>
                  <div className="meta"><Badge v={i.priority} /><Badge v={i.status} /></div>
                  {staff ? <div className="ctl">
                    <select aria-label="Change status" value={i.status} onChange={e => change(i, { status: e.target.value })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                    <select aria-label="Override priority" value={i.priority} onChange={e => change(i, { priority: e.target.value })}>{PRIOS.map(s => <option key={s}>{s}</option>)}</select>
                  </div> : <div className="ctl" />}
                </li>))}</ul>}
          </section></>)}
      </main>
      {toast && <div className={`toast ${toast.bad ? 'bad' : ''}`} role="status">{toast.msg}</div>}
    </>)
}
