import { db } from './firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export interface MentorCandidate {
  uid: string
  name?: string
  email?: string
  skills: string[]
  score: number
  commonSkills: string[]
}

/**
 * Simple rule-based matcher: counts overlapping skills and returns top N alumni
 */
export async function findTopMentors(studentSkills: string[], topN = 5): Promise<MentorCandidate[]> {
  const candidates: MentorCandidate[] = []

  // Query verified alumni
  const q = query(collection(db, 'profiles'), where('role', '==', 'alumni'), where('verified', '==', true))
  const snap = await getDocs(q)

  for (const doc of snap.docs) {
    const data = doc.data() as any
    const alumniSkills: string[] = Array.isArray(data.skills) ? data.skills.map((s: any) => String(s).toLowerCase()) : []
    const normalizedStudent = studentSkills.map((s) => String(s).toLowerCase())
    const common = alumniSkills.filter((s) => normalizedStudent.includes(s))

    const score = common.length // simple score = number of overlapping skills

    candidates.push({
      uid: doc.id,
      name: data.name || '',
      email: data.email || '',
      skills: alumniSkills,
      score,
      commonSkills: common,
    })
  }

  // Sort by score desc, then by name
  candidates.sort((a, b) => b.score - a.score || (a.name || '').localeCompare(b.name || ''))

  return candidates.slice(0, topN)
}
