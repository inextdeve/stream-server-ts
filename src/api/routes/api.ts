import express from "express";
import { revalidate, update } from "../controller/api.js";

const router = express.Router();

router.get("/revalidate", revalidate);
router.get("/update/:id", update);

export default router;
