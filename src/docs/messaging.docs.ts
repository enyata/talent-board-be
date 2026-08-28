/**
 * @swagger
 * tags:
 *   - name: Messaging
 *     description: Consent-gated message request endpoints
 *
 * components:
 *   schemas:
 *     MessageRequestUserSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "a1b2c3d4-1111-4222-8333-123456789abc"
 *         first_name:
 *           type: string
 *           nullable: true
 *           example: "Ada"
 *         last_name:
 *           type: string
 *           nullable: true
 *           example: "Lovelace"
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: "uploads/avatars/ada.png"
 *         role:
 *           type: string
 *           nullable: true
 *           enum: [talent, recruiter]
 *           example: "recruiter"
 *     MessageRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "b2c3d4e5-2222-4333-8444-123456789abc"
 *         intro_note:
 *           type: string
 *           nullable: true
 *           example: "We would like to schedule an interview with you."
 *         status:
 *           type: string
 *           enum: [pending, accepted, declined]
 *           example: "pending"
 *         responded_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         recruiter:
 *           $ref: '#/components/schemas/MessageRequestUserSummary'
 *         talent:
 *           $ref: '#/components/schemas/MessageRequestUserSummary'
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         total:
 *           type: integer
 *           example: 42
 *         totalPages:
 *           type: integer
 *           example: 3
 *         hasNextPage:
 *           type: boolean
 *           example: true
 *         hasPreviousPage:
 *           type: boolean
 *           example: false
 *     ConversationThread:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "c3d4e5f6-3333-4444-8555-123456789abc"
 *         recruiter_last_seen_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         talent_last_seen_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         latest_message_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         latest_message_seen_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         latest_message_seen_status:
 *           type: string
 *           enum: [seen, unseen, no_messages]
 *           example: "seen"
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         accepted_request_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         recruiter:
 *           $ref: '#/components/schemas/MessageRequestUserSummary'
 *         talent:
 *           $ref: '#/components/schemas/MessageRequestUserSummary'
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "d4e5f6a7-4444-4555-8666-123456789abc"
 *         body:
 *           type: string
 *           example: "We would like to schedule an interview with you."
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         source_request_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         sender:
 *           $ref: '#/components/schemas/MessageRequestUserSummary'
 *     ConversationInboxItem:
 *       allOf:
 *         - $ref: '#/components/schemas/ConversationThread'
 *         - type: object
 *           properties:
 *             conversation_partner:
 *               $ref: '#/components/schemas/MessageRequestUserSummary'
 *             latest_message:
 *               allOf:
 *                 - $ref: '#/components/schemas/Message'
 *               nullable: true
 *     MessageTemplate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "intro-product-fit"
 *         title:
 *           type: string
 *           example: "Product Fit Intro"
 *         body:
 *           type: string
 *           example: "Hi {{first_name}}, I came across your profile..."
 *         use_cases:
 *           type: array
 *           items:
 *             type: string
 *             enum: [intro_note, active_message_compose]
 */

export const getConversationInbox = `
  /**
   * @swagger
   * /api/v1/messages/threads:
   *   get:
   *     summary: List active conversation threads
   *     tags: [Messaging]
   *     description: Returns accepted conversation threads for the authenticated recruiter or talent, sorted by most recent activity.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *           minimum: 1
   *         description: Page number to return
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *           minimum: 1
   *           maximum: 100
   *         description: Maximum number of threads to return
   *     responses:
   *       200:
   *         description: Conversation inbox fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "success"
   *                 message:
   *                   type: string
   *                   example: "Conversation inbox fetched successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     threads:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/ConversationInboxItem'
   *                     pagination:
   *                       $ref: '#/components/schemas/PaginationMeta'
   *       401:
   *         description: Unauthorized - token missing or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Forbidden - only recruiters and talents can view conversations
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       422:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
`;

