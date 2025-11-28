import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../lib/authContext'
import { useConversations } from '../../lib/chat'
import ConversationList from '../../components/chat/ConversationList'
import ChatWindow from '../../components/chat/ChatWindow'
import Link from 'next/link'

export default function ChatPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const { conversationId } = router.query
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const { conversations, loading: chatLoading } = useConversations(user?.uid || null)

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    // Handle URL query param for conversation
    useEffect(() => {
        if (conversationId && typeof conversationId === 'string') {
            setSelectedId(conversationId)
        }
    }, [conversationId])

    // Select first conversation if none selected and not mobile (desktop view)
    // For simplicity, we won't auto-select on load to avoid confusion on mobile

    if (authLoading || chatLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading chat...</div>
    }

    if (!user || !profile) return null

    const selectedConversation = conversations.find(c => c.id === selectedId)
    const otherUser = selectedConversation?.otherUser

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                            ← Dashboard
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                    </div>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 max-w-7xl mx-auto w-full p-4 h-[calc(100vh-64px)]">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden flex h-full border">

                    {/* Sidebar (Conversation List) */}
                    <div className={`${selectedId ? 'hidden md:block' : 'block'} w-full md:w-1/3 border-r h-full`}>
                        <ConversationList
                            conversations={conversations}
                            selectedId={selectedId}
                            onSelect={(id) => {
                                setSelectedId(id)
                                // Update URL without reload
                                router.push(`/chat?conversationId=${id}`, undefined, { shallow: true })
                            }}
                            currentUserId={user.uid}
                        />
                    </div>

                    {/* Main Chat Window */}
                    <div className={`${!selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col h-full bg-gray-50`}>
                        {selectedId && selectedConversation ? (
                            <>
                                {/* Mobile Back Button */}
                                <div className="md:hidden p-2 bg-white border-b flex items-center">
                                    <button
                                        onClick={() => {
                                            setSelectedId(null)
                                            router.push('/chat', undefined, { shallow: true })
                                        }}
                                        className="text-blue-600 font-medium flex items-center"
                                    >
                                        ‹ Back to list
                                    </button>
                                </div>
                                <ChatWindow
                                    conversationId={selectedId}
                                    currentUser={user}
                                    otherUser={otherUser}
                                />
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-lg font-medium">Select a conversation</p>
                                <p className="text-sm mt-2">Choose a person from the left to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
