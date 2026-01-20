import { RevModel, RevDocument } from '../models/rev.model';

export async function getMeshSummary(): Promise<Pick<RevDocument, "id" | "title">[]>{
    return RevModel.find({}, {id: 1, title: 1, "metadata.lineageRank": 1,})
    .sort({ "metadata.lineageRank": -1})
    .exec();
}
export async function getRevById(id: string): Promise<RevDocument | null> {
    return RevModel.findOne({ id }).exec();
}

export async function searchRevs(opts: {
    tag?: string;
    archetype?: string;
    text?: string;
}) {
    const filter: Record<string, unknown> = {};

    if (opts.tag) {
        filter.tags = opts.tag;
    }
    if (opts.archetype) {
        filter.archetypes = opts.archetype;
    }
    if (opts.text) {
        filter.$text = { $search: opts.text };
    }

    return RevModel.find(filter).limit(50).exec();
}

export async function getMeshTopology(): Promise<RevDocument[]> {
  // Only select what the graph needs, not full bodies:
  return RevModel.find(
    {},
    {
      id: 1,
      title: 1,
      links: 1,
      "metadata.lineageRank": 1,
      "metadata.activation": 1,
      "metadata.taxonomy": 1,
    }
  ).exec();
}

export async function getRev(): Promise<RevDocument[]> {
  // Only select what the graph needs, not full bodies:
  return RevModel.find(
    {},
    {
      id: 1,
      title: 1,
      links: 1,
      "metadata.lineageRank": 1,
      "metadata.activation": 1,
      "metadata.taxonomy": 1,
    }
  ).exec();
}