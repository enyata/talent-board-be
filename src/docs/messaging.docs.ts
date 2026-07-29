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
 *     MessageRequestPagination:
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
 */

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
  *                       $ref: '#/components/schemas/MessageRequestPagination'
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
  *                       $ref: '#/components/schemas/MessageRequestPagination'
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
