import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../../lib/firebase'
import { addDoc, collection } from 'firebase/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { studentUid, mentorUid, message } = req.body as { studentUid: string; mentorUid: string; message?: string }
    if (!studentUid || !mentorUid) return res.status(400).json({ error: 'studentUid and mentorUid required' })

    const docRef = await addDoc(collection(db, 'mentorship_requests'), {
      studentUid,
      mentorUid,
      message: message || '',
      status: 'pending',
      requestedAt: new Date().toISOString(),
    })

    return res.status(200).json({ id: docRef.id })
  } catch (err: any) {
    console.error('Mentorship request error:', err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
