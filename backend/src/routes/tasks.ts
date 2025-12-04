import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { moderateContent, logModeration } from '../middleware/contentModeration.js'
import * as tasksController from '../controllers/tasks.js'
import * as applicationsController from '../controllers/applications.js'

const router = Router()

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: List tasks
 *     description: Accessible to all users. Filter tasks by search criteria
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: domain_type
 *         schema:
 *           type: string
 *           enum: [translation, ai_verification, physical_data, app_testing]
 *         description: Filter by domain type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, open, in_progress, completed, cancelled]
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
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Authentication error
 */
// 公開タスクリストは認証不要
router.get('/', asyncHandler(tasksController.listTasks))

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task details
 *     description: Accessible to all users
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         description: Authentication error
 *       404:
 *         description: Task not found
 */
// 公開タスク詳細は認証不要
router.get('/:id', asyncHandler(tasksController.getTask))

// 以下のルートは認証が必要
router.use(authenticate)

// Batch: Get applications for multiple tasks (task creators only)
// IMPORTANT: Must be before /:id route to avoid matching "batch-applications" as ID
router.get('/batch-applications', asyncHandler(applicationsController.batchGetTaskApplications))

// Get applications for single task (task creator only)
router.get('/:taskId/applications', asyncHandler(applicationsController.listTaskApplications))

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create task
 *     description: Accessible only to client or both roles
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - domain_type
 *               - budget
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               domain_type:
 *                 type: string
 *                 enum: [translation, ai_verification, physical_data, app_testing]
 *               budget:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               custom_fields:
 *                 type: object
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         description: Authentication error
 *       403:
 *         description: Permission error
 */
router.post(
  '/',
  requireRole('client', 'both'),
  moderateContent,
  asyncHandler(tasksController.createTask),
  logModeration
)

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task
 *     description: Accessible only to task creator
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               budget:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [draft, open, in_progress, completed, cancelled]
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       401:
 *         description: Authentication error
 *       403:
 *         description: Permission error
 *       404:
 *         description: Task not found
 */
router.put('/:id', requireRole('client', 'both'), asyncHandler(tasksController.updateTask))

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     description: Accessible only to task creator
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       401:
 *         description: Authentication error
 *       403:
 *         description: Permission error
 *       404:
 *         description: Task not found
 */
router.delete('/:id', requireRole('client', 'both'), asyncHandler(tasksController.deleteTask))

export default router
