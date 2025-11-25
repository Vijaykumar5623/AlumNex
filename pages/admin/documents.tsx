import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../lib/authContext'
import { db, storage } from '../../lib/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  addDoc,
} from 'firebase/firestore'
import { ref, getBytes } from 'firebase/storage'
import Link from 'next/link'

interface DocumentWithAlumni {
  docId: string
  filename: string
  uploadedAt: string
  status: 'pending' | 'approved' | 'rejected'
  userId: string
  alumniEmail: string
  alumniName: string
}

export default function AdminDocumentReview() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [documents, setDocuments] = useState<DocumentWithAlumni[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithAlumni | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (!loading && profile && profile.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [profile, loading, router])

  // Fetch pending documents
  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchPendingDocuments()
    }
  }, [profile])

  async function fetchPendingDocuments() {
    try {
      // Get all alumni with pending documents
      const alumniQuery = query(
        collection(db, 'profiles'),
        where('role', '==', 'alumni'),
        where('verified', '==', false)
      )
      const alumniSnapshot = await getDocs(alumniQuery)

      const allDocs: DocumentWithAlumni[] = []

      for (const alumniDoc of alumniSnapshot.docs) {
        const alumniData = alumniDoc.data()
        // In a real app, we'd query a 'documents' collection with userId filter
        // For now, we'll create a mock structure that shows how it would work
        allDocs.push({
          docId: `${alumniDoc.id}-1`,
          filename: 'Degree_Certificate.pdf',
          uploadedAt: alumniData.createdAt,
          status: 'pending',
          userId: alumniDoc.id,
          alumniEmail: alumniData.email,
          alumniName: alumniData.name || 'Unnamed',
        })
      }

      setDocuments(allDocs)
      setFetching(false)
    } catch (err: any) {
      setError(err.message || 'Error fetching documents')
      setFetching(false)
    }
  }

  async function approveDocument(docItem: DocumentWithAlumni) {
    setProcessing(true)
    try {
      // Mark alumni as verified
      await updateDoc(doc(db, 'profiles', docItem.userId), {
        verified: true,
      })

      // Create notification (in real app, would trigger Cloud Function)
      await addDoc(collection(db, 'notifications'), {
        userId: docItem.userId,
        type: 'document_approved',
        message: 'Your documents have been approved!',
        createdAt: new Date().toISOString(),
        read: false,
      })

      // Remove from list
      setDocuments((prev) => prev.filter((d) => d.docId !== docItem.docId))
      setSelectedDoc(null)
      setFilePreview(null)
    } catch (err: any) {
      setError(err.message || 'Error approving document')
    } finally {
      setProcessing(false)
    }
  }

  async function rejectDocument(docItem: DocumentWithAlumni) {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason')
      return
    }

    setProcessing(true)
    try {
      // Create notification with reason
      await addDoc(collection(db, 'notifications'), {
        userId: docItem.userId,
        type: 'document_rejected',
        message: `Your documents were rejected: ${rejectionReason}`,
        createdAt: new Date().toISOString(),
        read: false,
      })

      // Remove from list
      setDocuments((prev) => prev.filter((d) => d.docId !== docItem.docId))
      setSelectedDoc(null)
      setFilePreview(null)
      setRejectionReason('')
    } catch (err: any) {
      setError(err.message || 'Error rejecting document')
    } finally {
      setProcessing(false)
    }
  }

  async function handlePreviewFile(docItem: DocumentWithAlumni) {
    try {
      setSelectedDoc(docItem)
      // Try to get file preview URL (in real app, would use signed URL)
      // For now, show a placeholder
      setFilePreview(`[Preview of ${docItem.filename}]`)
    } catch (err) {
      setError('Could not load file preview')
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
              <h1 className="text-3xl font-bold">Document Review</h1>
              <p className="text-sm text-gray-600">Review and verify alumni documents</p>
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
          {/* Documents list */}
          <div className="lg:col-span-2">
            {documents.length === 0 ? (
              <div className="bg-white p-8 rounded shadow text-center">
                <p className="text-gray-600">No pending documents for review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((docItem) => (
                  <div
                    key={docItem.docId}
                    onClick={() => handlePreviewFile(docItem)}
                    className={`p-4 bg-white rounded shadow cursor-pointer hover:shadow-md transition ${
                      selectedDoc?.docId === docItem.docId ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{docItem.alumniEmail}</h3>
                        <p className="text-sm text-gray-600">
                          {docItem.alumniName} • {docItem.filename}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploaded: {new Date(docItem.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview and actions */}
          {selectedDoc && (
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded shadow sticky top-20">
                <h3 className="text-lg font-semibold mb-4">Review</h3>

                {/* File preview placeholder */}
                <div className="bg-gray-100 p-8 rounded mb-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">{filePreview}</p>
                  <p className="text-xs text-gray-500">
                    File: {selectedDoc.filename} ({(Math.random() * 2).toFixed(1)} MB)
                  </p>
                  <a
                    href="#"
                    className="text-blue-600 hover:underline text-sm mt-2 block"
                    onClick={(e) => {
                      e.preventDefault()
                      window.open('#', '_blank')
                    }}
                  >
                    Download →
                  </a>
                </div>

                {/* Alumni info */}
                <div className="mb-6 p-4 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-gray-900">{selectedDoc.alumniEmail}</p>
                  <p className="text-xs text-gray-600">{selectedDoc.alumniName}</p>
                </div>

                {/* Rejection reason (if rejecting) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Rejection Reason (if rejecting)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why document was rejected..."
                    rows={3}
                    className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => selectedDoc && approveDocument(selectedDoc)}
                    disabled={processing || !selectedDoc}
                    className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium text-sm"
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => selectedDoc && rejectDocument(selectedDoc)}
                    disabled={processing || !selectedDoc || !rejectionReason.trim()}
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
            <h3 className="text-sm font-medium text-gray-600">Pending Review</h3>
            <p className="text-3xl font-bold mt-2">{documents.length}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-sm font-medium text-gray-600">Total Processed</h3>
            <p className="text-3xl font-bold mt-2">—</p>
            <p className="text-xs text-gray-500 mt-1">(See analytics)</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-sm font-medium text-gray-600">Approved Today</h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
