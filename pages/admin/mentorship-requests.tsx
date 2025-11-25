import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../lib/authContext'
import { db } from '../../lib/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  addDoc,
} from 'firebase/firestore'
import Link from 'next/link'

interface MentorshipRequest {
  id: string
  studentUid: string
  mentorUid: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  requestedAt: string
  studentName?: string
  studentEmail?: string
  mentorName?: string
  mentorEmail?: string
}

export default function AdminMentorshipRequests() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<MentorshipRequest[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<MentorshipRequest | null>(null)
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  // Check if user is admin
  useEffect(() => {
    if (!loading && profile && profile.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [profile, loading, router])

  // Fetch pending mentorship requests
  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchRequests()
    }
  }, [profile])

  async function fetchRequests() {
    try {
      const q = query(
        collection(db, 'mentorship_requests'),
        where('status', '==', 'pending')
      )
      const snapshot = await getDocs(q)

      const allRequests: MentorshipRequest[] = []

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as any
        const studentProf = await getDocs(
          query(collection(db, 'profiles'), where('uid', '==', data.studentUid))
        )
        const mentorProf = await getDocs(
          query(collection(db, 'profiles'), where('uid', '==', data.mentorUid))
        )

        const studentData = studentProf.docs[0]?.data()
        const mentorData = mentorProf.docs[0]?.data()

        allRequests.push({
          id: docSnap.id,
          studentUid: data.studentUid,
          mentorUid: data.mentorUid,
          message: data.message || '',
          status: data.status,
          requestedAt: data.requestedAt,
          studentName: studentData?.name || 'Student',
          studentEmail: studentData?.email || '',
          mentorName: mentorData?.name || 'Mentor',
          mentorEmail: mentorData?.email || '',
        })
      }

      setRequests(allRequests)
      setFetching(false)
    } catch (err: any) {
      setError(err.message || 'Error fetching requests')
      setFetching(false)
    }
  }

  async function acceptRequest(req: MentorshipRequest) {
    setProcessing(true)
    try {
      // Update request status
      await updateDoc(doc(db, 'mentorship_requests', req.id), {
        status: 'accepted',
      })

      // Notify student
      await addDoc(collection(db, 'notifications'), {
        userId: req.studentUid,
        type: 'mentorship_accepted',
        message: `${req.mentorName} accepted your mentorship request!`,
        createdAt: new Date().toISOString(),
        read: false,
      })

      // Notify mentor
      await addDoc(collection(db, 'notifications'), {
        userId: req.mentorUid,
        type: 'mentorship_accepted',
        message: `You accepted ${req.studentName}'s mentorship request.`,
        createdAt: new Date().toISOString(),
        read: false,
      })

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== req.id))
      setSelectedRequest(null)
    } catch (err: any) {
      setError(err.message || 'Error accepting request')
    } finally {
      setProcessing(false)
    }
  }

  async function rejectRequest(req: MentorshipRequest) {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }

    setProcessing(true)
    try {
      // Update request status
      await updateDoc(doc(db, 'mentorship_requests', req.id), {
        status: 'rejected',
      })

      // Notify student
      await addDoc(collection(db, 'notifications'), {
        userId: req.studentUid,
        type: 'mentorship_rejected',
        message: `Your mentorship request was declined: ${rejectionReason}`,
        createdAt: new Date().toISOString(),
        read: false,
      })

      // Remove from list
      setRequests((prev) => prev.filter((r) => r.id !== req.id))
      setSelectedRequest(null)
      setRejectionReason('')
    } catch (err: any) {
      setError(err.message || 'Error rejecting request')
    } finally {
      setProcessing(false)
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
              <h1 className="text-3xl font-bold">Mentorship Requests</h1>
              <p className="text-sm text-gray-600">Review and manage mentorship requests</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests list */}
          <div className="lg:col-span-2">
            {requests.length === 0 ? (
              <div className="bg-white p-8 rounded shadow text-center">
                <p className="text-gray-600">No pending mentorship requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-4 bg-white rounded shadow cursor-pointer hover:shadow-md transition ${
                      selectedRequest?.id === req.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{req.studentName}</h3>
                        <p className="text-sm text-gray-600">
                          Requested: {req.mentorName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {req.studentEmail} → {req.mentorEmail}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(req.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions panel */}
          {selectedRequest && (
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded shadow sticky top-20">
                <h3 className="text-lg font-semibold mb-4">Review Request</h3>

                {/* Request details */}
                <div className="mb-6 p-4 bg-gray-50 rounded">
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">Student</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRequest.studentName}</p>
                    <p className="text-xs text-gray-600">{selectedRequest.studentEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Mentor</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRequest.mentorName}</p>
                    <p className="text-xs text-gray-600">{selectedRequest.mentorEmail}</p>
                  </div>
                </div>

                {/* Message (if provided) */}
                {selectedRequest.message && (
                  <div className="mb-6 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <p className="text-xs text-blue-600 font-medium mb-1">Student's Message</p>
                    <p className="text-sm text-blue-900">{selectedRequest.message}</p>
                  </div>
                )}

                {/* Rejection reason (if rejecting) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Reason (if rejecting)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Why is this not a good match?"
                    rows={3}
                    className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => acceptRequest(selectedRequest)}
                    disabled={processing}
                    className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
                  >
                    {processing ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => rejectRequest(selectedRequest)}
                    disabled={processing || !rejectionReason.trim()}
                    className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-medium text-sm"
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-sm font-medium text-gray-600">Pending Requests</h3>
            <p className="text-3xl font-bold mt-2">{requests.length}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Matched</h3>
            <p className="text-3xl font-bold mt-2">—</p>
            <p className="text-xs text-gray-500 mt-1">(View in analytics)</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-sm font-medium text-gray-600">Mentorships Active</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
