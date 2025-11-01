import React from "react";
import { BookOpen, Calculator, Globe, Atom, User, Star, Briefcase, Cpu, Activity, HeartPulse, FileText, BarChart2, Users, Book, Gavel, Globe2, Dumbbell, Send, ListChecks, CheckCircle, ClipboardList, Monitor, UserCheck } from "lucide-react";
import Link from "next/link";

const mcqsMenu = [
  {
    title: "MAIN MCQS MENU",
    icon: BookOpen,
    categories: [
      { label: "Accounting Mcqs", link: "/mcqs/accounting", icon: BookOpen },
      { label: "Auditing Mcqs", link: "/mcqs/auditing", icon: BookOpen },
      { label: "Biology Mcqs", link: "/mcqs/biology", icon: Atom },
      { label: "Chemistry Mcqs", link: "/mcqs/chemistry", icon: Atom },
      { label: "Computer Mcqs", link: "/mcqs/computer", icon: Atom },
      { label: "English Mcqs", link: "/mcqs/english", icon: BookOpen },
      { label: "Everyday Science Mcqs", link: "/mcqs/everyday-science", icon: Atom },
      { label: "Finance Mcqs", link: "/mcqs/finance", icon: BarChart2 },
      { label: "General Knowledge MCQs", link: "/mcqs/general-knowledge", icon: Star },
      { label: "HRM Mcqs", link: "/mcqs/hrm", icon: Users },
      { label: "Islamic Studies Mcqs", link: "/mcqs/islamic-studies", icon: BookOpen },
      { label: "Management Sciences", link: "/mcqs/management-sciences", icon: Briefcase },
      { label: "Marketing Mcqs", link: "/mcqs/marketing", icon: Briefcase },
      { label: "Maths Mcqs", link: "/mcqs/maths", icon: Calculator },
      { label: "Pak Study Mcqs", link: "/mcqs/pak-study", icon: BookOpen },
      { label: "Pakistan Current Affairs MCQs", link: "/mcqs/pakistan-current-affairs", icon: Globe },
      { label: "Pedagogy Mcqs", link: "/mcqs/pedagogy", icon: User },
      { label: "Physics Mcqs", link: "/mcqs/physics", icon: Atom },
      { label: "URDU Mcqs", link: "/mcqs/urdu", icon: BookOpen },
      { label: "World Current Affairs MCQs", link: "/mcqs/world-current-affairs", icon: Globe },
    ]
  },
  {
    title: "ENGINEERING MCQS",
    icon: Cpu,
    categories: [
      { label: "Chemical Engineering Mcqs", link: "/mcqs/chemical-engineering", icon: Activity },
      { label: "Civil Engineering Mcqs", link: "/mcqs/civil-engineering", icon: Activity },
      { label: "Electrical Engineering Mcqs", link: "/mcqs/electrical-engineering", icon: Activity },
      { label: "Mechanical Engineering Mcqs", link: "/mcqs/mechanical-engineering", icon: Activity },
      { label: "Software Engineering Mcqs", link: "/mcqs/software-engineering", icon: Cpu },
    ]
  },
  {
    title: "MEDICAL SUBJECTS",
    icon: HeartPulse,
    categories: [
      { label: "Biochemistry", link: "/mcqs/biochemistry", icon: Activity },
      { label: "Dental Materials", link: "/mcqs/dental-materials", icon: Activity },
      { label: "General Anatomy Mcqs", link: "/mcqs/general-anatomy", icon: Activity },
      { label: "Medical Mcqs", link: "/mcqs/medical", icon: HeartPulse },
      { label: "Microbiology", link: "/mcqs/microbiology", icon: Activity },
      { label: "Oral Anatomy", link: "/mcqs/oral-anatomy", icon: Activity },
      { label: "Oral Histology", link: "/mcqs/oral-histology", icon: Activity },
      { label: "Oral Pathology and Medicine", link: "/mcqs/oral-pathology-medicine", icon: Activity },
      { label: "Pathology", link: "/mcqs/pathology", icon: Activity },
      { label: "Pharmacology", link: "/mcqs/pharmacology", icon: Activity },
      { label: "Physiology Mcqs", link: "/mcqs/physiology", icon: Activity },
    ]
  },
  {
    title: "OTHER SUBJECTS",
    icon: FileText,
    categories: [
      { label: "Agriculture Mcqs", link: "/mcqs/agriculture", icon: Activity },
      { label: "Economics Mcqs", link: "/mcqs/economics", icon: BarChart2 },
      { label: "English Literature Mcqs", link: "/mcqs/english-literature", icon: Book },
      { label: "Forestry Mcqs", link: "/mcqs/forestry", icon: Activity },
      { label: "International Relations Mcqs", link: "/mcqs/international-relations", icon: Globe2 },
      { label: "Judiciary And Law Mcqs", link: "/mcqs/judiciary-law", icon: Gavel },
      { label: "Physical Education Mcqs", link: "/mcqs/physical-education", icon: Dumbbell },
      { label: "Political Science Mcqs", link: "/mcqs/political-science", icon: Globe2 },
      { label: "Psychology Mcqs", link: "/mcqs/psychology", icon: User },
      { label: "Sociology Mcqs", link: "/mcqs/sociology", icon: Users },
      { label: "Statistics Mcqs", link: "/mcqs/statistics", icon: BarChart2 },
    ]
  },
  {
    title: "SUBMIT MCQS",
    icon: Send,
    categories: [
      { label: "Submit Mcqs", link: "/submit-mcqs", icon: Send },
    ]
  },
  {
    title: "QUIZ MENU",
    icon: ListChecks,
    categories: [
      { label: "Computer Online Quiz", link: "/quiz/computer", icon: Monitor },
      { label: "Everyday Science Quiz", link: "/quiz/everyday-science", icon: ClipboardList },
      { label: "General Knowledge Quiz", link: "/quiz/general-knowledge", icon: ClipboardList },
      { label: "Islamic Studies Mcqs Quiz", link: "/quiz/islamic-studies", icon: CheckCircle },
      { label: "Pakistan Studies Quiz", link: "/quiz/pak-study", icon: ClipboardList },
    ]
  },
  {
    title: "ELECTION OFFICER",
    icon: UserCheck,
    categories: [
      { label: "Election Officer Mcqs", link: "/mcqs/election-officer", icon: UserCheck },
    ]
  },
];

const RightSideBar = () => {
  return (
    <div className="p-5 border-l bg-white rounded-xl shadow-xl space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 border-b pb-2">MCQs Categories</h3>
      {mcqsMenu.map((section, idx) => (
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

export default RightSideBar;
