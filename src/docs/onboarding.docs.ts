/**
 * @swagger
 * tags:
 *   - name: Onboarding
 *     description: Endpoints for onboarding talents and recruiters
 */

export const talentOnboarding = `
/**
 * @swagger
 * /api/v1/onboarding/talent:
 *   patch:
 *     summary: Complete onboarding for a talent user
 *     tags: [Onboarding]
 *     description: Completes the onboarding process for a talent after OAuth login. Accepts details like skills, experience level, and resume.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - linkedin_profile
 *               - skills
 *               - resume
 *               - experience_level
 *             properties:
 *               location:
 *                 type: string
 *                 example: "Lagos"
 *               portfolio_url:
 *                 type: string
 *                 example: "https://portfolio.com"
 *               linkedin_profile:
 *                 type: string
 *                 example: "https://linkedin.com/in/sample"
 *               resume:
 *                 type: string
 *                 format: binary
 *               skills:
 *                 type: string
 *                 description: JSON array string of skills (e.g. '["Node.js", "TypeScript"]')
 *                 example: '["Node.js", "TypeScript"]'
 *               experience_level:
 *                 type: string
 *                 enum: [beginner, intermediate, expert]
 *                 example: "intermediate"
 *     responses:
 *       200:
 *         description: Talent onboarded successfully
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
 *                   example: "Talent onboarded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       allOf:
 *                         - $ref: '#/components/schemas/User'
 *                         - type: object
 *                           properties:
 *                             profile_completed:
 *                               type: boolean
 *                               example: true
 *                             location:
 *                               type: string
 *                             portfolio_url:
 *                               type: string
 *                             linkedin_profile:
 *                               type: string
 *                             resume_path:
 *                               type: string
 *                             skills:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             experience_level:
 *                               type: string
 *                               enum: [beginner, intermediate, expert]
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           $ref: '#/components/schemas/AccessToken'
 *                         refresh_token:
 *                           $ref: '#/components/schemas/RefreshToken'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Onboarding already completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation error from Zod schema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 error:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                       message:
 *                         type: string
 *                         example: "skills must be a valid JSON array string"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
`;
