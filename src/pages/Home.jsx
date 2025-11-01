import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Eventure
          </h1>
          <p className="text-2xl text-emerald-600 font-medium mb-2">
            Your simple, powerful calendar
          </p>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Create events, mark them complete, and stay on top of your schedule with our intuitive calendar.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 md:py-4 md:text-lg md:px-10 transition duration-150 ease-in-out transform hover:-translate-y-1"
            >
              Get Started - It's Free
            </Link>
            <Link 
              to="/login" 
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 md:py-4 md:text-lg md:px-10 transition duration-150 ease-in-out"
            >
              Sign In
            </Link>
          </div>
          
          <div className="mt-16 bg-white p-6 rounded-xl shadow-sm max-w-2xl mx-auto">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Team Meeting</h3>
                <p className="text-sm text-gray-500">10:00 AM - 11:00 AM</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-6 h-6 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-500 line-through">Lunch with Sarah</h3>
                <p className="text-sm text-gray-400">12:30 PM - 1:30 PM</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Project Deadline</h3>
                <p className="text-sm text-gray-500">3:00 PM - 4:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Eventure. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
