/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Endpoints related to user data and sessions
 */

export const getCurrentUser = `
/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Users]
 *     description: Returns the details of the currently authenticated user based on the access token provided.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user retrieved successfully
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
 *                   example: "User fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - No or invalid token provided
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
