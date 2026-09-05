import { Router, type IRouter } from "express";
import healthRouter from "./health";
import catalogRouter from "./catalog";
import storageRouter from "./storage";
import reviewRouter from "./review";

const router: IRouter = Router();

router.use(healthRouter);
router.use(catalogRouter);
router.use(storageRouter);
router.use(reviewRouter);

export default router;
