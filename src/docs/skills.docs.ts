/**
 * @swagger
 * tags:
 *   - name: Skills
 *     description: Endpoints for managing skills
 */

export const getAllSkills = `
  /**
   * @swagger
   * /api/v1/skills:
   *   get:
   *     summary: Get all skills
   *     tags: [Skills]
   *     description: Retrieve a list of skills. Supports filtering by name.
   *     parameters:
   *       - in: query
   *         name: query
   *         schema:
   *           type: string
   *         description: Filter skills by name (partial match)
   *     responses:
   *       200:
   *         description: Skills fetched successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "success"
   *                 data:
   *                   type: object
   *                   properties:
   *                     skills:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                             example: "b2c3d4e5-uuid"
   *                           name:
   *                             type: string
   *                             example: "JavaScript"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
`;

export const createSkill = `
  /**
   * @swagger
   * /api/v1/skills:
   *   post:
   *     summary: Create a new skill
   *     tags: [Skills]
   *     description: Create a new skill. Requires authentication.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 description: Name of the skill
   *                 example: "Vue.js"
   *     responses:
   *       201:
   *         description: Skill created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: "success"
   *                 data:
   *                   type: object
   *                   properties:
   *                     skill:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                           example: "c3d4e5f6-uuid"
   *                         name:
   *                           type: string
   *                           example: "Vue.js"
   *       400:
   *         description: Bad Request - Missing name
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       409:
   *         description: Conflict - Skill already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               status: "error"
   *               message: "Skill already exists"
   *               status_code: 409
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
`;
