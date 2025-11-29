import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { signOut } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { useAuth } from '../lib/authContext'
import Link from 'next/link'

export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [counts, setCounts] = useState({ verifications: 0, requests: 0, offers: 0 })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fetch notification counts
  useEffect(() => {
    if (!user || !profile) return

    async function fetchCounts() {
      try {
        const newCounts = { verifications: 0, requests: 0, offers: 0 }

        if (profile?.role === 'admin') {
          // Count pending verifications
          const qVer = query(collection(db, 'profiles'), where('role', '==', 'alumni'), where('verified', '==', false))
          const snapVer = await getDocs(qVer)
          newCounts.verifications = snapVer.size

          // Count pending mentorship requests (admin view)
          const qReq = query(collection(db, 'mentorship_requests'), where('status', '==', 'pending'))
          const snapReq = await getDocs(qReq)
          newCounts.requests = snapReq.size
        }

        if (profile?.role === 'alumni' && user) {
          // Count pending mentorship offers
          const qOff = query(collection(db, 'mentorship_requests'), where('mentorUid', '==', user.uid), where('status', '==', 'pending'))
          const snapOff = await getDocs(qOff)
          newCounts.offers = snapOff.size
        }

        setCounts(newCounts)
      } catch (err) {
        console.error('Error fetching counts:', err)
      }
    }

    fetchCounts()
  }, [user, profile])

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
            {profile.role === 'alumni' && (
              <p className="text-sm text-gray-600 mb-4">Status: {profile.verified ? <span className="text-green-600">✓ Verified</span> : <span className="text-yellow-600">Pending</span>}</p>
            )}
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

            {/* Gamification Stats */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Karma Points</span>
                <span className="text-lg font-bold text-yellow-600">{profile.karma || 0} 🌟</span>
              </div>
              {profile.badges && profile.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map(badge => (
                    <span key={badge} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-200">
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
                  <Link href="/stories" className="block text-blue-600 hover:underline text-sm">
                    Success Stories
                  </Link>
                  <Link href="/community" className="block text-blue-600 hover:underline text-sm">
                    Community Forums
                  </Link>
                  <Link href="/chat" className="block text-blue-600 hover:underline text-sm">
                    Messages
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
                  <Link href="/mentorship/offers" className="block text-blue-600 hover:underline text-sm flex justify-between">
                    <span>View Mentorship Requests</span>
                    {counts.offers > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{counts.offers}</span>}
                  </Link>
                  <Link href="/stories" className="block text-blue-600 hover:underline text-sm">
                    Success Stories
                  </Link>
                  <Link href="/community" className="block text-blue-600 hover:underline text-sm">
                    Community Forums
                  </Link>
                  <Link href="/chat" className="block text-blue-600 hover:underline text-sm">
                    Messages
                  </Link>
                </>
              )}
              {profile.role === 'admin' && (
                <>
                  <Link href="/admin/documents" className="block text-blue-600 hover:underline text-sm">
                    Review Documents
                  </Link>
                  <Link href="/admin/pending-verifications" className="block text-blue-600 hover:underline text-sm flex justify-between">
                    <span>Pending Verifications</span>
                    {counts.verifications > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{counts.verifications}</span>}
                  </Link>
                  <Link href="/admin/mentorship-requests" className="block text-blue-600 hover:underline text-sm flex justify-between">
                    <span>Mentorship Requests</span>
                    {counts.requests > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{counts.requests}</span>}
                  </Link>
                  <Link href="/admin/analytics" className="block text-blue-600 hover:underline text-sm">
                    View Analytics
                  </Link>
                  <Link href="/admin/stories/create" className="block text-blue-600 hover:underline text-sm">
                    Publish Success Story
                  </Link>
                  <Link href="/community" className="block text-blue-600 hover:underline text-sm">
                    Moderate Forums
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
