import mongoose from 'mongoose';

const STRUCTURE_KEYS = ['mcqs', 'past-papers', 'past-interviews', 'mock-tests'];

const categoryStructureConfigSchema = new mongoose.Schema(
  {
    structureKey: {
      type: String,
      required: true,
      unique: true,
      enum: STRUCTURE_KEYS,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.CategoryStructureConfig ||
  mongoose.model('CategoryStructureConfig', categoryStructureConfigSchema);
