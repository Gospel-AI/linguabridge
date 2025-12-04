import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as reportsController from '../controllers/reports.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Report a task
 *     description: Submit a report for a problematic task
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task_id
 *               - reason
 *               - description
 *             properties:
 *               task_id:
 *                 type: string
 *                 format: uuid
 *               reason:
 *                 type: string
 *                 enum: [illegal, scam, inappropriate, spam, other]
 *               description:
 *                 type: string
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Authentication error
 *       404:
 *         description: Task not found
 */
router.post('/', asyncHandler(reportsController.createReport));

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: List user's reports
 *     description: Get all reports submitted by the current user
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, investigating, resolved, dismissed]
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
 *         description: List of reports
 *       401:
 *         description: Authentication error
 */
router.get('/', asyncHandler(reportsController.listUserReports));

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get report details
 *     description: Get details of a specific report
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report details
 *       401:
 *         description: Authentication error
 *       403:
 *         description: Permission error
 *       404:
 *         description: Report not found
 */
router.get('/:id', asyncHandler(reportsController.getReport));

// Admin routes
/**
 * @swagger
 * /api/reports/admin/queue:
 *   get:
 *     summary: Get all reports (Admin only)
 *     description: List all reports for admin review
 *     tags: [Reports, Admin]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, investigating, resolved, dismissed]
 *         description: Filter by status
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *           enum: [illegal, scam, inappropriate, spam, other]
 *         description: Filter by reason
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of items to retrieve
 *     responses:
 *       200:
 *         description: List of all reports
 *       401:
 *         description: Authentication error
 *       403:
 *         description: Admin access required
 */
router.get('/admin/queue', requireRole('admin'), asyncHandler(reportsController.listAllReports));

/**
 * @swagger
 * /api/reports/admin/{id}/review:
 *   post:
 *     summary: Review a report (Admin only)
 *     description: Take action on a reported task
 *     tags: [Reports, Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [suspend_task, ban_user, dismiss, no_action]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report reviewed successfully
 *       401:
 *         description: Authentication error
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Report not found
 */
router.post('/admin/:id/review', requireRole('admin'), asyncHandler(reportsController.reviewReport));

export default router;
