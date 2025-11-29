import type { NextApiRequest, NextApiResponse } from 'next'
import { findTopMentors } from '../../lib/matching'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { skills, topN, filters } = req.body as { skills?: string[]; topN?: number; filters?: any }
    // if (!skills || !Array.isArray(skills)) return res.status(400).json({ error: 'skills (string[]) required' }) // Allow empty skills for pure filtering

    const matches = await findTopMentors(skills || [], filters, topN || 20)
    return res.status(200).json({ matches })
  } catch (err: any) {
    console.error('Match API error:', err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
