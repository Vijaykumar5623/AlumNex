import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import Link from 'next/link'

interface Story {
    id: string
    title: string
    content: string
    authorName: string
    authorUid?: string
    createdAt: string
    imageUrl?: string
}

export default function StoryDetail() {
    const router = useRouter()
    const { id } = router.query
    const [story, setStory] = useState<Story | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return

        async function fetchStory() {
            try {
                const docRef = doc(db, 'stories', id as string)
                const snap = await getDoc(docRef)
                if (snap.exists()) {
                    setStory({ id: snap.id, ...snap.data() } as Story)
                }
            } catch (err) {
                console.error("Error fetching story:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchStory()
    }, [id])

    if (loading) return <div className="p-8 text-center">Loading...</div>
    if (!story) return <div className="p-8 text-center">Story not found.</div>

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <Link href="/stories" className="text-blue-600 hover:underline mb-4 block">← Back to Stories</Link>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{story.title}</h1>
                    <div className="flex items-center text-gray-600 text-sm">
                        <span>By </span>
                        {story.authorUid ? (
                            <Link href={`/profile/${story.authorUid}`} className="ml-1 font-medium text-blue-600 hover:underline">
                                {story.authorName}
                            </Link>
                        ) : (
                            <span className="ml-1 font-medium">{story.authorName}</span>
                        )}
                        <span className="mx-2">•</span>
                        <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {story.imageUrl && (
                    <img src={story.imageUrl} alt={story.title} className="w-full h-96 object-cover rounded-lg shadow mb-8" />
                )}

                <div className="bg-white p-8 rounded-lg shadow prose max-w-none">
                    {/* Simple whitespace handling for now, ideally use a markdown renderer */}
                    {story.content.split('\n').map((para, i) => (
                        <p key={i} className="mb-4 text-lg text-gray-800 leading-relaxed">{para}</p>
                    ))}
                </div>
            </div>
        </div>
    )
}
