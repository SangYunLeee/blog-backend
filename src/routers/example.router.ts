import express from 'express';
import exampleCtl from '../controllers/example.controller';
import {asyncWrap} from '../utils/myutils';
const router = express.Router();

// routing
router.get('/', asyncWrap(exampleCtl.getExamples));

export default router;
