import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import * as applicationsController from '../controllers/applications.js'

const router = Router()

// すべてのルートで認証が必要
router.use(authenticate)

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Apply to task
 *     description: Accessible only to worker or both roles
 *     tags: [Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task_id
 *             properties:
 *               task_id:
 *                 type: string
 *                 format: uuid
 *               proposal:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Application'
 *       401:
 *         description: Authentication error
 *       403:
 *         description: Permission error
 */
router.post('/', requireRole('worker', 'both'), asyncHandler(applicationsController.createApplication))

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: List my applications
 *     description: Accessible to all users (only own applications)
 *     tags: [Applications]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, withdrawn]
 *         description: Filter by status
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
 *         description: List of applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Authentication error
 */
router.get('/', asyncHandler(applicationsController.listMyApplications))

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get application details
 *     description: Accessible only to applicant or task creator
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Application'
 *       401:
 *         description: Authentication error
 *       403:
 *         description: Permission error
 *       404:
 *         description: Application not found
 */
router.get('/:id', asyncHandler(applicationsController.getApplication))

/**
 * @swagger
 * /api/applications/{id}/status:
 *   put:
 *     summary: Update application status
 *     description: Task creator (accept/reject) or worker (withdraw) only
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected, withdrawn]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Application'
 *       401:
 *         description: Authentication error
 *       403:
 *         description: Permission error
 *       404:
 *         description: Application not found
 */
router.put('/:id/status', asyncHandler(applicationsController.updateApplicationStatus))

export default router
