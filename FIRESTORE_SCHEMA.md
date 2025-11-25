// Firestore Collection Schemas for Alumni Management Platform
//
// These are the expected Firestore collections and document structures.
// Collections are created automatically when documents are written, but
// it helps to understand the schema beforehand.

// ============================================
// PROFILES COLLECTION
// ============================================
// Collection: /profiles/{uid}
// Purpose: User profile information and verification status
{
  "uid": "string",
  "email": "string",
  "role": "student" | "alumni" | "admin",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp (optional)",
  "verified": "boolean (alumni only)",
  "name": "string (optional)",
  "bio": "string (optional)",
  "company": "string (optional)",
  "skills": ["string array"],
  "avatar": "string (storage path, optional)"
}

// ============================================
// DOCUMENTS COLLECTION
// ============================================
// Collection: /documents/{docId}
// Purpose: Document uploads for verification
{
  "id": "string (auto-generated)",
  "userId": "string (UID of alumni who uploaded)",
  "filename": "string",
  "fileType": "string (e.g., application/pdf)",
  "fileSize": "number (bytes)",
  "uploadedAt": "ISO timestamp",
  "status": "pending" | "approved" | "rejected",
  "rejectionReason": "string (optional, if rejected)",
  "storagePath": "string (path in Firebase Storage)"
}

// ============================================
// JOBS COLLECTION
// ============================================
// Collection: /jobs/{jobId}
// Purpose: Job and internship postings
{
  "id": "string (auto-generated)",
  "createdBy": "string (UID of alumni who posted)",
  "title": "string",
  "description": "string",
  "company": "string",
  "location": "string",
  "remote": "boolean",
  "tags": ["string array"],
  "applyLink": "string (optional)",
  "createdAt": "ISO timestamp",
  "expiresAt": "ISO timestamp (optional)",
  "applicants": ["string array of UIDs"]
}

// ============================================
// EVENTS COLLECTION
// ============================================
// Collection: /events/{eventId}
// Purpose: Events created by alumni
{
  "id": "string (auto-generated)",
  "createdBy": "string (UID of alumni who created)",
  "title": "string",
  "description": "string",
  "date": "ISO timestamp",
  "location": "string",
  "tags": ["string array"],
  "maxAttendees": "number (optional)",
  "registrants": ["string array of UIDs"],
  "createdAt": "ISO timestamp"
}

// ============================================
// MENTORSHIP_REQUESTS COLLECTION
// ============================================
// Collection: /mentorship_requests/{requestId}
// Purpose: Mentorship requests from students to alumni
{
  "id": "string (auto-generated)",
  "studentUid": "string",
  "mentorUid": "string (alumni)",
  "status": "pending" | "accepted" | "rejected",
  "message": "string (student's message)",
  "requestedAt": "ISO timestamp",
  "respondedAt": "ISO timestamp (optional)",
  "sessionStarted": "ISO timestamp (optional)",
  "sessionEnded": "ISO timestamp (optional)",
  "feedback": "string (optional)"
}

// ============================================
// CONVERSATIONS COLLECTION
// ============================================
// Collection: /conversations/{conversationId}
// Purpose: 1:1 chat conversations
{
  "id": "string (auto-generated)",
  "participants": ["string array with 2 UIDs"],
  "createdAt": "ISO timestamp",
  "lastMessageAt": "ISO timestamp",
  "lastMessage": "string (preview)"
}

// ============================================
// MESSAGES COLLECTION (Subcollection)
// ============================================
// Collection: /conversations/{conversationId}/messages/{messageId}
// Purpose: Individual messages in a conversation
{
  "id": "string (auto-generated)",
  "senderId": "string (UID)",
  "text": "string",
  "createdAt": "ISO timestamp",
  "read": "boolean"
}

// ============================================
// NOTIFICATIONS COLLECTION
// ============================================
// Collection: /notifications/{notificationId}
// Purpose: In-app notifications for users
{
  "id": "string (auto-generated)",
  "userId": "string (recipient UID)",
  "type": "document_approved" | "document_rejected" | "job_applied" | "mentorship_accepted",
  "message": "string",
  "createdAt": "ISO timestamp",
  "read": "boolean"
}

// ============================================
// ANALYTICS COLLECTION
// ============================================
// Collection: /analytics/{docId}
// Purpose: Platform usage and engagement metrics
{
  "date": "ISO date string (YYYY-MM-DD)",
  "totalUsers": "number",
  "totalAlumni": "number",
  "totalStudents": "number",
  "verifiedAlumni": "number",
  "jobsPosted": "number",
  "eventsCreated": "number",
  "mentorshipRequests": "number",
  "chatMessages": "number"
}

// ============================================
// HOW TO USE IN FIRESTORE
// ============================================
// 1. Firestore collections are created automatically when you write documents
// 2. You don't need to create them manually in Firebase console
// 3. When users sign up and create documents, the collections will auto-create
// 4. Document IDs can be auto-generated (use add()) or custom (use setDoc())

// Example Firestore write operations:
// 1. Create/update profile:
//    setDoc(doc(db, 'profiles', uid), { ...profileData })
//
// 2. Add a document (with auto ID):
//    addDoc(collection(db, 'documents'), { ...documentData })
//
// 3. Query documents by user:
//    const q = query(collection(db, 'documents'), where('userId', '==', uid))
//    const snapshot = await getDocs(q)
