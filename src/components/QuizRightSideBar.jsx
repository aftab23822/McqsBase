import React from "react";
import { BookOpen, Calculator, Globe, Atom, User, Star, Briefcase, Cpu, Activity, HeartPulse, FileText, BarChart2, Users, Book, Gavel, Globe2, Dumbbell, Send, ListChecks, CheckCircle, ClipboardList, Monitor, UserCheck } from "lucide-react";
import Link from "next/link";

const quizMenu = [
  {
    title: "MAIN QUIZ MENU",
    icon: ListChecks,
    categories: [
      { label: "Accounting Quiz", link: "/quiz/accounting", icon: BookOpen },
      { label: "Auditing Quiz", link: "/quiz/auditing", icon: BookOpen },
      { label: "Biology Quiz", link: "/quiz/biology", icon: Atom },
      { label: "Chemistry Quiz", link: "/quiz/chemistry", icon: Atom },
      { label: "Computer Quiz", link: "/quiz/computer", icon: Atom },
      { label: "English Quiz", link: "/quiz/english", icon: BookOpen },
      { label: "Everyday Science Quiz", link: "/quiz/everyday-science", icon: Atom },
      { label: "Finance Quiz", link: "/quiz/finance", icon: BarChart2 },
      { label: "General Knowledge Quiz", link: "/quiz/general-knowledge", icon: Star },
      { label: "HRM Quiz", link: "/quiz/hrm", icon: Users },
      { label: "Islamic Studies Quiz", link: "/quiz/islamic-studies", icon: BookOpen },
      { label: "Management Sciences", link: "/quiz/management-sciences", icon: Briefcase },
      { label: "Marketing Quiz", link: "/quiz/marketing", icon: Briefcase },
      { label: "Maths Quiz", link: "/quiz/maths", icon: Calculator },
      { label: "Pak Study Quiz", link: "/quiz/pak-study", icon: BookOpen },
      { label: "Pakistan Current Affairs Quiz", link: "/quiz/pakistan-current-affairs", icon: Globe },
      { label: "Pedagogy Quiz", link: "/quiz/pedagogy", icon: User },
      { label: "Physics Quiz", link: "/quiz/physics", icon: Atom },
      { label: "URDU Quiz", link: "/quiz/urdu", icon: BookOpen },
      { label: "World Current Affairs Quiz", link: "/quiz/world-current-affairs", icon: Globe },
    ]
  },
  {
    title: "ENGINEERING QUIZ",
    icon: Cpu,
    categories: [
      { label: "Chemical Engineering Quiz", link: "/quiz/chemical-engineering", icon: Activity },
      { label: "Civil Engineering Quiz", link: "/quiz/civil-engineering", icon: Activity },
      { label: "Electrical Engineering Quiz", link: "/quiz/electrical-engineering", icon: Activity },
      { label: "Engineering Quiz", link: "/quiz/engineering", icon: Cpu },
      { label: "Mechanical Engineering Quiz", link: "/quiz/mechanical-engineering", icon: Activity },
      { label: "Software Engineering Quiz", link: "/quiz/software-engineering", icon: Cpu },
    ]
  },
  {
    title: "MEDICAL QUIZ",
    icon: HeartPulse,
    categories: [
      { label: "Biochemistry Quiz", link: "/quiz/biochemistry", icon: Activity },
      { label: "Medical Quiz", link: "/quiz/medical", icon: HeartPulse },
      { label: "Pathology Quiz", link: "/quiz/pathology", icon: Activity },
      { label: "Pharmacology Quiz", link: "/quiz/pharmacology", icon: Activity },
      { label: "Physiology Quiz", link: "/quiz/physiology", icon: Activity },
    ]
  },
  {
    title: "OTHER SUBJECTS QUIZ",
    icon: FileText,
    categories: [
      { label: "Economics Quiz", link: "/quiz/economics", icon: BarChart2 },
      { label: "English Literature Quiz", link: "/quiz/english-literature", icon: Book },
      { label: "International Relations Quiz", link: "/quiz/international-relations", icon: Globe2 },
      { label: "Judiciary And Law Quiz", link: "/quiz/judiciary-law", icon: Gavel },
      { label: "Physical Education Quiz", link: "/quiz/physical-education", icon: Dumbbell },
      { label: "Political Science Quiz", link: "/quiz/political-science", icon: Globe2 },
      { label: "Psychology Quiz", link: "/quiz/psychology", icon: User },
      { label: "Sociology Quiz", link: "/quiz/sociology", icon: Users },
      { label: "Statistics Quiz", link: "/quiz/statistics", icon: BarChart2 },
    ]
  },
  {
    title: "SPECIAL QUIZZES",
    icon: CheckCircle,
    categories: [
      { label: "Computer Online Quiz", link: "/quiz/computer", icon: Monitor },
      { label: "Everyday Science Quiz", link: "/quiz/everyday-science", icon: ClipboardList },
      { label: "General Knowledge Quiz", link: "/quiz/general-knowledge", icon: ClipboardList },
      { label: "Islamic Studies Mcqs Quiz", link: "/quiz/islamic-studies", icon: CheckCircle },
      { label: "Pakistan Studies Quiz", link: "/quiz/pak-study", icon: ClipboardList },
    ]
  },
  {
    title: "ELECTION OFFICER QUIZ",
    icon: UserCheck,
    categories: [
      { label: "Election Officer Quiz", link: "/quiz/election-officer", icon: UserCheck },
    ]
  },
];

const QuizRightSideBar = () => {
  return (
    <div className="p-5 border-l bg-white rounded-xl shadow-xl space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 border-b pb-2">Quiz Categories</h3>
      {quizMenu.map((section, idx) => (
        <div key={idx} className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold text-indigo-600 mt-4">
            <section.icon size={20} />
            {section.title}
          </div>
          <ul className="bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-all grid grid-cols-1 gap-1">
            {section.categories.map((cat, i) => (
              <li key={i}>
                <Link href={cat.link} className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors">
                  <cat.icon size={16} className="text-indigo-400" />
                  <span className="text-sm font-medium">{cat.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default QuizRightSideBar;
