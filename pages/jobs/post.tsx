import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../lib/authContext'
import { db } from '../../lib/firebase'
import { addDoc, collection } from 'firebase/firestore'
import Link from 'next/link'

export default function PostJob() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [remote, setRemote] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [applyLink, setApplyLink] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (profile?.role !== 'alumni') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Only alumni can post jobs.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !description || !company) {
      setMessage('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      await addDoc(collection(db, 'jobs'), {
        createdBy: user?.uid,
        title,
        description,
        company,
        location: location || 'Remote',
        remote,
        tags,
        applyLink: applyLink || '',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        applicants: [],
      })
      setMessage('Job posted successfully!')
      setTimeout(() => router.push('/jobs'), 1500)
    } catch (err: any) {
      setMessage(err.message || 'Error posting job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Post a Job</h1>
          <Link href="/jobs" className="text-blue-600 hover:underline">Back</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {message && (
          <div className={`mb-4 p-4 rounded border ${message.includes('successfully') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Job Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Senior React Developer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Job description and requirements..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company *</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City, Country"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remote"
              checked={remote}
              onChange={(e) => setRemote(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="remote" className="text-sm font-medium">Remote</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="React, Node.js, Firebase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Apply Link</label>
            <input
              type="url"
              value={applyLink}
              onChange={(e) => setApplyLink(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/apply"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  )
}
