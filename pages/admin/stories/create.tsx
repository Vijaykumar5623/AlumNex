import { useState } from 'react'
import { useRouter } from 'next/router'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../../../lib/firebase'
import { useAuth } from '../../../lib/authContext'
import Link from 'next/link'

export default function CreateStory() {
    const { user, profile } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        authorName: '',
        imageUrl: ''
    })

    // Redirect if not admin
    if (profile && profile.role !== 'admin') {
        router.push('/dashboard')
        return null
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            await addDoc(collection(db, 'stories'), {
                ...formData,
                authorUid: user?.uid,
                createdAt: new Date().toISOString()
            })
            alert('Story published successfully!')
            router.push('/stories')
        } catch (err) {
            console.error(err)
            alert('Error publishing story')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <h1 className="text-2xl font-bold">Create Success Story</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Author Name (Display)</label>
                        <input
                            required
                            value={formData.authorName}
                            onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                        <input
                            value={formData.imageUrl}
                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="w-full p-2 border rounded"
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Excerpt (Short summary)</label>
                        <textarea
                            required
                            value={formData.excerpt}
                            onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                            className="w-full p-2 border rounded h-20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Content (Markdown supported)</label>
                        <textarea
                            required
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            className="w-full p-2 border rounded h-64 font-mono text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Publishing...' : 'Publish Story'}
                    </button>
                </form>
            </div>
        </div>
    )
}
