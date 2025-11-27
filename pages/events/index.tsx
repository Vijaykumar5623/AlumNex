import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/authContext'
import { db } from '../../lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc, getDoc, addDoc } from 'firebase/firestore'
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
  waitlist?: string[]
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
          waitlist: data.waitlist || [],
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

    // If already registered
    if (event.registrants.includes(user.uid)) {
      setMessage('You are already registered for this event')
      return
    }

    const eventRef = doc(db, 'events', eventId)

    // If event is full, add to waitlist
    if (event.maxAttendees && event.registrants.length >= event.maxAttendees) {
      const currentWaitlist = event.waitlist || []
      if (currentWaitlist.includes(user.uid)) {
        setMessage('You are already on the waitlist')
        return
      }

      try {
        await updateDoc(eventRef, {
          waitlist: [...currentWaitlist, user.uid],
        })
        setMessage('Event is full — you have been added to the waitlist')
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, waitlist: [...(e.waitlist || []), user.uid] } : e))
        )
      } catch (err: any) {
        setMessage(err.message || 'Error joining waitlist')
      }

      return
    }

    try {
      await updateDoc(eventRef, {
        registrants: [...event.registrants, user.uid],
      })
      setMessage('Registered successfully!')
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, registrants: [...e.registrants, user.uid] } : e)))
    } catch (err: any) {
      setMessage(err.message || 'Error registering for event')
    }
  }

  async function unregisterFromEvent(eventId: string, event: Event) {
    if (!user) {
      setMessage('You must be signed in')
      return
    }

    const eventRef = doc(db, 'events', eventId)

    try {
      // If user is on registrants, remove them and promote next from waitlist
      if (event.registrants.includes(user.uid)) {
        const newRegistrants = event.registrants.filter((uid) => uid !== user.uid)
        let newWaitlist = event.waitlist ? [...event.waitlist] : []
        let promoted: string | null = null

        if (newWaitlist.length > 0) {
          promoted = newWaitlist.shift() as string
          newRegistrants.push(promoted)
        }

        await updateDoc(eventRef, {
          registrants: newRegistrants,
          waitlist: newWaitlist,
        })

        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId ? { ...e, registrants: newRegistrants, waitlist: newWaitlist } : e
          )
        )

        setMessage('Registration cancelled')

        // Notify promoted user if any
        if (promoted) {
          try {
            await addDoc(collection(db, 'notifications'), {
              userId: promoted,
              type: 'event_promoted',
              message: `You have been moved off the waitlist and registered for ${event.title}`,
              createdAt: new Date().toISOString(),
              read: false,
            })
          } catch (nerr) {
            console.warn('Failed to notify promoted user:', nerr)
          }
        }
      } else if (event.waitlist && event.waitlist.includes(user.uid)) {
        // If user is on waitlist, remove them
        const newWaitlist = event.waitlist.filter((uid) => uid !== user.uid)
        await updateDoc(eventRef, { waitlist: newWaitlist })
        setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, waitlist: newWaitlist } : e)))
        setMessage('Removed from waitlist')
      } else {
        setMessage('You are not registered for this event')
      }
    } catch (err: any) {
      setMessage(err.message || 'Error updating registration')
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
                        {isPast ? (
                          <button className="px-4 py-2 rounded font-medium text-sm bg-gray-300 text-gray-600 cursor-not-allowed">Event Ended</button>
                        ) : user && event.registrants.includes(user.uid) ? (
                          <button
                            onClick={() => unregisterFromEvent(event.id, event)}
                            className="px-4 py-2 rounded font-medium text-sm bg-gray-300 text-gray-600"
                          >
                            Cancel Registration
                          </button>
                        ) : isFull ? (
                          event.waitlist && event.waitlist.includes(user?.uid || '') ? (
                            <button
                              onClick={() => unregisterFromEvent(event.id, event)}
                              className="px-4 py-2 rounded font-medium text-sm bg-yellow-100 text-yellow-800"
                            >
                              Leave Waitlist
                            </button>
                          ) : (
                            <button
                              onClick={() => registerForEvent(event.id, event)}
                              className="px-4 py-2 rounded font-medium text-sm bg-yellow-600 text-white hover:bg-yellow-700"
                            >
                              Join Waitlist
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => registerForEvent(event.id, event)}
                            className="px-4 py-2 rounded font-medium text-sm bg-purple-600 text-white hover:bg-purple-700"
                          >
                            Register
                          </button>
                        )}
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
