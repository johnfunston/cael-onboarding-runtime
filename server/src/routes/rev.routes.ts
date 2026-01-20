import { Router } from "express";
import { getMesh, getRev, searchMesh, getMeshTopology } from '../controllers/rev.controller'


const revRouter = Router();

revRouter.get("/", getMesh);
revRouter.get("/rev/:id", getRev);
revRouter.get("/search", searchMesh);
revRouter.get("/topology", getMeshTopology);

export default revRouter