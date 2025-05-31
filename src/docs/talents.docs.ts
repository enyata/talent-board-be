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
   *         description: Not found - Talent not found
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

export const searchTalents = `
  /**
   * @swagger
   * /api/v1/talents:
   *   get:
   *     summary: Search and filter talent profiles
   *     tags: [Talents]
   *     description: Retrieves a paginated list of talent profiles based on search query and filters.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         description: Full-text search on name or skills
   *       - in: query
   *         name: skills
   *         schema:
   *           type: string
   *         description: Comma-separated list of skills
   *         example: React,Node.js
   *       - in: query
   *         name: experience
   *         schema:
   *           type: string
   *           enum: [entry, intermediate, expert]
   *         description: Filter by experience level
   *       - in: query
   *         name: state
   *         schema:
   *           type: string
   *         description: Filter by state
   *       - in: query
   *         name: country
   *         schema:
   *           type: string
   *         description: Filter by country
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           enum: [recent, upvotes, experience]
   *         description: Sort results by field
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of results per page
   *       - in: query
   *         name: cursor
   *         schema:
   *           type: string
   *         description: Pagination cursor (base64 encoded)
   *       - in: query
   *         name: direction
   *         schema:
   *           type: string
   *           enum: [next, prev]
   *         description: Pagination direction
   *     responses:
   *       200:
   *         description: Talents fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Talents fetched successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     results:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/TalentProfilePreview'
   *                     count:
   *                       type: integer
   *                     nextCursor:
   *                       type: string
   *                       nullable: true
   *                     previousCursor:
   *                       type: string
   *                       nullable: true
   *                     hasNextPage:
   *                       type: boolean
   *                     hasPreviousPage:
   *                       type: boolean
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
   *       422:
   *         description: Validation error
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
   */
`;

export const getTalentById = `
  /**
   * @swagger
   * /api/v1/talents/{id}:
   *   get:
   *     summary: View detailed talent profile
   *     tags: [Talents]
   *     description: Returns full details of a talent profile including skills, resume, and metrics.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the talent profile
   *     responses:
   *       200:
   *         description: Talent profile fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Talent profile fetched successfully
   *                 data:
   *                   $ref: '#/components/schemas/TalentProfileDetailed'
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
   *         description: Talent not found
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
   */
`;

export const upvoteTalent = `
  /**
   * @swagger
   * /api/v1/talents/{id}/upvote:
   *   post:
   *     summary: Toggle upvote for a talent profile
   *     tags: [Talents]
   *     description: Allows a recruiter to upvote or unupvote a talent profile. Only one upvote per recruiter is allowed.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: ID of the talent to be upvoted or unupvoted
   *         schema:
   *           type: string
   *     responses:
   *       201:
   *         description: Talent profile upvoted successfully
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
   *                   example: "Talent upvoted successfully"
   *       200:
   *         description: Talent profile unupvoted successfully
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
   *                   example: "Talent unupvoted successfully"
   *       400:
   *         description: Bad request - Invalid operation (e.g., self-upvote)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "You cannot upvote yourself"
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
   *         description: Not found - Talent not found or not approved
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

export const getSavedTalents = `
  /**
   * @swagger
   * /api/v1/talents/saved:
   *   get:
   *     summary: Retrieve saved talent profiles
   *     tags: [Talents]
   *     description: Fetch a paginated list of talent profiles that a recruiter has previously saved. Supports filtering and sorting.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         description: Full-text search on name or skills
   *       - in: query
   *         name: skills
   *         schema:
   *           type: string
   *         description: Comma-separated list of skills
   *         example: React,Node.js
   *       - in: query
   *         name: experience
   *         schema:
   *           type: string
   *           enum: [entry, intermediate, expert]
   *         description: Filter by experience level
   *       - in: query
   *         name: state
   *         schema:
   *           type: string
   *         description: Filter by state
   *       - in: query
   *         name: country
   *         schema:
   *           type: string
   *         description: Filter by country
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *           enum: [recent, upvotes, experience]
   *         description: Sort results by field
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of results per page
   *       - in: query
   *         name: cursor
   *         schema:
   *           type: string
   *         description: Pagination cursor (base64 encoded)
   *       - in: query
   *         name: direction
   *         schema:
   *           type: string
   *           enum: [next, prev]
   *         description: Pagination direction
   *     responses:
   *       200:
   *         description: Saved talents fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Saved talents fetched successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     results:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/TalentProfilePreview'
   *                     count:
   *                       type: integer
   *                     nextCursor:
   *                       type: string
   *                       nullable: true
   *                     previousCursor:
   *                       type: string
   *                       nullable: true
   *                     hasNextPage:
   *                       type: boolean
   *                     hasPreviousPage:
   *                       type: boolean
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
   *       403:
   *         description: Forbidden - Only recruiters can access saved talents
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "Forbidden"
   *               status_code: 403
   *       422:
   *         description: Validation error
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
   */
`;

export const getTopTalents = `
  /**
   * @swagger
   * /api/v1/talents/top:
   *   get:
   *     summary: Get top talent profiles for homepage
   *     tags: [Talents]
   *     description: Public endpoint to retrieve the top 10 talent profiles ranked by upvotes, recruiter saves, and profile views.
   *     responses:
   *       200:
   *         description: Top talent profiles fetched successfully
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
   *                   example: "Top talents fetched successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/TalentProfilePreview'
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
