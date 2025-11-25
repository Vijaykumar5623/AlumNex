import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../lib/authContext'
import { db } from '../../lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import Link from 'next/link'

interface PendingAlumni {
  uid: string
  email: string
  verified: boolean
  createdAt: string
}

export default function PendingVerifications() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [alumni, setAlumni] = useState<PendingAlumni[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  // Check if user is admin
  useEffect(() => {
    if (!loading && profile && profile.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [profile, loading, router])

  // Fetch pending alumni
  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchPendingAlumni()
    }
  }, [profile])

  async function fetchPendingAlumni() {
    try {
      const q = query(
        collection(db, 'profiles'),
        where('role', '==', 'alumni'),
        where('verified', '==', false)
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...(doc.data() as any),
      })) as PendingAlumni[]
      setAlumni(data)
      setFetching(false)
    } catch (err: any) {
      setError(err.message || 'Error fetching alumni')
      setFetching(false)
    }
  }

  async function approveAlumni(uid: string) {
    try {
      await updateDoc(doc(db, 'profiles', uid), { verified: true })
      setAlumni((prev) => prev.filter((a) => a.uid !== uid))
    } catch (err: any) {
      setError(err.message || 'Error approving alumni')
    }
  }

  async function rejectAlumni(uid: string) {
    try {
      await updateDoc(doc(db, 'profiles', uid), { verified: false })
      // In a real app, would delete or mark as rejected
      setAlumni((prev) => prev.filter((a) => a.uid !== uid))
    } catch (err: any) {
      setError(err.message || 'Error rejecting alumni')
    }
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Pending Verifications</h1>
              <p className="text-sm text-gray-600">Review and approve new alumni</p>
            </div>
            <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {alumni.length === 0 ? (
          <div className="bg-white p-8 rounded shadow text-center">
            <p className="text-gray-600">No pending verifications at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {alumni.map((alum) => (
              <div key={alum.uid} className="bg-white p-6 rounded shadow border-l-4 border-yellow-400">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{alum.email}</h3>
                    <p className="text-sm text-gray-600">
                      Applied: {new Date(alum.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">Pending</span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => approveAlumni(alum.uid)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectAlumni(alum.uid)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Reject
                  </button>
                  <a
                    href={`/admin/alumni/${alum.uid}`}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-sm font-medium text-gray-600">Pending</h3>
            <p className="text-3xl font-bold mt-2">{alumni.length}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Verified</h3>
            <p className="text-3xl font-bold mt-2">—</p>
            <p className="text-xs text-gray-500 mt-1">(See analytics dashboard)</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-sm font-medium text-gray-600">Actions Needed</h3>
            <p className="text-3xl font-bold mt-2">{alumni.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
