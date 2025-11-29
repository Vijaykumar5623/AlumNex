import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import Link from 'next/link'

interface Story {
    id: string
    title: string
    excerpt: string
    authorName: string
    createdAt: string
    imageUrl?: string
}

export default function StoriesIndex() {
    const [stories, setStories] = useState<Story[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStories() {
            try {
                const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'))
                const snap = await getDocs(q)
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story))
                setStories(data)
            } catch (err) {
                console.error("Error fetching stories:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchStories()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Success Stories</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center text-gray-600">Loading stories...</div>
                ) : stories.length === 0 ? (
                    <div className="text-center text-gray-600">No stories shared yet.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {stories.map(story => (
                            <div key={story.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                                {story.imageUrl && (
                                    <img src={story.imageUrl} alt={story.title} className="w-full h-48 object-cover" />
                                )}
                                <div className="p-6">
                                    <h2 className="text-xl font-bold mb-2 text-gray-900">{story.title}</h2>
                                    <p className="text-sm text-gray-500 mb-4">By {story.authorName} • {new Date(story.createdAt).toLocaleDateString()}</p>
                                    <p className="text-gray-700 mb-4 line-clamp-3">{story.excerpt}</p>
                                    <Link href={`/stories/${story.id}`} className="text-blue-600 font-medium hover:underline">
                                        Read full story →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
