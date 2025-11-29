import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../lib/authContext'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function AnalyticsDashboard() {
    const { user, profile } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalAlumni: 0,
        totalStudents: 0,
        totalJobs: 0,
        totalMentorships: 0,
        verifiedAlumni: 0
    })
    const [roleData, setRoleData] = useState<any[]>([])
    const [skillsData, setSkillsData] = useState<any[]>([])

    // Redirect if not admin
    useEffect(() => {
        if (!loading && profile?.role !== 'admin') {
            router.push('/dashboard')
        }
    }, [profile, loading, router])

    useEffect(() => {
        async function fetchStats() {
            try {
                // 1. Profiles Stats
                const profilesSnap = await getDocs(collection(db, 'profiles'))
                let alumni = 0
                let students = 0
                let verified = 0
                const skillsCount: Record<string, number> = {}

                profilesSnap.forEach(doc => {
                    const data = doc.data()
                    if (data.role === 'alumni') {
                        alumni++
                        if (data.verified) verified++
                    } else if (data.role === 'student') {
                        students++
                    }

                    // Count skills
                    if (Array.isArray(data.skills)) {
                        data.skills.forEach((s: string) => {
                            const skill = s.trim()
                            skillsCount[skill] = (skillsCount[skill] || 0) + 1
                        })
                    }
                })

                // 2. Jobs Stats
                const jobsSnap = await getDocs(collection(db, 'jobs'))

                // 3. Mentorship Stats
                const mentorshipSnap = await getDocs(collection(db, 'mentorship_requests'))

                setStats({
                    totalAlumni: alumni,
                    totalStudents: students,
                    totalJobs: jobsSnap.size,
                    totalMentorships: mentorshipSnap.size,
                    verifiedAlumni: verified
                })

                setRoleData([
                    { name: 'Alumni', value: alumni },
                    { name: 'Students', value: students }
                ])

                // Top 5 Skills
                const sortedSkills = Object.entries(skillsCount)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([name, value]) => ({ name, value }))

                setSkillsData(sortedSkills)

            } catch (err) {
                console.error("Error fetching analytics:", err)
            } finally {
                setLoading(false)
            }
        }

        if (profile?.role === 'admin') {
            fetchStats()
        }
    }, [profile])

    if (loading) return <div className="p-8 text-center">Loading analytics...</div>
    if (profile?.role !== 'admin') return null

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Institutional Analytics</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
                        <h3 className="text-gray-500 text-sm font-medium">Total Alumni</h3>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalAlumni}</p>
                        <p className="text-xs text-green-600">{stats.verifiedAlumni} Verified</p>
                    </div>
                    <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
                        <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                    </div>
                    <div className="bg-white p-6 rounded shadow border-l-4 border-purple-500">
                        <h3 className="text-gray-500 text-sm font-medium">Active Jobs</h3>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalJobs}</p>
                    </div>
                    <div className="bg-white p-6 rounded shadow border-l-4 border-orange-500">
                        <h3 className="text-gray-500 text-sm font-medium">Mentorship Requests</h3>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalMentorships}</p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* User Distribution */}
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="text-lg font-bold mb-4">User Distribution</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roleData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }: any) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {roleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Skills */}
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="text-lg font-bold mb-4">Top Skills in Network</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={skillsData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8">
                                        {skillsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
