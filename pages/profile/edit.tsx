import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../lib/authContext'
import { db, storage } from '../../lib/firebase'
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage'
import Link from 'next/link'

interface Document {
  id: string
  filename: string
  uploadedAt: string
  status: 'pending' | 'approved' | 'rejected'
  url?: string
}

export default function EditProfile() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [company, setCompany] = useState('')
  const [skills, setSkills] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Redirect non-alumni
  useEffect(() => {
    if (!loading && profile && profile.role !== 'alumni') {
      router.push('/dashboard')
    }
  }, [profile, loading, router])

  // Load existing documents
  useEffect(() => {
    if (user) {
      loadDocuments()
    }
  }, [user])

  async function loadDocuments() {
    try {
      const q = query(
        collection(db, 'documents'),
        where('userId', '==', user?.uid)
      )
      const snapshot = await getDocs(q)
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as Document[]
      setDocuments(docs)
    } catch (err) {
      console.error('Error loading documents:', err)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !user) return

    setUploading(true)
    setMessage('Uploading...')

    try {
      for (const file of Array.from(files)) {
        // Upload to Storage
        const storageRef = ref(storage, `documents/${user.uid}/${file.name}`)
        await uploadBytes(storageRef, file)

        // Save metadata to Firestore
        const newDoc: Document = {
          id: `${Date.now()}`,
          filename: file.name,
          uploadedAt: new Date().toISOString(),
          status: 'pending',
        }
        setDocuments((prev) => [...prev, newDoc])
      }
      setMessage('Documents uploaded successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Error uploading documents')
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveProfile() {
    if (!user) return
    setSaving(true)
    setError('')

    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        name: name || undefined,
        bio: bio || undefined,
        company: company || undefined,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        updatedAt: new Date().toISOString(),
      })
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  async function deleteDocument(docId: string, filename: string) {
    if (!user) return
    try {
      // Delete from Storage
      const fileRef = ref(storage, `documents/${user.uid}/${filename}`)
      await deleteObject(fileRef)

      // Remove from local state
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
    } catch (err) {
      console.error('Error deleting document:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user || !profile || profile.role !== 'alumni') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">
            {message}
          </div>
        )}

        {/* Profile form */}
        <div className="bg-white p-8 rounded shadow mb-8">
          <h2 className="text-2xl font-semibold mb-6">Your Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Company / Organization</label>
              <input
                type="text"
                placeholder="Where do you work?"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Skills (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., React, Node.js, Python"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Document upload */}
        <div className="bg-white p-8 rounded shadow mb-8">
          <h2 className="text-2xl font-semibold mb-6">Upload Documents</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload certificates, degrees, and other verification documents (PDF, JPG, PNG). Max 5 MB each.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded p-8 text-center mb-6">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Select Files'}
            </label>
            <p className="text-xs text-gray-600 mt-2">or drag and drop files here</p>
          </div>

          {/* Document list */}
          {documents.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Your Documents</h3>
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded border">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-xs text-gray-600">
                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()} • Status:{' '}
                      <span
                        className={
                          doc.status === 'approved'
                            ? 'text-green-600'
                            : doc.status === 'rejected'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }
                      >
                        {doc.status}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.id, doc.filename)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {documents.length === 0 && (
            <p className="text-center text-gray-600 text-sm py-8">
              No documents uploaded yet. Upload at least one document to complete your verification.
            </p>
          )}
        </div>

        {/* Verification status */}
        <div className="bg-blue-50 p-8 rounded shadow border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Verification Status</h3>
          <p className="text-sm text-blue-900 mb-4">
            {profile.verified ? (
              <span className="text-green-600">✓ Your profile has been verified by an admin.</span>
            ) : (
              <>
                Your profile is pending verification. Once you upload your documents, an admin will review them
                and approve your account within 24–48 hours.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
