import React from "react";
import Link from "next/link";
import { getPastPaperCategories } from "../data/categories/pastPapersCategories";

const pastPaperCategories = getPastPaperCategories();

const PastPapersRightSideBar = () => {
  return (
    <div className="col-span-1 p-5 border-l bg-white rounded-xl shadow-xl space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 border-b pb-2">Past Papers</h3>

      {pastPaperCategories.map((cat, idx) => (
        <div key={idx} className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-semibold text-indigo-600 mt-4">
            <cat.icon size={20} />
            {cat.title}
          </div>

          {cat.departments.map((dept, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-all">
              <div className="font-medium text-gray-700 mb-1">{dept.label}</div>
              {dept.roles && (
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {dept.roles.map((role, j) => (
                    <li key={j}>
                      <Link
                        href={role.link}
                        className="hover:text-indigo-500 transition-colors"
                      >
                        {role.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PastPapersRightSideBar;
