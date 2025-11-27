import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/authContext'
import { db } from '../../lib/firebase'
import { collection, getDocs, getDoc, doc, updateDoc, addDoc } from 'firebase/firestore'
import Link from 'next/link'

interface JobSimple {
  id: string
  title: string
  company: string
  applicants: string[]
}

interface ApplicantSummary {
  uid: string
  name?: string
  email?: string
  status?: string
  appliedAt?: string
}

export default function AdminJobApplicants() {
  const { profile, loading } = useAuth()
  const [jobs, setJobs] = useState<JobSimple[]>([])
  const [fetching, setFetching] = useState(true)
  const [selectedJobApplicants, setSelectedJobApplicants] = useState<ApplicantSummary[] | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchJobs()
    }
  }, [profile])

  async function fetchJobs() {
    try {
      const snapshot = await getDocs(collection(db, 'jobs'))
      const list: JobSimple[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      setJobs(list)
      setFetching(false)
    } catch (err: any) {
      setError(err.message || 'Error fetching jobs')
      setFetching(false)
    }
  }

  async function showApplicants(job: JobSimple) {
    try {
      const appsSnap = await getDocs(collection(db, 'jobs', job.id, 'applications'))
      const result: ApplicantSummary[] = []
      for (const a of appsSnap.docs) {
        const ad = a.data() as any
        const pSnap = await getDoc(doc(db, 'profiles', ad.uid))
        result.push({ uid: ad.uid, ...(pSnap.data() as any), status: ad.status, appliedAt: ad.appliedAt })
      }
      setSelectedJobApplicants(result)
      setSelectedJobId(job.id)
    } catch (err: any) {
      setError(err.message || 'Error loading applicants')
    }
  }

  async function setApplicantStatus(jobId: string, uid: string, status: string) {
    try {
      const appRef = doc(db, 'jobs', jobId, 'applications', uid)
      await updateDoc(appRef, { status })
      // update UI list if open
      setSelectedJobApplicants((prev) => prev?.map((p) => (p.uid === uid ? { ...p, status } : p)) || null)

      // create notification
      await addNotification(uid, `Your application status changed to ${status}`)
    } catch (err: any) {
      setError(err.message || 'Error updating status')
    }
  }

  async function addNotification(uid: string, message: string) {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: uid,
        type: 'application_status',
        message,
        createdAt: new Date().toISOString(),
        read: false,
      })
    } catch (err) {
      console.warn('Failed to create notification', err)
    }
  }

  function exportCsv(profiles: ApplicantSummary[] | null) {
    if (!profiles) return
    const rows = profiles.map((p) => `${p.uid},"${p.name || ''}","${p.email || ''}","${p.status || ''}"`)
    const csv = 'uid,name,email,status\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'applicants.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!profile || profile.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Job Applicants</h1>
            <p className="text-sm text-gray-600">View applicants for posted jobs</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 bg-gray-200 rounded">Back</Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}

        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white p-6 rounded shadow flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.company}</p>
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-sm text-gray-500">{(job.applicants || []).length} applicants</div>
                <button onClick={() => showApplicants(job)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Show</button>
              </div>
            </div>
          ))}
        </div>

        {selectedJobApplicants && (
          <div className="mt-6 bg-white p-6 rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Applicants</h3>
              <div className="flex gap-2">
                <button onClick={() => exportCsv(selectedJobApplicants)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Export CSV</button>
                <button onClick={() => setSelectedJobApplicants(null)} className="px-3 py-1 bg-gray-200 rounded text-sm">Close</button>
              </div>
            </div>
            <div className="grid gap-2">
              {selectedJobApplicants.map((p) => (
                <div key={p.uid} className="p-2 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-medium">{p.name || '—'}</div>
                    <div className="text-xs text-gray-600">{p.email}</div>
                    <div className="text-xs text-gray-500">Applied: {p.appliedAt ? new Date(p.appliedAt).toLocaleString() : '—'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm px-2 py-1 rounded bg-gray-100">{p.status || 'applied'}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => selectedJobId && setApplicantStatus(selectedJobId, p.uid, 'shortlisted')}
                        className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => selectedJobId && setApplicantStatus(selectedJobId, p.uid, 'accepted')}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => selectedJobId && setApplicantStatus(selectedJobId, p.uid, 'rejected')}
                        className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm"
                      >
                        Reject
                      </button>
                    </div>
                    <Link href={`/profile/${p.uid}`} className="text-blue-600 hover:underline text-sm">View Profile</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
