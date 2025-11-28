import { useState } from 'react'
import { useAuth } from '../../lib/authContext'
import Link from 'next/link'

interface Mentor {
  uid: string
  name?: string
  email?: string
  skills: string[]
  score: number
  commonSkills: string[]
}

export default function MentorshipIndex() {
  const { user, profile } = useAuth()
  const [skillsInput, setSkillsInput] = useState('')
  const [matches, setMatches] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function findMatches() {
    if (!skillsInput.trim()) return setMessage('Enter one or more skills')
    setLoading(true)
    setMessage('')
    try {
      const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean)
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, topN: 10 }),
      })
      const data = await res.json()
      if (res.ok) {
        setMatches(data.matches)
      } else {
        setMessage(data.error || 'Error fetching matches')
      }
    } catch (err: any) {
      setMessage(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  async function sendRequest(mentorUid: string) {
    if (!user) return setMessage('You must be signed in as a student to send requests')
    setLoading(true)
    try {
      const res = await fetch('/api/mentorship/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentUid: user.uid, mentorUid, message: '' }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Request sent!')
      } else {
        setMessage(data.error || 'Error sending request')
      }
    } catch (err: any) {
      setMessage(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Find a Mentor</h1>
            <p className="text-sm text-gray-600">Search mentors by skills</p>
          </div>
          <Link href="/dashboard" className="text-blue-600 hover:underline">Back</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {message && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">{message}</div>}

        <div className="bg-white p-6 rounded shadow mb-6">
          <label className="block text-sm font-medium mb-2">Your skills (comma-separated)</label>
          <input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} className="w-full p-2 border rounded mb-3" placeholder="e.g., React, Node.js" />
          <div className="flex gap-3">
            <button onClick={findMatches} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Searching...' : 'Find Mentors'}</button>
            <button onClick={() => { setSkillsInput(''); setMatches([]); }} className="px-4 py-2 bg-gray-200 rounded">Clear</button>
          </div>
        </div>

        <div className="grid gap-4">
          {matches.length === 0 && (
            <div className="bg-white p-6 rounded shadow text-center text-gray-600">No matches yet. Try entering skills and click "Find Mentors".</div>
          )}

          {matches.map((m) => (
            <div key={m.uid} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <div>
                <Link href={`/profile/${m.uid}`} className="font-medium hover:text-blue-600 hover:underline text-lg">
                  {m.name || m.email}
                </Link>
                <div className="text-xs text-gray-600">Common: {m.commonSkills.join(', ') || '—'}</div>
                <div className="text-xs text-gray-500">Skills: {m.skills.join(', ')}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-sm font-semibold">Score: {m.score}</div>
                <div className="flex gap-2">
                  <Link href={`/profile/${m.uid}`} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    View Profile
                  </Link>
                  <button onClick={() => sendRequest(m.uid)} disabled={loading || !user || profile?.role !== 'student'} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50">
                    {profile?.role === 'student' ? 'Request Mentor' : 'Sign in'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
