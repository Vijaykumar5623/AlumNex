import { useState } from 'react'
import { useAuth } from '../../lib/authContext'
import { db } from '../../lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import Link from 'next/link'

interface Mentor {
  uid: string
  name?: string
  email?: string
  skills: string[]
  score: number
  commonSkills: string[]
  company?: string
  location?: string
  jobTitle?: string
}

export default function MentorshipIndex() {
  const { user, profile } = useAuth()
  const [skillsInput, setSkillsInput] = useState('')
  const [matches, setMatches] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [filters, setFilters] = useState({ location: '', company: '', name: '' })

  async function findMatches() {
    setLoading(true)
    setMessage('')
    try {
      const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean)
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, filters, topN: 20 }),
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
      await addDoc(collection(db, 'mentorship_requests'), {
        studentUid: user.uid,
        mentorUid,
        message: '',
        status: 'pending',
        requestedAt: new Date().toISOString(),
      })
      setMessage('Request sent successfully!')
    } catch (err: any) {
      console.error('Request error:', err)
      setMessage('Error sending request: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Find a Mentor</h1>
            <p className="text-sm text-gray-600">Search mentors by skills, location, or company</p>
          </div>
          <Link href="/dashboard" className="text-blue-600 hover:underline">Back</Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="w-full md:w-1/4">
          <div className="bg-white p-4 rounded shadow sticky top-4">
            <h2 className="font-semibold mb-4">Filters</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Skills</label>
              <input
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full p-2 border rounded text-sm"
                placeholder="e.g. React, Python"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full p-2 border rounded text-sm"
                placeholder="e.g. Bangalore"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Company</label>
              <input
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                className="w-full p-2 border rounded text-sm"
                placeholder="e.g. Google"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                className="w-full p-2 border rounded text-sm"
                placeholder="Search by name"
              />
            </div>

            <button
              onClick={findMatches}
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Apply Filters'}
            </button>
            <button
              onClick={() => { setSkillsInput(''); setFilters({ location: '', company: '', name: '' }); setMatches([]); }}
              className="w-full mt-2 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="w-full md:w-3/4">
          {message && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">{message}</div>}

          <div className="grid gap-4">
            {matches.length === 0 && !loading && (
              <div className="bg-white p-8 rounded shadow text-center text-gray-600">
                <p className="text-lg mb-2">No matches found.</p>
                <p className="text-sm">Try adjusting your filters or search for different skills.</p>
              </div>
            )}

            {matches.map((m) => (
              <div key={m.uid} className="bg-white p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <Link href={`/profile/${m.uid}`} className="font-bold text-lg hover:text-blue-600 hover:underline">
                    {m.name || 'Alumni Member'}
                  </Link>
                  <div className="text-sm text-gray-700">
                    {m.jobTitle} {m.company && <span>at <span className="font-medium">{m.company}</span></span>}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">{m.location}</div>

                  <div className="flex flex-wrap gap-2">
                    {m.skills.slice(0, 5).map(s => (
                      <span key={s} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{s}</span>
                    ))}
                    {m.skills.length > 5 && <span className="text-xs text-gray-500">+{m.skills.length - 5} more</span>}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                  {m.score > 0 && <div className="text-xs font-semibold text-green-600">{m.score} Skill Matches</div>}
                  <div className="flex gap-2">
                    <Link href={`/profile/${m.uid}`} className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                      View
                    </Link>
                    <button
                      onClick={() => sendRequest(m.uid)}
                      disabled={loading || !user || profile?.role !== 'student'}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Request
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
