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
   *     description: Fetches real-time dashboard metrics and notifications for a talent user.
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
   *                     notifications:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           type:
   *                             type: string
   *                             enum: [upvote, message, view, save]
   *                           message:
   *                             type: string
   *                           read:
   *                             type: boolean
   *                           timestamp:
   *                             type: string
   *                             format: date-time
   *                           sender:
   *                             type: object
   *                             properties:
   *                               name:
   *                                 type: string
   *                                 example: "Jane Doe"
   *                               role:
   *                                 type: string
   *                                 example: "Tech"
   *                               avatar:
   *                                 type: string
   *                                 example: "https://example.com/avatar.png"
   *                               location:
   *                                 type: string
   *                                 example: "Lagos, Nigeria"
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
