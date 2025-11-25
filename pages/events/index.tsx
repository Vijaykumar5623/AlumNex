import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/authContext'
import { db } from '../../lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  tags: string[]
  maxAttendees?: number
  registrants: string[]
  createdBy: string
  createdByName?: string
  createdAt: string
}

export default function BrowseEvents() {
  const { user, profile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTag, setFilterTag] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    try {
      const snapshot = await getDocs(collection(db, 'events'))
      const eventsList: Event[] = []

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as any
        const creatorSnap = await getDoc(doc(db, 'profiles', data.createdBy))
        const creatorData = creatorSnap.data()

        eventsList.push({
          id: docSnap.id,
          title: data.title,
          description: data.description,
          date: data.date,
          location: data.location || 'Online',
          tags: data.tags || [],
          maxAttendees: data.maxAttendees,
          registrants: data.registrants || [],
          createdBy: data.createdBy,
          createdByName: creatorData?.name || 'Alumni',
          createdAt: data.createdAt,
        })
      }

      // Sort by date ascending
      eventsList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setEvents(eventsList)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching events:', err)
      setLoading(false)
    }
  }

  async function registerForEvent(eventId: string, event: Event) {
    if (!user) {
      setMessage('You must be signed in to register')
      return
    }

    if (event.maxAttendees && event.registrants.length >= event.maxAttendees) {
      setMessage('Event is full')
      return
    }

    try {
      const eventRef = doc(db, 'events', eventId)
      if (!event.registrants.includes(user.uid)) {
        await updateDoc(eventRef, {
          registrants: [...event.registrants, user.uid],
        })
        setMessage('Registered successfully!')
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId ? { ...e, registrants: [...e.registrants, user.uid] } : e
          )
        )
      } else {
        setMessage('You are already registered for this event')
      }
    } catch (err: any) {
      setMessage(err.message || 'Error registering for event')
    }
  }

  const filteredEvents = filterTag
    ? events.filter((e) => e.tags.map((t) => t.toLowerCase()).includes(filterTag.toLowerCase()))
    : events

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Events</h1>
            <p className="text-sm text-gray-600">Discover events hosted by alumni</p>
          </div>
          <div className="flex gap-2">
            {profile?.role === 'alumni' && (
              <Link href="/events/create" className="px-4 py-2 bg-blue-600 text-white rounded">
                Create Event
              </Link>
            )}
            <Link href="/dashboard" className="px-4 py-2 bg-gray-200 rounded">
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : (
          <>
            {/* Filter */}
            <div className="mb-6 flex gap-2">
              <input
                type="text"
                placeholder="Filter by tag (e.g., Networking)"
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              {filterTag && (
                <button onClick={() => setFilterTag('')} className="px-4 py-2 bg-gray-200 rounded">
                  Clear
                </button>
              )}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="bg-white p-8 rounded shadow text-center text-gray-600">
                No events found. Check back soon!
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredEvents.map((event) => {
                  const eventDate = new Date(event.date)
                  const isPast = eventDate < new Date()
                  const isFull = event.maxAttendees && event.registrants.length >= event.maxAttendees

                  return (
                    <div key={event.id} className={`rounded shadow hover:shadow-md transition ${isPast ? 'bg-gray-100' : 'bg-white'} p-6`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                          <p className="text-sm text-gray-600">
                            {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location}
                          </p>
                        </div>
                        <div className="text-right">
                          {isPast && <span className="px-3 py-1 bg-gray-300 text-gray-800 text-xs rounded">Past</span>}
                          {isFull && <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded">Full</span>}
                          <div className="text-xs text-gray-500 mt-2">{event.registrants.length} registered</div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>

                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {event.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">Hosted by {event.createdByName}</p>
                        <button
                          onClick={() => registerForEvent(event.id, event)}
                          disabled={!!((user && event.registrants.includes(user.uid)) || isPast || isFull)}
                          className={`px-4 py-2 rounded font-medium text-sm ${
                            isPast
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : isFull
                              ? 'bg-red-300 text-red-600 cursor-not-allowed'
                              : user && event.registrants.includes(user.uid)
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {isPast ? 'Event Ended' : isFull ? 'Full' : user && event.registrants.includes(user.uid) ? '✓ Registered' : 'Register'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
