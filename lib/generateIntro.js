const DEFAULT_SUBJECT_LABEL = 'competitive exams';

function sanitizeSentence(text = '') {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

export function generateIntro(questionText = '', subjectName = '', categoryName = '') {
  const cleanedQuestion = sanitizeSentence(questionText);
  const snippet =
    cleanedQuestion.length > 140 ? `${cleanedQuestion.slice(0, 137)}...` : cleanedQuestion;

  const subjectLabel = sanitizeSentence(subjectName) || DEFAULT_SUBJECT_LABEL;
  const categoryLabel = sanitizeSentence(categoryName) || subjectLabel;

  return (
    `This ${categoryLabel} MCQ highlights a frequently tested idea from ${subjectLabel}. ` +
    `Reviewing "${snippet}" strengthens conceptual clarity and improves readiness for real exam scenarios.`
  ).trim();
}

export default generateIntro;

