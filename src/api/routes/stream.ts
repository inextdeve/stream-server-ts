import express from "express";
import { stream } from "../controller/stream.js";

const router = express.Router();

//Camera API
router.get("/:id/:analytic", stream);

export default router;
