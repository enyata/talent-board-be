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
 *     parameters:
 *       - in: query
 *         name: redirect_uri
 *         schema:
 *           type: string
 *         required: false
 *         description: Frontend URL to redirect to after authentication
 *       - in: query
 *         name: include_tokens_in_url
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         required: false
 *         description: Whether to include access and refresh tokens in the redirect URL
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
 *     description: Processes authentication response from Google and redirects to the frontend with tokens if requested.
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Authorization code from Google
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         required: true
 *         description: Encoded redirect_uri and token preferences
 *     responses:
 *       302:
 *         description: Redirects to frontend with access (and optionally refresh) tokens.
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
 *     parameters:
 *       - in: query
 *         name: redirect_uri
 *         schema:
 *           type: string
 *         required: false
 *         description: Frontend URL to redirect to after authentication
 *       - in: query
 *         name: include_tokens_in_url
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         required: false
 *         description: Whether to include access and refresh tokens in the redirect URL
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
 *     description: Processes authentication response from LinkedIn and redirects to the frontend with tokens if requested.
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Authorization code from LinkedIn
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         required: true
 *         description: Encoded redirect_uri and token preferences
 *     responses:
 *       302:
 *         description: Redirects to frontend with access (and optionally refresh) tokens.
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

export const localSignup = `
/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Create a local user account
 *     tags: [Authentication]
 *     description: Registers a new user using email and password. This endpoint is used for the local signup flow.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *               password:
 *                 type: string
 *                 example: Password1!
 *               confirm_password:
 *                 type: string
 *                 example: Password1!
 *             required:
 *               - email
 *               - password
 *               - confirm_password
 *     responses:
 *       201:
 *         description: Signup successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Signup successful.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: a1b2c3d4-uuid
 *                     email:
 *                       type: string
 *                       example: jane.doe@example.com
 *                     is_email_verified:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Invalid signup payload or passwords do not match
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
`;
