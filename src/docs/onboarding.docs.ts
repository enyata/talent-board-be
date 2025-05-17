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
 *     description: Completes the onboarding process for a talent after OAuth login.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - state
 *               - country
 *               - linkedin_profile
 *               - skills
 *               - resume
 *               - experience_level
 *             properties:
 *               state:
 *                 type: string
 *                 example: "Lagos"
 *               country:
 *                 type: string
 *                 example: "Nigeria"
 *               linkedin_profile:
 *                 type: string
 *                 example: "https://linkedin.com/in/sample"
 *               portfolio_url:
 *                 type: string
 *                 example: "https://portfolio.com"
 *               resume:
 *                 type: string
 *                 format: binary
 *               skills:
 *                 type: string
 *                 description: JSON array string of skills
 *                 example: '["Node.js", "TypeScript"]'
 *               experience_level:
 *                 type: string
 *                 enum: [entry, intermediate, expert]
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
 *                             profile:
 *                               type: object
 *                               properties:
 *                                 resume_path:
 *                                   type: string
 *                                 portfolio_url:
 *                                   type: string
 *                                 skills:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *                                 experience_level:
 *                                   type: string
 *                                   enum: [entry, intermediate, expert]
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           $ref: '#/components/schemas/AccessToken'
 *                         refresh_token:
 *                           $ref: '#/components/schemas/RefreshToken'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Unauthorized"
 *               status_code: 401
 *       404:
 *         description: Not Found - User record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Talent not found"
 *               status_code: 404
 *       409:
 *         description: Conflict - Onboarding already completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Talent profile already completed"
 *               status_code: 409
 *       422:
 *         description: Unprocessable Entity - Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Validation error"
 *               status_code: 422
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

export const recruiterOnboarding = `
/**
 * @swagger
 * /api/v1/onboarding/recruiter:
 *   patch:
 *     summary: Complete onboarding for a recruiter user
 *     tags: [Onboarding]
 *     description: Completes the onboarding process for a recruiter after OAuth login.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - state
 *               - country
 *               - linkedin_profile
 *               - work_email
 *               - company_industry
 *               - roles_looking_for
 *               - hiring_for
 *             properties:
 *               state:
 *                 type: string
 *                 example: "Abuja"
 *               country:
 *                 type: string
 *                 example: "Nigeria"
 *               linkedin_profile:
 *                 type: string
 *                 example: "https://linkedin.com/in/sample"
 *               work_email:
 *                 type: string
 *                 example: "recruiter@company.com"
 *               company_industry:
 *                 type: string
 *                 example: "Tech"
 *               roles_looking_for:
 *                 type: string
 *                 description: JSON array string of roles
 *                 example: '["Frontend Developer", "Backend Developer"]'
 *               hiring_for:
 *                 type: string
 *                 enum: [myself, my company]
 *     responses:
 *       200:
 *         description: Recruiter onboarded successfully
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
 *                   example: "Recruiter onboarded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       allOf:
 *                         - $ref: '#/components/schemas/User'
 *                         - type: object
 *                           properties:
 *                             profile:
 *                               type: object
 *                               properties:
 *                                 work_email:
 *                                   type: string
 *                                 company_industry:
 *                                   type: string
 *                                 roles_looking_for:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *                                 hiring_for:
 *                                   type: string
 *                                   enum: [myself, my company]
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           $ref: '#/components/schemas/AccessToken'
 *                         refresh_token:
 *                           $ref: '#/components/schemas/RefreshToken'
 *       401:
 *         description: Unauthorized - No or invalid token provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Unauthorized"
 *               status_code: 401
 *       404:
 *         description: Not Found - User record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Recruiter not found"
 *               status_code: 404
 *       409:
 *         description: Conflict - Onboarding already completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Recruiter profile already completed"
 *               status_code: 409
 *       422:
 *         description: Unprocessable Entity - Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Validation error"
 *               status_code: 422
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
