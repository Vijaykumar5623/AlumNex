import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    serverTimestamp,
    onSnapshot,
    doc,
    updateDoc,
    getDocs,
    limit,
    Timestamp,
    setDoc,
    getDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { useState, useEffect } from 'react'

export interface Message {
    id: string
    text: string
    senderId: string
    createdAt: Timestamp
    read: boolean
}

export interface Conversation {
    id: string
    participants: string[]
    lastMessage: string
    lastMessageAt: Timestamp
    lastMessageBy: string
    unreadCount?: Record<string, number>
    otherUser?: any // Helper for UI to store other user's profile
}

// Create or get existing conversation
export async function createConversation(currentUserId: string, otherUserId: string) {
    // 1. Check if conversation already exists
    // Note: In a production app with millions of docs, this query might need a specific composite index
    // or a different data structure (e.g. storing conversationId in user profile).
    // For this prototype, we'll query for conversations where current user is a participant
    // and then filter client-side for the other user.

    const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUserId)
    )

    const snapshot = await getDocs(q)
    const existing = snapshot.docs.find(doc => {
        const data = doc.data()
        return data.participants.includes(otherUserId)
    })

    if (existing) {
        return existing.id
    }

    // 2. Create new conversation
    const newConv = await addDoc(collection(db, 'conversations'), {
        participants: [currentUserId, otherUserId],
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        lastMessageBy: '',
        unreadCount: {
            [currentUserId]: 0,
            [otherUserId]: 0
        }
    })

    return newConv.id
}

// Send a message
export async function sendMessage(conversationId: string, senderId: string, text: string, otherUserId: string) {
    // 1. Add message to subcollection
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        text,
        senderId,
        createdAt: serverTimestamp(),
        read: false
    })

    // 2. Update parent conversation with last message and increment unread for recipient
    const convRef = doc(db, 'conversations', conversationId)

    // We need to get the current unread count to increment it safely (or use increment())
    // For simplicity here, we'll just update the map. 
    // Ideally use: unreadCount: { [otherUserId]: increment(1) } but nested field updates can be tricky with dynamic keys in simple updateDoc
    // So we will just set lastMessage for now.

    await updateDoc(convRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastMessageBy: senderId,
        // Simple way to mark unread for the other user (logic can be improved)
        [`unreadCount.${otherUserId}`]: 1
    })
}

// Hook: List conversations
export function useConversations(userId: string | null) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) {
            setConversations([])
            setLoading(false)
            return
        }

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', userId),
            orderBy('lastMessageAt', 'desc')
        )

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const convs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Conversation[]

            // Fetch other user profiles for UI
            // In a real app, you might cache this or store basic profile info in the conversation doc
            const enrichedConvs = await Promise.all(convs.map(async (conv) => {
                const otherUid = conv.participants.find(p => p !== userId)
                if (otherUid) {
                    try {
                        const userSnap = await getDoc(doc(db, 'profiles', otherUid))
                        if (userSnap.exists()) {
                            conv.otherUser = userSnap.data()
                        }
                    } catch (e) {
                        console.error('Error fetching chat partner profile', e)
                    }
                }
                return conv
            }))

            setConversations(enrichedConvs)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [userId])

    return { conversations, loading }
}

// Hook: List messages in a conversation
export function useMessages(conversationId: string | null) {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!conversationId) {
            setMessages([])
            setLoading(false)
            return
        }

        const q = query(
            collection(db, 'conversations', conversationId, 'messages'),
            orderBy('createdAt', 'asc')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[]
            setMessages(msgs)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [conversationId])

    return { messages, loading }
}
