import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Clock, Globe } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website_honeypot: '', // Invisible field for spam protection
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Set page meta
  useEffect(() => {
    document.title = "যোগাযোগ করুন | আহরোণ (Ahoroon)";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'আহরোণের সাথে যোগাযোগ করুন। যেকোনো পণ্য সংক্রান্ত অনুসন্ধান, পাইকারি অর্ডার অথবা পরামর্শের জন্য আমাদের ফোন, ইমেল অথবা ফরমের মাধ্যমে জানান।');
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = "আহরোণের সাথে যোগাযোগ করুন। যেকোনো পণ্য সংক্রান্ত অনুসন্ধান, পাইকারি অর্ডার অথবা পরামর্শের জন্য আমাদের ফোন, ইমেল অথবা ফরমের মাধ্যমে জানান।";
      document.head.appendChild(meta);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simple client-side validation
    if (!formData.name.trim()) {
      setError("অনুগ্রহ করে আপনার নাম লিখুন।");
      setLoading(false);
      return;
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা প্রদান করুন।");
      setLoading(false);
      return;
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      setError("বার্তাটি অত্যন্ত সংক্ষিপ্ত। অনুগ্রহ করে অন্তত ১০টি অক্ষর লিখুন।");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "বার্তা পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        website_honeypot: '',
      });
    } catch (err: any) {
      setError(err.message || "সার্ভার সংযোগে ত্রুটি। পরে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-12 max-w-7xl mx-auto space-y-12 bg-slate-50/50 min-h-screen pb-24">
      
      {/* Title Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 tracking-tight">যোগাযোগ করুন</h1>
        <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
          আমাদের যেকোনো পণ্য, সার্ভিস, কাস্টমাইজড উপহার বাক্স বা পাইকারি অর্ডার সম্পর্কে জানতে সরাসরি কল করুন অথবা নিচের ফর্মটি পূরণ করে বার্তা পাঠান। আমাদের টিম অতি দ্রুত আপনার সাথে যোগাযোগ করবে।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Contact info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xs space-y-8">
            <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 border-b border-slate-100 pb-4">
              যোগাযোগের বিবরণ
            </h2>

            <div className="space-y-6">
              {/* Phone item */}
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">সরাসরি ফোন করুন</p>
                  <p className="text-lg font-bold text-slate-800 tracking-wide">+880 1796-361024</p>
                  <p className="text-xs text-slate-500">শনিবার থেকে বৃহস্পতিবার, সকাল ৯টা থেকে রাত ৮টা</p>
                </div>
              </div>

              {/* Email item */}
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">ইমেইল করুন</p>
                  <p className="text-base md:text-lg font-bold text-slate-800">info@ahoron.com</p>
                  <p className="text-xs text-slate-500">যেকোনো ব্যবসায়িক প্রস্তাবের জন্য লিখুন</p>
                </div>
              </div>

              {/* Address item */}
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">আমাদের ঠিকানা</p>
                  <p className="text-sm md:text-base font-semibold text-slate-800 leading-relaxed">
                    Mohammadpur, Bosila, Dhaka, Bangladesh 1207
                  </p>
                </div>
              </div>

              {/* Office hours */}
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">অফিস সময়</p>
                  <p className="text-sm font-semibold text-slate-800">সকাল ১০:০০ - সন্ধ্যা ০৬:০০ (শুক্রবার বন্ধ)</p>
                </div>
              </div>
            </div>

            {/* Social media presence indicator */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider">Social Presence</span>
              <span className="text-[#005900] font-bold">@ahoroonbd</span>
            </div>
          </div>

          {/* Interactive Trust/Safety Callout */}
          <div className="bg-[#005900]/5 border border-[#005900]/10 p-6 rounded-2xl text-slate-700 space-y-2 text-xs md:text-sm">
            <h4 className="font-bold text-[#005900] flex items-center gap-1.5">
              <Globe size={16} />
              আমরা শতভাগ ভেজালমুক্ত নিশ্চিত করি
            </h4>
            <p className="leading-relaxed">
              আহরোণের প্রতিটি পণ্য শতভাগ বিশুদ্ধ ও ল্যাব টেস্টেড। কোনো অভিযোগ বা পরামর্শ থাকলে নিঃসঙ্কোচে আমাদের সাথে যোগাযোগ করুন। আপনার প্রতিটি মতামত আমাদের কাছে অত্যন্ত মূল্যবান।
            </p>
          </div>
        </div>

        {/* Right Column: Contact form */}
        <div className="lg:col-span-7 bg-white border border-slate-100 p-8 sm:p-10 rounded-[2.5rem] shadow-xs">
          <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">
            বার্তা পাঠান
          </h2>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={36} className="animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">বার্তা সফলভাবে পাঠানো হয়েছে!</h3>
                <p className="text-slate-500 text-sm max-w-md leading-relaxed">
                  ধন্যবাদ! আপনার বার্তাটি আমাদের গ্রাহক সহায়তা টিমের কাছে সফলভাবে পৌঁছেছে। আমরা দ্রুত আপনার ইমেইল বা মোবাইল নম্বরে যোগাযোগ করব।
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-4 px-6 py-2.5 bg-[#005900] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#004000] cursor-pointer transition-colors"
                >
                  আরেকটি বার্তা পাঠান
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="contact-form"
                onSubmit={handleSubmit}
                className="space-y-5"
                noValidate
              >
                {/* Honeypot field (hidden from screen, filled by automated bots) */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website_honeypot">Leave this field blank</label>
                  <input
                    type="text"
                    id="website_honeypot"
                    name="website_honeypot"
                    value={formData.website_honeypot}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-rose-600 text-xs md:text-sm items-start">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-bold text-slate-600 uppercase tracking-wider">আপনার নাম *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="যেমন: আহসান হাবীব"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-[#005900]/50 focus:ring-4 focus:ring-[#005900]/5 transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-slate-600 uppercase tracking-wider">ইমেইল ঠিকানা *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="যেমন: ahsan@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-[#005900]/50 focus:ring-4 focus:ring-[#005900]/5 transition-all"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-xs font-bold text-slate-600 uppercase tracking-wider">বিষয়</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    placeholder="যেমন: পাইকারি অর্ডারের তথ্য"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-[#005900]/50 focus:ring-4 focus:ring-[#005900]/5 transition-all"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-xs font-bold text-slate-600 uppercase tracking-wider">আপনার বার্তা *</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="এখানে আপনার জিজ্ঞাসা বিস্তারিত লিখুন (অন্তত ১০টি অক্ষর)..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-[#005900]/50 focus:ring-4 focus:ring-[#005900]/5 transition-all resize-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#005900] text-white hover:bg-[#004000] border-b-[3px] border-b-[#003000] rounded-2xl py-4.5 font-bold text-xs md:text-sm tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer transform active:translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>বার্তা পাঠান</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Map Section */}
      <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-[2.5rem] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-xl md:text-2xl font-display font-black text-slate-900 flex items-center gap-2">
              <MapPin className="text-emerald-600 animate-bounce" size={24} />
              <span>আমাদের অবস্থান</span>
            </h3>
            <p className="text-slate-400 text-xs md:text-sm font-medium">
              সহজেই ম্যাপের মাধ্যমে আমাদের শোরুম বা সংগ্রহ কেন্দ্রে চলে আসুন।
            </p>
          </div>
          <a
            href="https://maps.google.com/?q=Bosila,Mohammadpur,Dhaka"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#005900] text-white hover:bg-[#004000] px-5 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm self-start md:self-auto cursor-pointer"
          >
            <span>গুগল ম্যাপে দেখুন</span>
            <Globe size={14} />
          </a>
        </div>

        <div className="relative w-full h-[350px] md:h-[450px] rounded-2xl md:rounded-[1.5rem] overflow-hidden border border-slate-100">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14608.036944850787!2d90.344331!3d23.74705!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c0a3f3df21c3%3A0x6b44a30e84b7264a!2sBosila%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1710000000000!5m2!1sen!2sbd"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ahroroon Google Map"
            className="w-full h-full grayscale-[15%] contrast-[105%]"
          />
        </div>
      </div>
    </div>
  );
}
