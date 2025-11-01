import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MCQ_DIR = path.join(__dirname, '../src/components/MCQsCategory');
const QUIZ_DIR = path.join(__dirname, '../src/components/QuizCategory');

function fixReturn(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (filePath.includes('Base')) return false;
  
  // Check if already has wrapper
  if (content.includes('className="relative"')) return false;
  
  // Check if has isPageChanging (means it was updated but return is missing wrapper)
  if (!content.includes('isPageChanging')) return false;
  
  const isMCQ = filePath.includes('MCQsCategory');
  const componentType = isMCQ ? 'BaseMcqs' : 'BaseQuiz';
  const dataVar = isMCQ ? 'mcqsData' : 'quizData';
  
  // Find return statement that needs wrapping
  const returnPattern = new RegExp(
    `(return\\s*(?:<Base${isMCQ ? 'Mcqs' : 'Quiz'}|<${componentType}))([\\s\\S]*?</${componentType}>)\\s*/>`,
    'm'
  );
  
  if (!returnPattern.test(content)) {
    // Try different pattern
    const altPattern = new RegExp(
      `return\\s*(<${componentType}[\\s\\S]*?</${componentType}>)\\s*;`,
      'm'
    );
    
    if (altPattern.test(content)) {
      const match = content.match(altPattern);
      const componentTag = match[1];
      
      const wrapped = `return (
    <div className="relative">
      <div className={isPageChanging ? 'opacity-60 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}>
        ${componentTag}
      </div>
      {isPageChanging && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50 transition-opacity duration-300">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );`;
      
      content = content.replace(altPattern, wrapped);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed return in ${path.basename(filePath)}`);
      return true;
    }
    return false;
  }
  
  return false;
}

const allFiles = [
  ...fs.readdirSync(MCQ_DIR).filter(f => f.endsWith('.jsx') && !f.includes('Base')).map(f => path.join(MCQ_DIR, f)),
  ...fs.readdirSync(QUIZ_DIR).filter(f => f.endsWith('.jsx') && !f.includes('Base')).map(f => path.join(QUIZ_DIR, f))
];

let fixed = 0;
for (const file of allFiles) {
  if (fixReturn(file)) fixed++;
}

console.log(`\nDone! Fixed ${fixed} return statements.`);

