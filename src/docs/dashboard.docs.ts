/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Endpoints for retrieving dashboard information for users
 */

export const talentDashboard = `
  /**
   * @swagger
   * /api/v1/dashboard/talent:
   *   get:
   *     summary: Get talent dashboard data
   *     tags: [Dashboard]
  *     description: Fetches real-time dashboard metrics for a talent user.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Talent dashboard data retrieved successfully
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
   *                   example: "Talent dashboard data fetched successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     profile_status:
   *                       type: string
   *                       enum: [pending, approved, rejected]
   *                       example: "approved"
   *                     total_upvotes:
   *                       type: number
   *                       example: 10
   *                     profile_views:
   *                       type: number
   *                       example: 25
   *                     search_appearances:
   *                       type: number
   *                       example: 12
   *                     recruiter_saves:
   *                       type: number
   *                       example: 5
   *       401:
   *         description: Unauthorized - Token missing or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "Unauthorized"
   *               status_code: 401
   *       403:
   *         description: Forbidden - User role not permitted
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "Forbidden"
   *               status_code: 403
   *       405:
   *         description: Method Not Allowed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "Method not allowed"
   *               status_code: 405
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "Something went wrong!"
   *               status_code: 500
   */
`;

export const recruiterDashboard = `
  /**
   * @swagger
   * /api/v1/dashboard/recruiter:
   *   get:
   *     summary: Get recruiter dashboard data
   *     tags: [Dashboard]
   *     description: Fetches personalized dashboard information for a recruiter user including saved and recommended talents.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Recruiter dashboard data retrieved successfully
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
   *                   example: "Dashboard fetched successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     welcome_message:
   *                       type: string
   *                       example: "Good morning Jane, ready to find your next great hire?"
   *                     saved_talents:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           first_name:
   *                             type: string
   *                           last_name:
   *                             type: string
   *                           avatar:
   *                             type: string
   *                             example: "https://example.com/avatar.png"
   *                           state:
   *                             type: string
   *                           country:
   *                             type: string
   *                           linkedin_profile:
   *                             type: string
   *                           skills:
   *                             type: array
   *                             items:
   *                               type: string
   *                           portfolio_url:
   *                             type: string
   *                           experience_level:
   *                             type: string
   *                             enum: [entry, intermediate, expert]
   *                     recommended_talents:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/TalentProfileSummary'
   *       401:
   *         description: Unauthorized - Token missing or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "Unauthorized"
   *               status_code: 401
   *       403:
   *         description: Forbidden - User role not permitted
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "Forbidden"
   *               status_code: 403
   *       405:
   *         description: Method Not Allowed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "Method not allowed"
   *               status_code: 405
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "Something went wrong!"
   *               status_code: 500
   */
`;

export const dashboardNotifications = `
  /**
   * @swagger
   * /api/v1/dashboard/notifications:
   *   get:
   *     summary: List user notifications
   *     tags: [Dashboard]
  *     description: Returns recent notifications for authenticated recruiters and talents.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         required: false
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of notifications to return.
   *     responses:
   *       200:
   *         description: Notifications fetched successfully
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
   *                   example: "Notifications fetched successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       type:
   *                         type: string
   *                         enum: [upvote, message, view, save]
   *                       message:
   *                         type: string
   *                       read:
   *                         type: boolean
   *                       timestamp:
   *                         type: string
   *                         format: date-time
   *                       sender:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                             nullable: true
   *                           first_name:
   *                             type: string
   *                             nullable: true
   *                           last_name:
   *                             type: string
   *                             nullable: true
   *                           avatar:
   *                             type: string
   *                             nullable: true
   *                           role:
   *                             type: string
   *                             nullable: true
  *                 summary:
  *                   type: object
  *                   properties:
  *                     unread_count:
  *                       type: integer
  *                       example: 3
  *                     unread_message_count:
  *                       type: integer
  *                       example: 1
   *       401:
   *         description: Unauthorized - Token missing or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
  *       403:
  *         description: Forbidden - Role not permitted
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/v1/dashboard/notifications/{notificationId}/read:
   *   patch:
   *     summary: Mark one notification as read
   *     tags: [Dashboard]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: notificationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Notification marked as read
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
   *                   example: "Notification marked as read"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     type:
   *                       type: string
   *                     message:
   *                       type: string
   *                     read:
   *                       type: boolean
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized - Token missing or invalid
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
  *       403:
  *         description: Forbidden - Role not permitted
  *         content:
  *           application/json:
  *             schema:
  *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Notification not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
`;