export const getConversationMessages = `
  /**
   * @swagger
   * /api/v1/messages/threads/{threadId}/messages:
   *   get:
   *     summary: List messages in an active conversation thread
   *     tags: [Messaging]
   *     description: Returns messages for an accepted conversation thread. Page 1 loads the most recent messages, and higher pages fetch older history. Messages within each page are returned oldest-to-newest for display. Only the recruiter or talent who belongs to the thread can access it.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: threadId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID of the conversation thread
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *           minimum: 1
   *         description: Page number to return
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *           minimum: 1
   *           maximum: 100
   *         description: Maximum number of messages to return
   *     responses:
   *       200:
   *         description: Conversation messages fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "success"
   *                 message:
   *                   type: string
   *                   example: "Conversation messages fetched successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     messages:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Message'
   *                     pagination:
   *                       $ref: '#/components/schemas/PaginationMeta'
   *       401:
   *         description: Unauthorized - token missing or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Forbidden - only thread participants can view messages
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Conversation thread not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Conflict - conversation is not active
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       422:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
`;

export const markConversationThreadSeen = `
  /**
   * @swagger
   * /api/v1/messages/threads/{threadId}/seen:
   *   patch:
   *     summary: Mark a conversation thread as seen
   *     tags: [Messaging]
   *     description: Marks the thread as seen for the authenticated participant and returns updated latest-message seen timestamp and status.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: threadId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               seen_at:
   *                 type: string
   *                 format: date-time
   *                 description: Optional explicit seen timestamp. Defaults to current time.
   *     responses:
   *       200:
   *         description: Conversation thread marked as seen
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "success"
   *                 message:
   *                   type: string
   *                   example: "Conversation thread marked as seen"
   *                 data:
   *                   type: object
   *                   properties:
   *                     thread:
   *                       $ref: '#/components/schemas/ConversationThread'
   */
`;

export const sendConversationMessage = `
  /**
   * @swagger
   * /api/v1/messages/threads/{threadId}/messages:
   *   post:
   *     summary: Send a message in an active conversation thread
   *     tags: [Messaging]
   *     description: Sends a free-text message in an accepted conversation thread. Line breaks are preserved in the message body.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: threadId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID of the conversation thread
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - body
   *             properties:
   *               body:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 5000
   *                 example: "Thanks for accepting.\\nCan we schedule a call this week?"
   *     responses:
   *       201:
   *         description: Message sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "success"
   *                 message:
   *                   type: string
   *                   example: "Message sent successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     thread:
   *                       $ref: '#/components/schemas/ConversationThread'
   *                     message:
   *                       $ref: '#/components/schemas/Message'
   *       401:
   *         description: Unauthorized - token missing or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Forbidden - only thread participants can send messages
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Conversation thread not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Conflict - conversation is not active
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       422:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
`;

export const createMessageRequest = `
  /**
   * @swagger
   * /api/v1/messages/requests:
   *   post:
   *     summary: Send a message request to a talent
   *     tags: [Messaging]
   *     description: Allows a recruiter to request permission to start a conversation with an approved talent profile. The full conversation does not unlock until the talent accepts.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - talent_id
   *             properties:
   *               talent_id:
   *                 type: string
   *                 format: uuid
   *                 description: ID of the talent receiving the request
   *                 example: "a1b2c3d4-1111-4222-8333-123456789abc"
   *               intro_note:
   *                 type: string
   *                 maxLength: 2000
   *                 description: Optional introductory note from the recruiter
   *                 example: "We would like to schedule an interview with you."
   *     responses:
   *       201:
   *         description: Message request sent successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "success"
   *                 message:
   *                   type: string
   *                   example: "Message request sent successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     request:
   *                       $ref: '#/components/schemas/MessageRequest'
   *       400:
   *         description: Bad request - recruiter attempted an invalid request such as messaging themselves
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Unauthorized - token missing or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Forbidden - only recruiters can send message requests
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Talent not found or not available for messaging
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Conflict - pending request, active conversation, or declined-request cooldown already applies
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       422:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
`;

export const acceptMessageRequest = `
  /**
   * @swagger
   * /api/v1/messages/requests/{requestId}/accept:
   *   patch:
   *     summary: Accept an incoming message request
   *     tags: [Messaging]
   *     description: Allows a talent to accept a pending message request. Acceptance unlocks a persistent conversation thread for the recruiter and talent. If the recruiter sent an intro note, that note becomes the first visible message in the thread.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID of the message request to accept
   *     responses:
   *       200:
   *         description: Message request accepted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "success"
   *                 message:
   *                   type: string
   *                   example: "Message request accepted successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     request:
   *                       $ref: '#/components/schemas/MessageRequest'
   *                     thread:
   *                       $ref: '#/components/schemas/ConversationThread'
   *                     initial_message:
   *                       allOf:
   *                         - $ref: '#/components/schemas/Message'
   *                       nullable: true
   *       401:
   *         description: Unauthorized - token missing or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Forbidden - only talents can accept message requests
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Message request not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Conflict - request has already been accepted or declined
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       422:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
`;

