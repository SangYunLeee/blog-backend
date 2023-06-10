import express from "express";
import companyRouter from './company.router';
import exampleRouter from './example.router';
import middleware from "../middlewares/middleware";

const router = express.Router();
router.use('company', companyRouter);
router.use('/example', exampleRouter);

router.use(express.static(__dirname + '/../../uploads'));
router.use(middleware.errorHandler);
export default router;