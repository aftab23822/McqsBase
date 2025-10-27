"use client";

import React, { useState } from 'react';
import { Mail, Phone, User, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { ReCaptchaButton } from './recaptcha';
import { useReCaptcha } from './recaptcha';
import { apiFetch } from '../utils/api';
// SEO deprecated in App Router\n
const ContactUsForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear validation error when user starts typing
    if (validationErrors[e.target.name]) {
      setValidationErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (recaptchaToken) => {
    // Validate form before proceeding
    if (!validateForm()) {
      setSubmitStatus('validation_error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await apiFetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Recaptcha-Token': recaptchaToken,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        setValidationErrors({});
      } else {
        setSubmitStatus('error');
        console.error('Contact form submission failed:', result.message);
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact McqsBase.com",
    "description": "Get in touch with McqsBase.com for questions, feedback, or collaboration regarding Pakistan competitive exam preparation.",
    "url": "https://mcqsbase.com/contact",
    "mainEntity": {
      "@type": "Organization",
      "name": "McqsBase.com",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "contact@mcqsbase.com"
      }
    }
  };

  return (
    <>
      {/* SEO handled by metadata API */}
      <section className="bg-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8 space-y-6">
          <h2 className="text-3xl font-bold text-center text-indigo-700">Contact Us</h2>
          <p className="text-center text-gray-600 max-w-lg mx-auto">
            Have a question, feedback, or want to collaborate? We'd love to hear from you!
          </p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className={`flex items-center border rounded-lg px-3 py-2 bg-gray-50 ${validationErrors.name ? 'border-red-500' : ''}`}>
                  <User className="text-gray-400 mr-2" size={20} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent focus:outline-none"
                  />
                </div>
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <div className={`flex items-center border rounded-lg px-3 py-2 bg-gray-50 ${validationErrors.email ? 'border-red-500' : ''}`}>
                  <Mail className="text-gray-400 mr-2" size={20} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent focus:outline-none"
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <div className={`flex items-center border rounded-lg px-3 py-2 bg-gray-50 ${validationErrors.subject ? 'border-red-500' : ''}`}>
                <MessageSquare className="text-gray-400 mr-2" size={20} />
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent focus:outline-none"
                />
              </div>
              {validationErrors.subject && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.subject}</p>
              )}
            </div>

            <div>
              <textarea
                name="message"
                rows="5"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleChange}
                required
                className={`w-full border rounded-lg px-4 py-3 bg-gray-50 focus:outline-none ${validationErrors.message ? 'border-red-500' : ''}`}
              />
              {validationErrors.message && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.message}</p>
              )}
            </div>

            <div className="text-center">
              <ReCaptchaButton
                onSubmit={handleSubmit}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                loadingText="Sending..."
                action="contact_form"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </ReCaptchaButton>
            </div>
          </form>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">Message Sent Successfully!</p>
                  <p className="text-green-700 text-sm">Thank you for contacting us. We'll get back to you soon.</p>
                </div>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-red-800 font-medium">Failed to Send Message</p>
                  <p className="text-red-700 text-sm">Please try again or contact us directly.</p>
                </div>
              </div>
            </div>
          )}

          {submitStatus === 'validation_error' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-yellow-800 font-medium">Please Fix the Errors</p>
                  <p className="text-yellow-700 text-sm">Please fill in all required fields correctly.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ContactUsForm;
