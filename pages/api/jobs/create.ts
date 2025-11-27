import type { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../lib/firebase'
import { addDoc, collection } from 'firebase/firestore'

type Req = NextApiRequest
type Res = NextApiResponse

export default async function handler(req: Req, res: Res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const body = req.body as any
    const { createdBy, title, description, company, location, remote, tags, applyLink } = body

    // Basic validation
    if (!createdBy || typeof createdBy !== 'string') return res.status(400).json({ error: 'createdBy required' })
    if (!title || typeof title !== 'string' || title.trim().length < 3) return res.status(400).json({ error: 'title required (min 3 chars)' })
    if (!description || typeof description !== 'string' || description.trim().length < 10) return res.status(400).json({ error: 'description required (min 10 chars)' })
    if (!company || typeof company !== 'string' || company.trim().length < 2) return res.status(400).json({ error: 'company required' })

    // sanitize tags
    const safeTags = Array.isArray(tags) ? tags.map((t: any) => String(t).trim()).filter(Boolean) : []

    // validate applyLink if provided
    if (applyLink && typeof applyLink === 'string') {
      try {
        // eslint-disable-next-line no-new
        new URL(applyLink)
      } catch (_) {
        return res.status(400).json({ error: 'applyLink must be a valid URL' })
      }
    }

    const docRef = await addDoc(collection(db, 'jobs'), {
      createdBy,
      title: title.trim(),
      description: description.trim(),
      company: company.trim(),
      location: (location && String(location).trim()) || 'Remote',
      remote: !!remote,
      tags: safeTags,
      applyLink: (applyLink && String(applyLink).trim()) || '',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      applicants: [],
    })

    return res.status(200).json({ id: docRef.id })
  } catch (err: any) {
    console.error('Jobs create API error:', err)
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
