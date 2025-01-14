import { Router } from 'express'
import botsRouter from './bots'
import usersRouter from './users'

const router = Router()

router.use('/bots', botsRouter)
router.use('/users', usersRouter)

export default router
