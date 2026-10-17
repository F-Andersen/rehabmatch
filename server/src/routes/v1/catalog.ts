import { Router } from "express";
import { getCatalogDictionaries } from "../../modules/catalog/catalog.service.js";

export const catalogRouter = Router();

catalogRouter.get("/catalog", async (_req, res, next) => {
  try {
    const data = await getCatalogDictionaries();
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
