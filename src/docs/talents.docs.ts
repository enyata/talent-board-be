/**
 * @swagger
 * tags:
 *   - name: Talents
 *     description: Endpoints for recruiter interactions with talent profiles
 */

export const saveTalent = `
  /**
   * @swagger
   * /api/v1/talents/{id}/save:
   *   post:
   *     summary: Save a talent profile
   *     tags: [Talents]
   *     description: Allows a recruiter to save a specific talent profile for future consideration.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID of the talent to be saved
   *         schema:
   *           type: string
   *     responses:
   *       201:
   *         description: Talent profile saved successfully
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
   *                   example: "Talent saved successfully"
   *       400:
   *         description: Bad request - Invalid operation (e.g., saving yourself)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "You cannot save yourself"
   *               status_code: 400
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
   *         description: Forbidden - Only recruiters can perform this action
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "Forbidden"
   *               status_code: 403
   *       404:
   *         description: Not found - Talent or recruiter not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "Talent not found"
   *               status_code: 404
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
