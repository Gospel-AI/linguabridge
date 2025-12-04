import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import * as workersController from '../controllers/workers.js'

const router = Router()

// すべてのルートで認証が必要
router.use(authenticate)

/**
 * @swagger
 * /api/workers:
 *   get:
 *     summary: List workers
 *     description: Accessible to all users. Filter workers by search criteria
 *     tags: [Workers]
 *     parameters:
 *       - in: query
 *         name: domain
 *         schema:
 *           type: string
 *           enum: [translation, ai_verification, physical_data, app_testing]
 *         description: Filter by domain
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [standard, pro]
 *         description: Filter by tier
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset
 *     responses:
 *       200:
 *         description: List of workers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Worker'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Authentication error
 */
router.get('/', asyncHandler(workersController.listWorkers))

/**
 * @swagger
 * /api/workers/me:
 *   get:
 *     summary: Get my worker profile
 *     description: Accessible only to worker or both roles
 *     tags: [Workers]
 *     responses:
 *       200:
 *         description: Worker profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                 worker:
 *                   $ref: '#/components/schemas/Worker'
 *       401:
 *         description: Authentication error
 *       403:
 *         description: Permission error (worker role required)
 */
router.get('/me', requireRole('worker', 'both'), asyncHandler(workersController.getMyProfile))

/**
 * @swagger
 * /api/workers/me:
 *   put:
 *     summary: Update my worker profile
 *     description: Accessible only to worker or both roles
 *     tags: [Workers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: object
 *                 properties:
 *                   full_name:
 *                     type: string
 *                   bio:
 *                     type: string
 *               worker:
 *                 type: object
 *                 properties:
 *                   language_pairs:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         source:
 *                           type: string
 *                         target:
 *                           type: string
 *                   specialized_domains:
 *                     type: array
 *                     items:
 *                       type: string
 *                   certifications:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Updated profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                 worker:
 *                   $ref: '#/components/schemas/Worker'
 *       401:
 *         description: Authentication error
 *       403:
 *         description: Permission error
 */
router.put('/me', requireRole('worker', 'both'), asyncHandler(workersController.updateMyProfile))

/**
 * @swagger
 * /api/workers/{id}:
 *   get:
 *     summary: Get worker profile
 *     description: Public information only. Accessible to all users
 *     tags: [Workers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Worker ID
 *     responses:
 *       200:
 *         description: Worker public profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                 worker:
 *                   $ref: '#/components/schemas/Worker'
 *       401:
 *         description: Authentication error
 *       404:
 *         description: Worker not found
 */
router.get('/:id', asyncHandler(workersController.getWorkerProfile))

export default router
