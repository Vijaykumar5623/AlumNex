import { useState } from 'react'
import Link from 'next/link'
import { db } from '../../lib/firebase'
import { setDoc, doc, addDoc, collection } from 'firebase/firestore'

const SAMPLE_ALUMNI = [
  { uid: 'alumni_1', name: 'Asha Kumar', email: 'asha.kumar@example.com', skills: ['react', 'node.js', 'firebase'] },
  { uid: 'alumni_2', name: 'Ravi Patel', email: 'ravi.patel@example.com', skills: ['python', 'ml', 'data-science'] },
  { uid: 'alumni_3', name: 'Neha Singh', email: 'neha.singh@example.com', skills: ['java', 'spring', 'microservices'] },
  { uid: 'alumni_4', name: 'Karan Sharma', email: 'karan.sharma@example.com', skills: ['react', 'design', 'ui/ux'] },
  { uid: 'alumni_5', name: 'Priya Rao', email: 'priya.rao@example.com', skills: ['node.js', 'aws', 'devops'] },
]

export default function SeedAlumni() {
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')

  async function runSeed() {
    setRunning(true)
    setMessage('Seeding...')
    try {
      for (const a of SAMPLE_ALUMNI) {
        await setDoc(doc(db, 'profiles', a.uid), {
          uid: a.uid,
          email: a.email,
          name: a.name,
          role: 'alumni',
          skills: a.skills,
          verified: true,
          createdAt: new Date().toISOString(),
        })

        // Create a mock documents entry for admin review UI (optional)
        await addDoc(collection(db, 'documents'), {
          userId: a.uid,
          filename: 'Degree_Certificate.pdf',
          fileType: 'application/pdf',
          fileSize: 123456,
          uploadedAt: new Date().toISOString(),
          status: 'approved',
          storagePath: `documents/${a.uid}/Degree_Certificate.pdf`,
        })
      }

      setMessage('Seed completed — 5 alumni profiles created.')
    } catch (err: any) {
      setMessage('Seed failed: ' + (err.message || String(err)))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Dev: Seed Sample Alumni</h1>
        <p className="text-sm text-gray-600 mb-4">This page creates 5 sample verified alumni profiles in Firestore. Use this only in development.</p>

        <div className="flex gap-3">
          <button onClick={runSeed} disabled={running} className="px-4 py-2 bg-blue-600 text-white rounded">
            {running ? 'Seeding...' : 'Run Seed'}
          </button>
          <Link href="/mentorship" className="px-4 py-2 bg-gray-200 rounded">Open Mentorship Page</Link>
        </div>

        {message && <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">{message}</div>}
      </div>
    </div>
  )
}
