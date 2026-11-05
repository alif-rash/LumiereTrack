import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lumiereRouter from "./lumiere";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lumiereRouter);

export default router;
