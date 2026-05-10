import { Router } from 'express'
import * as sessionsController from './sessions.controller'

const router = Router({ mergeParams: true })

/**
 * @openapi
 * /decks/{deckId}/session:
 *   get:
 *     summary: Load due cards for a study session
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Due cards with FSRS interval previews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cards:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SessionCard'
 *       "400":
 *         description: Invalid deckId
 *       "401":
 *         description: Unauthorized
 *   post:
 *     summary: Submit reviews for a completed session
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: deckId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reviews
 *             properties:
 *               reviews:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - cardId
 *                     - rating
 *                     - reviewedAt
 *                   properties:
 *                     cardId:
 *                       type: integer
 *                     rating:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 4
 *                       description: "1=Again, 2=Hard, 3=Good, 4=Easy"
 *                     reviewedAt:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       "200":
 *         description: Number of reviews saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 saved:
 *                   type: integer
 *       "400":
 *         description: Invalid reviews array or rating value
 *       "401":
 *         description: Unauthorized
 */
router.get('/',    sessionsController.loadSession)
router.post('/',   sessionsController.submitSession)

export default router