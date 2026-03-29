/**
 * Sends an admin notification when a user submits MCQ / past paper / interview content.
 * Configure via environment variables (never commit real secrets).
 *
 * Required (to enable mail):
 *   SUBMISSION_NOTIFY_EMAIL — recipient (e.g. you)
 *   SMTP_USER — Gmail address used to send
 *   SMTP_PASS — Gmail App Password (not your normal Gmail password)
 *
 * Optional:
 *   SMTP_HOST — default smtp.gmail.com
 *   SMTP_PORT — default 587
 *   SMTP_SECURE — "true" for port 465
 */

function isConfigured() {
  const to = process.env.SUBMISSION_NOTIFY_EMAIL?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)?.trim();
  return Boolean(to && user && pass);
}

function buildPlainText(payload) {
  const lines = [
    'New user submission on McqsBase',
    '',
    `Type: ${payload.type}`,
    `ID: ${payload.id}`,
    `Status: ${payload.status || 'pending'}`,
    '',
    `Question / title: ${payload.question || '(none)'}`,
  ];

  if (payload.type === 'interview') {
    lines.push(
      `Position: ${payload.position || ''}`,
      `Shared by: ${payload.sharedBy || ''}`,
      `Year: ${payload.year ?? ''}`,
      `Department: ${payload.department || ''}`,
      `Experience: ${payload.experience || ''}`,
      '',
      'Full details (answer):',
      String(payload.answer || '').slice(0, 8000)
    );
  } else {
    lines.push(
      `Category: ${payload.category || ''}`,
      `Username: ${payload.username || ''}`,
      `Correct: ${payload.correctAnswer || ''}`,
      '',
      'Options:',
      payload.options ? JSON.stringify(payload.options, null, 2) : '(none)'
    );
  }

  lines.push('', `Submitted at: ${payload.createdAt || new Date().toISOString()}`);
  return lines.join('\n');
}

/**
 * Fire-and-forget: does not throw to callers. Logs on failure.
 * @param {object} doc - saved UserSubmittedItem fields (plain object ok)
 */
export async function notifyNewUserSubmission(doc) {
  if (!isConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[email] Submission notify disabled: set SUBMISSION_NOTIFY_EMAIL, SMTP_USER, SMTP_PASS'
      );
    }
    return;
  }

  try {
    const nodemailer = (await import('nodemailer')).default;
    const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 587);
    const secure =
      process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1' || port === 465;
    const user = process.env.SMTP_USER.trim();
    const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD).trim();
    const to = process.env.SUBMISSION_NOTIFY_EMAIL.trim();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const payload = {
      type: doc.type,
      id: String(doc._id || doc.id || ''),
      status: doc.status,
      question: doc.question,
      category: doc.category,
      username: doc.username,
      correctAnswer: doc.correctAnswer,
      options: doc.options,
      position: doc.position,
      sharedBy: doc.sharedBy,
      year: doc.year,
      department: doc.department,
      experience: doc.experience,
      answer: doc.answer,
      createdAt: doc.createdAt
        ? new Date(doc.createdAt).toISOString()
        : new Date().toISOString(),
    };

    const subject = `[McqsBase] New ${payload.type} submission`;
    const text = buildPlainText(payload);

    await transporter.sendMail({
      from: `"McqsBase" <${user}>`,
      to,
      replyTo: payload.username?.includes('@') ? payload.username : undefined,
      subject,
      text,
    });
  } catch (err) {
    console.error('[email] Failed to send submission notification:', err.message);
  }
}
