import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import * as annotationsController from '../controllers/annotations.js'

const router = Router()

/**
 * @swagger
 * /api/annotations/projects:
 *   get:
 *     summary: List annotation projects
 *     tags: [Annotations]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, paused, completed, archived]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/projects', asyncHandler(annotationsController.listProjects))

/**
 * @swagger
 * /api/annotations/projects/{id}:
 *   get:
 *     summary: Get annotation project details
 *     tags: [Annotations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get('/projects/:id', asyncHandler(annotationsController.getProject))

/**
 * @swagger
 * /api/annotations/projects/{id}/stats:
 *   get:
 *     summary: Get project stats (completed/total)
 *     tags: [Annotations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Project stats
 */
router.get('/projects/:id/stats', asyncHandler(annotationsController.getProjectStats))

/**
 * @swagger
 * /api/annotations/projects/{projectId}/next-task:
 *   get:
 *     summary: Get next available task for annotation
 *     tags: [Annotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Next task or null if none available
 */
router.get('/projects/:projectId/next-task', authenticate, asyncHandler(annotationsController.getNextTask))

/**
 * @swagger
 * /api/annotations/tasks/{taskId}/submit:
 *   post:
 *     summary: Submit annotation for a task
 *     tags: [Annotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - annotation
 *             properties:
 *               annotation:
 *                 type: object
 *               time_spent_seconds:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Annotation submitted successfully
 */
router.post('/tasks/:taskId/submit', authenticate, asyncHandler(annotationsController.submitAnnotation))

export default router
