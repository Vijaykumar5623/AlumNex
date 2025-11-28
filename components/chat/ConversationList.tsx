import { Conversation } from '../../lib/chat'
// import { formatDistanceToNow } from 'date-fns' // Removed to avoid dependency

// Simple date formatter if date-fns is not available
function formatTime(timestamp: any) {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })
}

interface ConversationListProps {
    conversations: Conversation[]
    selectedId: string | null
    onSelect: (id: string) => void
    currentUserId: string
}

export default function ConversationList({ conversations, selectedId, onSelect, currentUserId }: ConversationListProps) {
    return (
        <div className="flex flex-col h-full bg-white border-r">
            <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        No conversations yet.
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const otherUser = conv.otherUser || {}
                        const isSelected = conv.id === selectedId
                        const isUnread = (conv.unreadCount?.[currentUserId] || 0) > 0

                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelect(conv.id)}
                                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-medium ${isUnread ? 'text-black font-bold' : 'text-gray-900'}`}>
                                        {otherUser.name || otherUser.email || 'Unknown User'}
                                    </span>
                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                        {formatTime(conv.lastMessageAt)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-sm truncate pr-2 ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                        {conv.lastMessageBy === currentUserId ? 'You: ' : ''}
                                        {conv.lastMessage || 'Started a conversation'}
                                    </p>
                                    {isUnread && (
                                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                    )}
                                </div>
                            </button>
                        )
                    })
                )}
            </div>
        </div>
    )
}
