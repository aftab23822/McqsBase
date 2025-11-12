import mongoose from 'mongoose';
import MCQ from '../models/MCQ.js';
import { escapeRegex } from '../utils/security.js';

export const QUESTION_PROJECTION =
  '_id question options answer explanation createdAt slug categoryId submittedBy';

export async function resolveQuestionByIdentifier({ categoryId, identifier }) {
  if (!categoryId || !identifier || typeof identifier !== 'string') {
    return null;
  }

  const baseQuery = { categoryId };

  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier) {
    return null;
  }

  const findOne = (query) =>
    MCQ.findOne(query).select(QUESTION_PROJECTION).lean();

  let question = await findOne({
    ...baseQuery,
    slug: normalizedIdentifier
  });

  if (question) {
    return question;
  }

  const parts = normalizedIdentifier.split('-');
  const lastPart = parts[parts.length - 1];

  const tryObjectId = async (value) => {
    try {
      const objectId = new mongoose.Types.ObjectId(value);
      return await findOne({
        ...baseQuery,
        _id: objectId
      });
    } catch (err) {
      return null;
    }
  };

  if (/^[0-9a-f]{24}$/i.test(normalizedIdentifier)) {
    question = await tryObjectId(normalizedIdentifier);
    if (question) {
      return question;
    }
  }

  if (lastPart && lastPart.length === 24 && /^[0-9a-f]{24}$/i.test(lastPart)) {
    question = await tryObjectId(lastPart);
    if (question) {
      return question;
    }
  }

  if (lastPart && /^[0-9a-f]{8,23}$/i.test(lastPart)) {
    const prefix = lastPart.toLowerCase();
    const lowerHex = prefix.padEnd(24, '0');
    const upperHex = prefix.padEnd(24, 'f');

    try {
      const lowerId = new mongoose.Types.ObjectId(lowerHex);
      const upperId = new mongoose.Types.ObjectId(upperHex);

      question = await MCQ.findOne({
        ...baseQuery,
        _id: { $gte: lowerId, $lte: upperId }
      })
        .sort({ _id: 1 })
        .select(QUESTION_PROJECTION)
        .lean();

      if (question) {
        return question;
      }
    } catch (err) {
      // Ignore invalid conversions
    }
  }

  if (lastPart && /^[0-9a-f]{8,23}$/i.test(lastPart)) {
    const matched = await MCQ.find({
      ...baseQuery,
      slug: { $regex: new RegExp(`-${escapeRegex(lastPart)}$`, 'i') }
    })
      .select(QUESTION_PROJECTION)
      .limit(5)
      .lean();

    const found =
      matched.find((q) =>
        q._id.toString().toLowerCase().startsWith(lastPart.toLowerCase())
      ) || null;

    if (found) {
      return found;
    }
  }

  if (parts.length > 1) {
    const questionTextSlug = parts.slice(0, -1).join('-');
    const questionText = questionTextSlug.replace(/-/g, ' ');
    const escapedText = escapeRegex(questionText);
    if (escapedText) {
      question = await MCQ.findOne({
        ...baseQuery,
        question: { $regex: new RegExp(escapedText, 'i') }
      })
        .sort({ createdAt: -1 })
        .select(QUESTION_PROJECTION)
        .lean();

      if (question) {
        return question;
      }
    }
  }

  return null;
}

