import mongoose, { Schema, Document, Model } from 'mongoose'
import {
  Rev,
  RevLink,
  RevHistoryEntry,
  RevMetadata,
  RevLinkType,
} from '../types/rev.types'

// This is the Mongoose document type: a stored Rev + Mongo's Document fields
export interface RevDocument extends Rev, Document {}

// ----- Sub-schemas -----

const RevLinkSchema = new Schema<RevLink>(
  {
    targetId: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'axiom',
        'lemma',
        'corollary',
        'prerequisite',
        'supports',
        'validates',
        'governs',
        'parallel',
        'contradicts',
        'informs',
        'related'
      ] satisfies RevLinkType[], // helps TS catch mismatches
      required: true,
    },
    flavor: { type: String },
    note: { type: String },
    confidence: { type: Number },
  },
  {
    _id: false, // links are value objects, no own _id
  }
)

// We store snapshot as a generic mixed object that follows RevSnapshot at the TS level
const RevHistoryEntrySchema = new Schema<RevHistoryEntry>(
  {
    version: { type: String, required: true },
    timestamp: { type: String, required: true }, // ISO string
    summary: { type: String, required: true },
    snapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    _id: false, // history entries are embedded, no own _id
  }
)

// Metadata is intentionally flexible; we encode known fields and allow extra keys
const RevMetadataSchema = new Schema<RevMetadata>(
  {
    activation: {
      type: new Schema(
        {
          current: { type: Number, required: true },
          lastUpdated: { type: String, required: false }, // ISO
          decayRate: { type: Number },
        },
        { _id: false }
      ),
      required: false,
    },
    confidence: { type: Number },
    hyperedges: {
      type: [[String]], // array of string arrays
    },
    lineageRank: { type: Number },
    taxonomy: {
      type: new Schema(
        {
          families: { type: [String], default: [] },
          subfamilies: { type: [String], default: [] },

          // Map<subfamilyId, weight>
          subfamilyWeights: {
            type: Map,
            of: Number,
            default: {},
          },

          dimensions: { type: [String], default: [] },

          // Map<dimensionId, weight>
          dimensionWeights: {
            type: Map,
            of: Number,
            default: {},
          },
        },
        { _id: false }
      ),
      required: false,
    },
    lemma: {
      type: new Schema(
        {
        isLemma: {type: Boolean, required: true},
        roles: { type: [String], default: [] },
        lemmaFor: { type: [String], default: [] },
        dependentOn: { type: [String], default: [] },
        confidence: { type: Number },
        },
        { _id: false }
      ),
      required: false,
    },
  },
  {
    _id: false,
    strict: false, // allow extra metadata keys beyond the known ones
  }
)

// ----- Main Rev schema -----

const RevSchema = new Schema<RevDocument>(
  {
    // Identity & lifecycle
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    userId: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'integrated', 'archived', 'emerging', 'complete'],
      required: true,
    },
    version: { type: String, required: true },

    // We store dates as ISO strings to match Rev type for now
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: false },

    // Core semantic content
    seedEvent: { type: String },
    purpose: { type: String },
    body: { type: String, required: true },
    axiom: { type: String },

    // Tagging
    archetypes: { type: [String], default: [] },
    tags: { type: [String], default: [] },

    // Structural relationships
    links: {
      type: [RevLinkSchema],
      default: [],
    },

    // Embeddings
    embedding: {
      type: [Number],
      default: [],
    },
    graphEmbedding: {
      type: [Number],
      default: [],
    },
    fusedEmbedding: {
      type: [Number],
      default: [],
    },

    // Version history
    history: {
      type: [RevHistoryEntrySchema],
      default: [],
    },

    // Metadata (flexible extension bay)
    metadata: {
      type: RevMetadataSchema,
      required: false,
    },
  },
  {
    // No automatic timestamps here, because we're storing ISO strings
    // and will manage createdAt/updatedAt ourselves in the service layer.
  }
)

// Basic text index for early search (title/body/axiom)
RevSchema.index({
  title: 'text',
  body: 'text',
  axiom: 'text',
})

// Export the typed model
export const RevModel: Model<RevDocument> =
  mongoose.models.Rev || mongoose.model<RevDocument>('Rev', RevSchema)
