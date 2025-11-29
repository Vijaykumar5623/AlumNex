import { db } from './firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export interface MentorCandidate {
  uid: string
  name?: string
  email?: string
  skills: string[]
  score: number
  commonSkills: string[]
  company?: string
  location?: string
  jobTitle?: string
}

export interface MatchFilters {
  location?: string
  company?: string
  name?: string
}

/**
 * Simple rule-based matcher: counts overlapping skills and returns top N alumni
 */
export async function findTopMentors(studentSkills: string[], filters: MatchFilters = {}, topN = 5): Promise<MentorCandidate[]> {
  const candidates: MentorCandidate[] = []

  // Query verified alumni
  const q = query(collection(db, 'profiles'), where('role', '==', 'alumni'), where('verified', '==', true))
  const snap = await getDocs(q)

  for (const doc of snap.docs) {
    const data = doc.data() as any

    // Apply Filters
    if (filters.location && !data.location?.toLowerCase().includes(filters.location.toLowerCase())) continue
    if (filters.company && !data.company?.toLowerCase().includes(filters.company.toLowerCase())) continue
    if (filters.name && !data.name?.toLowerCase().includes(filters.name.toLowerCase())) continue

    const alumniSkills: string[] = Array.isArray(data.skills) ? data.skills.map((s: any) => String(s).toLowerCase().trim()) : []
    const normalizedStudent = studentSkills.map((s) => String(s).toLowerCase().trim())

    // Improved matching: check for partial matches
    const common = alumniSkills.filter((aS) =>
      normalizedStudent.some(sS => aS.includes(sS) || sS.includes(aS))
    )

    // Weighted Scoring System
    // Base score from skills (5 points each)
    let score = common.length * 5

    // Location bonus (10 points)
    if (filters.location && data.location?.toLowerCase().includes(filters.location.toLowerCase())) {
      score += 10
    }

    // Company bonus (10 points)
    if (filters.company && data.company?.toLowerCase().includes(filters.company.toLowerCase())) {
      score += 10
    }

    // If skills are provided, only show those with score > 0. If no skills provided, show all (filtered by other criteria)
    if (studentSkills.length > 0 && common.length === 0 && score === 0) continue

    candidates.push({
      uid: doc.id,
      name: data.name || '',
      email: data.email || '',
      skills: alumniSkills,
      score,
      commonSkills: common,
      company: data.company,
      location: data.location,
      jobTitle: data.jobTitle
    })
  }

  // Sort by score desc, then by name
  candidates.sort((a, b) => b.score - a.score || (a.name || '').localeCompare(b.name || ''))

  return candidates.slice(0, topN)
}
