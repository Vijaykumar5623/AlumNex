import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../lib/authContext'
import { db } from '../../lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'

interface Request {
    id: string
    studentUid: string
    mentorUid: string
    status: 'pending' | 'accepted' | 'rejected'
    message: string
    requestedAt: string
    studentName?: string
    studentEmail?: string
}

export default function MentorshipOffers() {
    const { user, profile, loading } = useAuth()
    const router = useRouter()
    const [requests, setRequests] = useState<Request[]>([])
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!loading && (!user || profile?.role !== 'alumni')) {
            router.push('/dashboard')
        }
    }, [user, profile, loading, router])

    useEffect(() => {
        if (user && profile?.role === 'alumni') {
            fetchRequests()
        }
    }, [user, profile])

    async function fetchRequests() {
        try {
            const q = query(
                collection(db, 'mentorship_requests'),
                where('mentorUid', '==', user?.uid)
            )
            const snapshot = await getDocs(q)

            const reqs = await Promise.all(snapshot.docs.map(async (d) => {
                const data = d.data() as any
                // Fetch student details
                let studentName = 'Unknown Student'
                let studentEmail = ''
                try {
                    const studentDoc = await getDoc(doc(db, 'profiles', data.studentUid))
                    if (studentDoc.exists()) {
                        const sData = studentDoc.data()
                        studentName = sData.name || sData.email
                        studentEmail = sData.email
                    }
                } catch (e) {
                    console.error('Error fetching student profile', e)
                }

                return {
                    id: d.id,
                    ...data,
                    studentName,
                    studentEmail
                } as Request
            }))

            setRequests(reqs)
        } catch (err: any) {
            console.error('Error fetching requests:', err)
            setError('Failed to load requests')
        } finally {
            setFetching(false)
        }
    }

    async function handleAction(requestId: string, status: 'accepted' | 'rejected') {
        try {
            await updateDoc(doc(db, 'mentorship_requests', requestId), { status })
            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r))
        } catch (err) {
            console.error('Error updating request:', err)
            alert('Failed to update request')
        }
    }

    if (loading || fetching) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Mentorship Requests</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {error && <div className="p-4 bg-red-50 text-red-700 rounded mb-4">{error}</div>}

                {requests.length === 0 ? (
                    <div className="bg-white p-8 rounded shadow text-center text-gray-500">
                        No mentorship requests received yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg">{req.studentName}</h3>
                                        <p className="text-sm text-gray-600 mb-2">{req.studentEmail}</p>
                                        <p className="text-gray-800 bg-gray-50 p-3 rounded text-sm mb-3">"{req.message || 'No message'}"</p>
                                        <p className="text-xs text-gray-500">Received: {new Date(req.requestedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                req.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {req.status}
                                        </span>

                                        {req.status === 'pending' && (
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleAction(req.id, 'accepted')}
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'rejected')}
                                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}

                                        <Link href={`/profile/${req.studentUid}`} className="text-sm text-blue-600 hover:underline mt-1">
                                            View Profile
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
