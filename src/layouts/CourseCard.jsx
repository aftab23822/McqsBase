import React from 'react';
import { Play, Clock, Users, Star, ArrowRight, GraduationCap, BookOpen, Award } from 'lucide-react';

const CourseCard = ({ courses }) => {
  return (
    <>
      <section className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-4xl font-bold text-gray-900">Our Courses</h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Master your exam preparation with our comprehensive video courses designed by experts
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(({ id, title, description, videoUrl }) => (
            <div key={id} className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group">
              
              {/* Video Thumbnail */}
              <div className="relative">
                <iframe 
                  className="w-full h-48" 
                  src={videoUrl} 
                  title={title} 
                  frameBorder="0" 
                  allowFullScreen
                ></iframe>
                <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-6 h-6 text-blue-600 ml-1" />
                  </div>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-600">Video Course</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">4.8</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {title}
                </h3>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {description}
                </p>

                {/* Course Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>45 min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>1.2k students</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-3 h-3 text-yellow-500" />
                    <span>Premium</span>
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group-hover:shadow-lg">
                  <span>Start Learning</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* See More Button */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2 mx-auto group hover:shadow-lg">
            <span>See More Courses</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </section> 
    </>
  );
}

export default CourseCard;
