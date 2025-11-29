import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../lib/authContext'
import Link from 'next/link'

interface Topic {
    id: string
    title: string
    content: string
    authorName: string
    authorUid: string
    createdAt: string
    category: string
}

interface Reply {
    id: string
    content: string
    authorName: string
    authorUid: string
    createdAt: string
}

export default function TopicDetail() {
    const router = useRouter()
    const { topicId } = router.query
    const { user, profile } = useAuth()

    const [topic, setTopic] = useState<Topic | null>(null)
    const [replies, setReplies] = useState<Reply[]>([])
    const [loading, setLoading] = useState(true)
    const [replyContent, setReplyContent] = useState('')

    useEffect(() => {
        if (!topicId) return
        fetchData()
    }, [topicId])

    async function fetchData() {
        try {
            // Fetch Topic
            const topicRef = doc(db, 'forum_topics', topicId as string)
            const topicSnap = await getDoc(topicRef)
            if (topicSnap.exists()) {
                setTopic({ id: topicSnap.id, ...topicSnap.data() } as Topic)

                // Fetch Replies
                const q = query(collection(db, 'forum_replies'), where('topicId', '==', topicId), orderBy('createdAt', 'asc'))
                const replySnap = await getDocs(q)
                const replyData = replySnap.docs.map(d => ({ id: d.id, ...d.data() } as Reply))
                setReplies(replyData)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function handleReply(e: React.FormEvent) {
        e.preventDefault()
        if (!user || !topic) return

        try {
            await addDoc(collection(db, 'forum_replies'), {
                topicId: topic.id,
                content: replyContent,
                authorUid: user.uid,
                authorName: profile?.name || user.email,
                createdAt: new Date().toISOString()
            })

            // Increment reply count
            await updateDoc(doc(db, 'forum_topics', topic.id), {
                replyCount: increment(1)
            })

            setReplyContent('')
            fetchData() // Refresh
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>
    if (!topic) return <div className="p-8 text-center">Topic not found.</div>

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <Link href="/community" className="text-blue-600 hover:underline mb-4 block">← Back to Forums</Link>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold uppercase">{topic.category}</span>
                        <span className="text-gray-500 text-sm">• {new Date(topic.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{topic.title}</h1>
                    <div className="flex items-center gap-3 border-b pb-6">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
                            {topic.authorName[0].toUpperCase()}
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">{topic.authorName}</div>
                            <div className="text-xs text-gray-500">Original Poster</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Original Post Content */}
                <div className="bg-white p-8 rounded shadow mb-8">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{topic.content}</p>
                </div>

                {/* Replies */}
                <h3 className="text-lg font-bold text-gray-700 mb-4">{replies.length} Replies</h3>
                <div className="space-y-6 mb-12">
                    {replies.map(reply => (
                        <div key={reply.id} className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{reply.authorName}</span>
                                    {reply.authorUid === topic.authorUid && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">OP</span>}
                                </div>
                                <span className="text-xs text-gray-500">{new Date(reply.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap">{reply.content}</p>
                        </div>
                    ))}
                </div>

                {/* Reply Form */}
                {user ? (
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="text-lg font-bold mb-4">Leave a Reply</h3>
                        <form onSubmit={handleReply}>
                            <textarea
                                required
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                className="w-full p-4 border rounded mb-4 h-32"
                                placeholder="Join the discussion..."
                            />
                            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Post Reply</button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-blue-50 p-6 rounded text-center text-blue-800">
                        Please <Link href="/login" className="underline font-bold">sign in</Link> to reply.
                    </div>
                )}
            </div>
        </div>
    )
}
