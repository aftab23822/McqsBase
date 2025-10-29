"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../../../../../src/components/Navbar';
import Footer from '../../../../../src/components/Footer';
import MockTestsRightSideBar from '../../../../../src/components/MockTestsRightSideBar';

export default function MockTestRunnerPage({ params }) {
  const { university, slug } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [test, setTest] = useState(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const timerRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/mock-tests/${university}/${slug}`);
        const json = await res.json();
        if (!json.success) {
          setError(json.message || 'Failed to load test');
        } else {
          setTest(json.data);
        }
      } catch (e) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [university, slug]);

  const total = test?.questions?.length || 0;

  const start = () => {
    if (!test) return;
    setStarted(true);
    setFinished(false);
    setTimeLeft((test.durationMinutes || 30) * 60);
  };

  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started]);

  useEffect(() => {
    if (started && timeLeft === 0) {
      // time up -> end test
      setStarted(false);
    }
  }, [timeLeft, started]);

  const isFinished = useMemo(() => {
    return !started && test && (Object.keys(answers).length === total || timeLeft === 0) && Object.keys(answers).length > 0;
  }, [started, answers, total, timeLeft, test]);

  const onSelect = (choice) => {
    setAnswers(prev => ({ ...prev, [idx]: choice }));
  };

  const next = () => setIdx(i => Math.min(i + 1, total - 1));
  const prev = () => setIdx(i => Math.max(i - 1, 0));

  if (loading) return <div className="min-h-screen"><Navbar /><div className="p-8">Loading...</div><Footer /></div>;
  if (error) return <div className="min-h-screen"><Navbar /><div className="p-8 text-red-600">{error}</div><Footer /></div>;
  if (!test) return null;

  const q = test.questions[idx];
  const selected = answers[idx];

  const correctCount = isFinished ? test.questions.filter((qq, i) => answers[i] === qq.answer).length : 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2">
            <h1 className="text-2xl font-bold mb-2">{test.name}</h1>
            <p className="text-gray-600 mb-6">University: {university.toUpperCase()} • Duration: {test.durationMinutes} min • Questions: {total}</p>

            {!started && !isFinished && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-lg font-semibold mb-2">Instructions</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Select one option per question.</li>
                  <li>Timer starts when you click Start Test.</li>
                  <li>Your score is shown after you finish all questions or time ends.</li>
                </ul>
                <button onClick={start} className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Start Test</button>
              </div>
            )}

            {started && (
              <div className="flex items-center justify-between bg-white p-4 rounded shadow mb-4">
                <div className="font-medium">Time Left: {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
                <div>Question {idx + 1} / {total}</div>
              </div>
            )}

            {started && (
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="font-semibold mb-3">{q.question}</div>
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <label key={i} className={`block p-3 border rounded cursor-pointer ${selected === opt ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="opt" className="mr-2" checked={selected === opt} onChange={() => onSelect(opt)} />
                      {opt}
                    </label>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <button onClick={prev} disabled={idx===0} className="px-4 py-2 rounded border disabled:opacity-50">Previous</button>
                  <div className="space-x-2">
                    {idx < total - 1 ? (
                      <button onClick={next} className="px-4 py-2 rounded bg-gray-100 border">Next</button>
                    ) : (
                      <button onClick={() => setStarted(false)} className="px-4 py-2 rounded bg-green-600 text-white">Finish</button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isFinished && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-2">Score Card</h2>
                <p className="mb-4">Score: {correctCount} / {total}</p>
                <div className="space-y-4">
                  {test.questions.map((qq, i) => {
                    const correct = answers[i] === qq.answer;
                    return (
                      <div key={i} className={`p-3 border rounded ${correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                        <div className="font-medium">Q{i+1}. {qq.question}</div>
                        <div className="text-sm">Your answer: <span className={correct ? 'text-green-700' : 'text-red-700'}>{answers[i] || '—'}</span></div>
                        {!correct && (
                          <div className="text-sm">Correct answer: <span className="text-green-700">{qq.answer}</span></div>
                        )}
                        {qq.explanation && (
                          <div className="text-sm text-gray-600 mt-1">Explanation: {qq.explanation}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Sidebar */}
          <div className="h-fit top-20">
            <MockTestsRightSideBar />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}


