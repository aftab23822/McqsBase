"use client";

import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle admin login
    console.log('Admin login attempted:', credentials);
    setLoginStatus('error'); // Mock error for demo
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Admin Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Restricted area - authorized personnel only
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="relative block w-full pl-10 pr-3 py-3 border border-gray-700 bg-gray-800 text-white rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Username"
                  value={credentials.username}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="relative block w-full pl-10 pr-10 py-3 border border-gray-700 bg-gray-800 text-white rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Password"
                  value={credentials.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign in to Admin Panel
            </button>
          </div>
          
          {loginStatus === 'error' && (
            <div className="text-center text-red-400 text-sm">
              Invalid credentials. Access denied.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;