import { Router } from "express";
import { getPostsPaginated, login } from "../controllers/admin.js";

const router = Router();

// Admin login
router.post("/login", login);

// Get paginated posts for admin review
router.get("/get_posts", getPostsPaginated);

export default router;
