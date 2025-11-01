import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MCQ_DIR = path.join(__dirname, '../src/components/MCQsCategory');
const QUIZ_DIR = path.join(__dirname, '../src/components/QuizCategory');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (filePath.includes('Base')) return false;
  if (content.includes('className="relative"')) return false; // Already wrapped
  if (!content.includes('isPageChanging')) return false; // Not updated yet
  
  const isMCQ = filePath.includes('MCQsCategory');
  const componentType = isMCQ ? 'BaseMcqs' : 'BaseQuiz';
  const dataVar = isMCQ ? 'mcqsData' : 'quizData';
  
  // Match return <BaseXxx .../>
  const returnPattern = new RegExp(
    `(return\\s*<${componentType}\\s+${dataVar}=\\{displayData\\}[^>]*>\\s*[^<]*</${componentType}>\\s*/>)`,
    'm'
  );
  
  if (returnPattern.test(content)) {
    const match = content.match(returnPattern);
    const componentTag = match[1].replace(/^return\s*/, '');
    
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
    
    content = content.replace(returnPattern, wrapped);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  // Try simpler pattern - just BaseXxx tag
  const simplePattern = new RegExp(
    `(return\\s*<${componentType}[\\s\\S]*?</${componentType}>\\s*/>\\s*;)`,
    'm'
  );
  
  if (simplePattern.test(content)) {
    const match = content.match(simplePattern);
    const returnLine = match[1];
    
    // Extract component attributes
    const tagMatch = returnLine.match(new RegExp(`<${componentType}([^>]*)>([\\s\\S]*?)</${componentType}>`, 'm'));
    if (tagMatch) {
      const attrs = tagMatch[1].trim();
      const children = tagMatch[2].trim();
      
      const wrapped = `return (
    <div className="relative">
      <div className={isPageChanging ? 'opacity-60 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}>
        <${componentType} ${attrs}>${children}</${componentType}>
      </div>
      {isPageChanging && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50 transition-opacity duration-300">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );`;
      
      content = content.replace(simplePattern, wrapped);
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  }
  
  return false;
}

const allFiles = [
  ...fs.readdirSync(MCQ_DIR).filter(f => f.endsWith('.jsx') && !f.includes('Base')).map(f => path.join(MCQ_DIR, f)),
  ...fs.readdirSync(QUIZ_DIR).filter(f => f.endsWith('.jsx') && !f.includes('Base')).map(f => path.join(QUIZ_DIR, f))
];

let fixed = 0;
for (const file of allFiles) {
  try {
    if (fixFile(file)) {
      fixed++;
      console.log(`Fixed ${path.basename(file)}`);
    }
  } catch (err) {
    console.log(`Error: ${path.basename(file)} - ${err.message}`);
  }
}

console.log(`\nDone! Fixed ${fixed} files.`);

