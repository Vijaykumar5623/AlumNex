import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../lib/authContext'
import Link from 'next/link'

interface Topic {
    id: string
    title: string
    category: string
    authorName: string
    createdAt: string
    replyCount: number
}

export default function CommunityIndex() {
    const { user, profile } = useAuth()
    const [topics, setTopics] = useState<Topic[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [newTopic, setNewTopic] = useState({ title: '', category: 'General', content: '' })

    useEffect(() => {
        fetchTopics()
    }, [])

    async function fetchTopics() {
        try {
            const q = query(collection(db, 'forum_topics'), orderBy('createdAt', 'desc'))
            const snap = await getDocs(q)
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic))
            setTopics(data)
        } catch (err) {
            console.error("Error fetching topics:", err)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!user) return
        try {
            await addDoc(collection(db, 'forum_topics'), {
                title: newTopic.title,
                category: newTopic.category,
                content: newTopic.content,
                authorUid: user.uid,
                authorName: profile?.name || user.email,
                createdAt: new Date().toISOString(),
                replyCount: 0
            })
            setNewTopic({ title: '', category: 'General', content: '' })
            setShowCreate(false)
            fetchTopics()
        } catch (err) {
            console.error("Error creating topic:", err)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Community Forums</h1>
                    <div className="flex gap-4">
                        <Link href="/dashboard" className="text-blue-600 hover:underline flex items-center">Back to Dashboard</Link>
                        {user && (
                            <button
                                onClick={() => setShowCreate(!showCreate)}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                {showCreate ? 'Cancel' : 'New Topic'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {showCreate && (
                    <div className="bg-white p-6 rounded shadow mb-8 animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">Start a New Discussion</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    required
                                    value={newTopic.title}
                                    onChange={e => setNewTopic({ ...newTopic, title: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    placeholder="What's on your mind?"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select
                                    value={newTopic.category}
                                    onChange={e => setNewTopic({ ...newTopic, category: e.target.value })}
                                    className="w-full p-2 border rounded"
                                >
                                    <option>General</option>
                                    <option>Careers</option>
                                    <option>Tech Talk</option>
                                    <option>Events</option>
                                    <option>Alumni News</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Content</label>
                                <textarea
                                    required
                                    value={newTopic.content}
                                    onChange={e => setNewTopic({ ...newTopic, content: e.target.value })}
                                    className="w-full p-2 border rounded h-32"
                                    placeholder="Elaborate on your topic..."
                                />
                            </div>
                            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Post Topic</button>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-600">Loading discussions...</div>
                    ) : topics.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">No discussions yet. Be the first to post!</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left p-4 font-medium text-gray-600">Topic</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Category</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Author</th>
                                    <th className="text-center p-4 font-medium text-gray-600">Replies</th>
                                    <th className="text-right p-4 font-medium text-gray-600">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {topics.map(topic => (
                                    <tr key={topic.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <Link href={`/community/${topic.id}`} className="text-blue-600 font-medium hover:underline text-lg block">
                                                {topic.title}
                                            </Link>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs uppercase tracking-wide">{topic.category}</span>
                                        </td>
                                        <td className="p-4 text-gray-600">{topic.authorName}</td>
                                        <td className="p-4 text-center text-gray-600">{topic.replyCount}</td>
                                        <td className="p-4 text-right text-gray-500 text-sm">{new Date(topic.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
