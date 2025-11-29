import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function DebugDB() {
    const [alumni, setAlumni] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch all profiles with role 'alumni'
                const q = query(collection(db, 'profiles'), where('role', '==', 'alumni'))
                const querySnapshot = await getDocs(q)
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setAlumni(data)
            } catch (error) {
                console.error("Error fetching alumni:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) return <div className="p-4">Loading...</div>

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Debug DB: Alumni</h1>
                <button
                    onClick={async () => {
                        setError('')
                        setSuccess('')
                        if (confirm('Are you sure you want to seed the database? This will add dummy data.')) {
                            try {
                                const { seedDatabase } = await import('../../lib/seed')
                                await seedDatabase()
                                setSuccess('Seeding complete! Refresh to see changes.')
                                window.location.reload()
                            } catch (e: any) {
                                console.error(e)
                                setError(e.message)
                            }
                        }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Seed Database
                </button>
            </div>

            {error && (
                <div id="seed-error" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {success && (
                <div id="seed-success" className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}
            <table className="w-full border-collapse border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2">Role</th>
                        <th className="border p-2">Name</th>
                        <th className="border p-2">Email</th>
                        <th className="border p-2">Verified?</th>
                        <th className="border p-2">Skills (Raw)</th>
                        <th className="border p-2">Skills (Type)</th>
                    </tr >
                </thead >
                <tbody>
                    {alumni.map((a) => (
                        <tr key={a.id} className={a.role === 'alumni' ? 'bg-blue-50' : ''}>
                            <td className="border p-2">{a.role}</td>
                            <td className="border p-2">{a.name}</td>
                            <td className="border p-2">{a.email}</td>
                            <td className="border p-2">{String(a.verified)}</td>
                            <td className="border p-2">{JSON.stringify(a.skills)}</td>
                            <td className="border p-2">{Array.isArray(a.skills) ? 'Array' : typeof a.skills}</td>
                        </tr>
                    ))}
                </tbody>
            </table >
        </div >
    )
}
