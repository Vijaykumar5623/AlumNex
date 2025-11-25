import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../lib/authContext'
import Link from 'next/link'

export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut(auth)
      router.push('/')
    } catch (err) {
      console.error('Error signing out:', err)
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Alumni Management</h1>
            <p className="text-sm text-gray-600">Welcome, {profile.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Profile card */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Your Profile</h2>
            <p className="text-sm text-gray-600 mb-2">Email: {profile.email}</p>
            <p className="text-sm text-gray-600 mb-2">Role: <span className="font-medium capitalize">{profile.role}</span></p>
            <p className="text-sm text-gray-600 mb-4">Status: {profile.verified ? <span className="text-green-600">✓ Verified</span> : <span className="text-yellow-600">Pending</span>}</p>
            {profile.role === 'alumni' && !profile.verified && (
              <Link href="/profile/edit" className="text-blue-600 hover:underline text-sm">
                Complete profile & upload documents →
              </Link>
            )}
            {profile.role === 'alumni' && profile.verified && (
              <Link href="/profile/edit" className="text-blue-600 hover:underline text-sm">
                Edit profile →
              </Link>
            )}
            {profile.role === 'admin' && (
              <Link href="/admin/documents" className="text-blue-600 hover:underline text-sm">
                Review documents →
              </Link>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {profile.role === 'student' && (
                <>
                  <Link href="/jobs" className="block text-blue-600 hover:underline text-sm">
                    Browse Jobs & Internships
                  </Link>
                  <Link href="/events" className="block text-blue-600 hover:underline text-sm">
                    Browse Events
                  </Link>
                  <Link href="/mentorship" className="block text-blue-600 hover:underline text-sm">
                    Find a Mentor
                  </Link>
                </>
              )}
              {profile.role === 'alumni' && (
                <>
                  <Link href="/jobs/post" className="block text-blue-600 hover:underline text-sm">
                    Post a Job/Internship
                  </Link>
                  <Link href="/events/create" className="block text-blue-600 hover:underline text-sm">
                    Create an Event
                  </Link>
                  <Link href="/mentorship/offers" className="block text-blue-600 hover:underline text-sm">
                    View Mentorship Requests
                  </Link>
                </>
              )}
              {profile.role === 'admin' && (
                <>
                  <Link href="/admin/documents" className="block text-blue-600 hover:underline text-sm">
                    Review Documents
                  </Link>
                  <Link href="/admin/pending-verifications" className="block text-blue-600 hover:underline text-sm">
                    Pending Verifications
                  </Link>
                  <Link href="/admin/mentorship-requests" className="block text-blue-600 hover:underline text-sm">
                    Mentorship Requests
                  </Link>
                  <Link href="/admin/analytics" className="block text-blue-600 hover:underline text-sm">
                    View Analytics
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Getting started */}
          <div className="bg-blue-50 p-6 rounded shadow border border-blue-200">
            <h2 className="text-lg font-semibold mb-4 text-blue-900">Getting Started</h2>
            <ul className="space-y-2 text-sm text-blue-900">
              {profile.role === 'alumni' && (
                <>
                  <li>✓ Account created</li>
                  <li>→ Complete your profile</li>
                  <li>→ Upload certificates</li>
                  <li>→ Get verified by admin</li>
                  <li>→ Post jobs & mentor students</li>
                </>
              )}
              {profile.role === 'student' && (
                <>
                  <li>✓ Account created</li>
                  <li>→ Browse jobs & events</li>
                  <li>→ Request mentorship</li>
                  <li>→ Connect with alumni</li>
                  <li>→ Chat & network</li>
                </>
              )}
              {profile.role === 'admin' && (
                <>
                  <li>✓ Admin account active</li>
                  <li>→ Review pending verifications</li>
                  <li>→ Moderate content</li>
                  <li>→ View platform analytics</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Demo stub sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
            <p className="text-sm text-gray-600">No recent activity yet.</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-semibold mb-3">Notifications</h3>
            <p className="text-sm text-gray-600">No new notifications.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