export const declineMessageRequest = `
  /**
   * @swagger
   * /api/v1/messages/requests/{requestId}/decline:
   *   patch:
   *     summary: Decline an incoming message request
   *     tags: [Messaging]
   *     description: Allows a talent to decline a pending message request. Declining closes the request and does not create or unlock a conversation thread.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID of the message request to decline
   *     responses:
   *       200:
   *         description: Message request declined successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "success"
   *                 message:
   *                   type: string
   *                   example: "Message request declined successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     request:
   *                       $ref: '#/components/schemas/MessageRequest'
   *       401:
   *         description: Unauthorized - token missing or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Forbidden - only talents can decline message requests
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Message request not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Conflict - request has already been accepted or declined
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       422:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
`;

export const getIncomingMessageRequests = `
  /**
   * @swagger
   * /api/v1/messages/requests/incoming:
   *   get:
   *     summary: List incoming message requests
   *     tags: [Messaging]
   *     description: Allows a talent to view message requests sent by recruiters. Personal email addresses are not included in the response.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, accepted, declined]
   *         description: Optional request status filter
   *       - in: query
  *         name: page
  *         schema:
  *           type: integer
  *           default: 1
  *           minimum: 1
  *         description: Page number to return
  *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *           minimum: 1
   *           maximum: 100
   *         description: Maximum number of requests to return
   *     responses:
   *       200:
   *         description: Incoming message requests fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "success"
   *                 message:
   *                   type: string
   *                   example: "Incoming message requests fetched successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     requests:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/MessageRequest'
  *                     pagination:
  *                       $ref: '#/components/schemas/PaginationMeta'
   *       401:
   *         description: Unauthorized - token missing or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Forbidden - only talents can view incoming message requests
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       422:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
`;

export const getOutgoingMessageRequests = `
  /**
   * @swagger
   * /api/v1/messages/requests/outgoing:
   *   get:
   *     summary: List outgoing message requests
   *     tags: [Messaging]
   *     description: Allows a recruiter to view message requests they have sent and their current Pending, Accepted, or Declined status.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, accepted, declined]
   *         description: Optional request status filter
   *       - in: query
  *         name: page
  *         schema:
  *           type: integer
  *           default: 1
  *           minimum: 1
  *         description: Page number to return
  *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *           minimum: 1
   *           maximum: 100
   *         description: Maximum number of requests to return
   *     responses:
   *       200:
   *         description: Outgoing message requests fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "success"
   *                 message:
   *                   type: string
   *                   example: "Outgoing message requests fetched successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     requests:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/MessageRequest'
  *                     pagination:
  *                       $ref: '#/components/schemas/PaginationMeta'
   *       401:
   *         description: Unauthorized - token missing or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Forbidden - only recruiters can view outgoing message requests
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       422:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
`;

export const getMessageTemplates = `
  /**
   * @swagger
   * /api/v1/messages/templates:
   *   get:
  *     summary: Fetch fixed role-based message templates
   *     tags: [Messaging]
  *     description: Returns templates based on the authenticated role. Recruiters receive templates for messaging talent (including intro outreach), while talents receive templates for messaging recruiters in active conversation compose.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: use_case
   *         schema:
   *           type: string
   *           enum: [intro_note, active_message_compose]
   *         description: Optional filter by where the template is intended to be used.
  *       - in: query
  *         name: target_user_id
  *         required: true
  *         schema:
  *           type: string
  *           format: uuid
  *         description: Recipient user ID used to personalize template greeting.
   *     responses:
   *       200:
   *         description: Message templates fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "success"
   *                 message:
   *                   type: string
   *                   example: "Message templates fetched successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     templates:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/MessageTemplate'
   */
`;
