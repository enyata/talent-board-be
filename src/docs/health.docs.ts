/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check API health status
 *     tags: [System]
 *     description: Returns a message indicating the API is running.
 *     responses:
 *       200:
 *         description: API is healthy
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
 *                   example: "API is running"
 *                 database:
 *                   type: string
 *                   example: "connected"
 */
