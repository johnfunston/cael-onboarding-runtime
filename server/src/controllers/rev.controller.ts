import { Request, Response } from "express";
import * as revService from '../services/rev.services';

export async function getMesh(req: Request, res: Response) {
    try {
        const mesh = await revService.getMeshSummary();
        res.status(200).json(mesh);
    } catch (err) {
        console.error("Error in getMesh", err);
        res.status(500).json({ error: "Failed to fetch Mesh"})
    }
}

export async function getRev(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const rev = await revService.getRevById(id);
        if(!rev) {
            return res.status(404).json({ error: "Rev not found"});
        }
        res.status(200).json(rev)
    } catch (err) {
        console.error("Error in getRev", err);
        res.status(500).json({ error: "Failed to fetch rev"});
    }
}

export async function searchMesh(req: Request, res: Response) {
    try {
        const { tag, archetype, q } = req.query as Record<string, string | undefined>;
        const results = await revService.searchRevs({
            tag,
            archetype,
            text: q,
        });
        res.status(200).json(results);
    } catch (err) {
        console.error("Error in searchMesh", err);
        res.status(500).json({ error: "Failed to search mesh" });
    }
}

// Get Mesh Topology for Graph View

export async function getMeshTopology(req: Request, res: Response) {
  try {
    const mesh = await revService.getMeshTopology();
    res.status(200).json(mesh);
  } catch (err) {
    console.error("Error in getMeshTopology", err);
    res.status(500).json({ error: "Failed to fetch mesh topology" });
  }
}