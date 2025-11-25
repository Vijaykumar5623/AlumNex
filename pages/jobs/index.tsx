import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/authContext'
import { db } from '../../lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
  description: string
  tags: string[]
  applyLink?: string
  createdAt: string
  createdBy: string
  createdByName?: string
  applicants: string[]
}

export default function BrowseJobs() {
  const { user, profile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTag, setFilterTag] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    try {
      const snapshot = await getDocs(collection(db, 'jobs'))
      const jobsList: Job[] = []

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as any
        const creatorSnap = await getDoc(doc(db, 'profiles', data.createdBy))
        const creatorData = creatorSnap.data()

        jobsList.push({
          id: docSnap.id,
          title: data.title,
          company: data.company,
          location: data.location || 'Remote',
          remote: data.remote,
          description: data.description,
          tags: data.tags || [],
          applyLink: data.applyLink,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
          createdByName: creatorData?.name || 'Alumni',
          applicants: data.applicants || [],
        })
      }

      setJobs(jobsList)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching jobs:', err)
      setLoading(false)
    }
  }

  async function applyForJob(jobId: string) {
    if (!user) {
      setMessage('You must be signed in to apply')
      return
    }

    try {
      const jobRef = doc(db, 'jobs', jobId)
      const jobSnap = await getDoc(jobRef)
      const job = jobSnap.data() as any

      if (!job.applicants.includes(user.uid)) {
        await updateDoc(jobRef, {
          applicants: [...job.applicants, user.uid],
        })
        setMessage('Applied successfully!')
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, applicants: [...j.applicants, user.uid] } : j
          )
        )
      } else {
        setMessage('You already applied for this job')
      }
    } catch (err: any) {
      setMessage(err.message || 'Error applying for job')
    }
  }

  const filteredJobs = filterTag ? jobs.filter((j) => j.tags.map((t) => t.toLowerCase()).includes(filterTag.toLowerCase())) : jobs

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Jobs & Internships</h1>
            <p className="text-sm text-gray-600">Browse opportunities posted by alumni</p>
          </div>
          <div className="flex gap-2">
            {profile?.role === 'alumni' && (
              <Link href="/jobs/post" className="px-4 py-2 bg-blue-600 text-white rounded">
                Post Job
              </Link>
            )}
            <Link href="/dashboard" className="px-4 py-2 bg-gray-200 rounded">
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : (
          <>
            {/* Filter */}
            <div className="mb-6 flex gap-2">
              <input
                type="text"
                placeholder="Filter by skill tag (e.g., React)"
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              {filterTag && (
                <button onClick={() => setFilterTag('')} className="px-4 py-2 bg-gray-200 rounded">
                  Clear
                </button>
              )}
            </div>

            {filteredJobs.length === 0 ? (
              <div className="bg-white p-8 rounded shadow text-center text-gray-600">
                No jobs found. Try clearing filters or check back later.
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="bg-white p-6 rounded shadow hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600">
                          {job.company} • {job.location} {job.remote ? '• Remote' : ''}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {job.applicants.length} applied
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description}</p>

                    {job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {job.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">Posted by {job.createdByName}</p>
                      <button
                        onClick={() => applyForJob(job.id)}
                        disabled={!!(user && job.applicants.includes(user.uid))}
                        className={`px-4 py-2 rounded font-medium text-sm ${
                          user && job.applicants.includes(user.uid)
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {user && job.applicants.includes(user.uid) ? '✓ Applied' : 'Apply'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
