import React from 'react';
import Link from 'next/link';
import PastPapersRightSideBar from './PastPapersRightSideBar';
import { Clock10 } from 'lucide-react';

const ComingSoon = () => {
    return (
        // <section className="px-4 py-8 bg-gray-100">
        //   <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">

        //     {/* Left: Coming Soon Message */}
        //     <div className="col-span-2 flex items-center justify-center min-h-[90vh]">
        //       <div className="text-center bg-white shadow-xl p-10 rounded-xl space-y-6 w-full">
        //         <Clock10 size={50} className="text-indigo-500 mx-auto" />
        //         <h1 className="text-3xl font-bold text-gray-800">Coming Soon!</h1>
        //         <p className="text-lg text-gray-600 max-w-xl mx-auto">
        //           We are working hard to bring you past papers for this category. Please check back later!
        //         </p>
        //         <Link
        //           to="/past-papers"
        //           className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition duration-300"
        //         >
        //           Go Back to Past Papers
        //         </Link>
        //       </div>
        //     </div>

        //     {/* Right: Sidebar */}
        //     <div className="h-fit sticky top-20">
        //       <PastPapersRightSideBar isLinkToComingSoon={true} />
        //     </div>
        //   </div>
        // </section>
        <section className="full-screen px-4 py-8 bg-gray-100">
            <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-2">

                {/* Left Column */}
                <div className="col-span-2 p-62rounded-lg space-y-6">
                    <div className="p-1 sm:p-6 md:p-10 space-y-6 pb-20">
                        {/* Left: Coming Soon Message */}
                        <div className="col-span-2 flex items-center justify-center">
                            <div className="text-center bg-white shadow-xl p-10 rounded-xl space-y-6 w-full">
                                <Clock10 size={50} className="text-indigo-500 mx-auto" />
                                <h1 className="text-3xl font-bold text-gray-800">Coming Soon!</h1>
                                <p className="text-lg text-gray-600 max-w-xl mx-auto">
                                    We are working hard to bring you past papers for this category. Please check back later!
                                </p>
                                <Link
                                    href="/past-papers"
                                    className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition duration-300"
                                >
                                    Go Back to Past Papers
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Sidebar */}
                <div className="h-fit sticky top-20">
                    <PastPapersRightSideBar isLinkToComingSoon={true} />
                </div>
            </div>
        </section>
    );
};

export default ComingSoon;
