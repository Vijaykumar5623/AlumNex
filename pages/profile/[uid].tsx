import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../lib/authContext'
import { createConversation } from '../../lib/chat'
import Link from 'next/link'

interface UserProfile {
    uid: string
    name?: string
    email: string
    role: string
    bio?: string
    company?: string
    skills?: string[]
    verified?: boolean
}

export default function PublicProfile() {
    const router = useRouter()
    const { uid } = router.query
    const { user: currentUser, profile: currentProfile } = useAuth()

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [chatLoading, setChatLoading] = useState(false)

    useEffect(() => {
        if (!uid || typeof uid !== 'string') return

        async function fetchProfile() {
            try {
                const docRef = doc(db, 'profiles', uid as string)
                const docSnap = await getDoc(docRef)
                if (docSnap.exists()) {
                    setProfile(docSnap.data() as UserProfile)
                } else {
                    setProfile(null)
                }
            } catch (err) {
                console.error('Error fetching profile:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [uid])

    async function handleMessage() {
        if (!currentUser || !profile) return
        setChatLoading(true)
        try {
            const conversationId = await createConversation(currentUser.uid, profile.uid)
            router.push(`/chat?conversationId=${conversationId}`)
        } catch (err) {
            console.error('Error creating conversation:', err)
            alert('Failed to start chat')
            setChatLoading(false)
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>
    if (!profile) return <div className="min-h-screen flex items-center justify-center">Profile not found</div>

    const isOwnProfile = currentUser?.uid === profile.uid

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Profile</h1>
                    <div className="flex gap-4">
                        {currentProfile?.role === 'student' && (
                            <Link href="/mentorship" className="text-blue-600 hover:underline font-medium">
                                Find Mentors
                            </Link>
                        )}
                        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl font-bold text-gray-900">{profile.name || profile.email}</h2>
                                    {profile.role === 'alumni' && profile.verified && (
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Verified</span>
                                    )}
                                </div>
                                <p className="text-gray-500 capitalize mb-4">{profile.role}</p>

                                {profile.company && (
                                    <p className="text-gray-700 mb-2">🏢 {profile.company}</p>
                                )}
                            </div>

                            {currentUser && !isOwnProfile && (
                                <button
                                    onClick={handleMessage}
                                    disabled={chatLoading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {chatLoading ? 'Starting...' : 'Message'}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </button>
                            )}

                            {isOwnProfile && profile.role === 'alumni' && (
                                <Link href="/profile/edit" className="px-6 py-2 border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors">
                                    Edit Profile
                                </Link>
                            )}
                        </div>

                        <hr className="my-6" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-3">About</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{profile.bio || 'No bio provided.'}</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-3">Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills && profile.skills.length > 0 ? (
                                        profile.skills.map(skill => (
                                            <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 text-sm">No skills listed.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
