/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Authentication endpoints
 */

export const googleOAuth = `
/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Initiate Google OAuth authentication
 *     tags: [Authentication]
 *     description: Redirects the user to Google's OAuth 2.0 authentication page.
 *     responses:
 *       302:
 *         description: Redirects to Google's authentication page.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
`;

export const googleOAuthCallback = `
/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     tags: [Authentication]
 *     description: Processes authentication response from Google and logs in the user.
 *     responses:
 *       200:
 *         description: Successfully authenticated with Google
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
 *                   example: "Google OAuth successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           $ref: '#/components/schemas/AccessToken'
 *                         refresh_token:
 *                           $ref: '#/components/schemas/RefreshToken'
 *       401:
 *         description: Unauthorized - Google authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Google authentication failed"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
`;

export const linkedInOAuth = `
/**
 * @swagger
 * /api/v1/auth/linkedin:
 *   get:
 *     summary: Initiate LinkedIn OAuth authentication
 *     tags: [Authentication]
 *     description: Redirects the user to LinkedIn's OAuth 2.0 authentication page.
 *     responses:
 *       302:
 *         description: Redirects to LinkedIn's authentication page.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
`;

export const linkedInOAuthCallback = `
/**
 * @swagger
 * /api/v1/auth/linkedin/callback:
 *   get:
 *     summary: Handle LinkedIn OAuth callback
 *     tags: [Authentication]
 *     description: Processes authentication response from LinkedIn and logs in the user.
 *     responses:
 *       200:
 *         description: Successfully authenticated with LinkedIn
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
 *                   example: "LinkedIn OAuth successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           $ref: '#/components/schemas/AccessToken'
 *                         refresh_token:
 *                           $ref: '#/components/schemas/RefreshToken'
 *       401:
 *         description: Unauthorized - LinkedIn authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "LinkedIn authentication failed"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
`;
