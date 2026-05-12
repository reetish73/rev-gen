"use client";

import { use, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { generateReviews } from '@/app/actions/generate';
import { motion, AnimatePresence } from 'framer-motion';

type Business = {
  name: string;
  primary_offerings: any;
  category?: string;
};

type GeneratedReviews = {
  minimalist: string;
  enthusiastic_local: string;
  balanced_professional: string;
};

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedOfferings, setSelectedOfferings] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReviews, setGeneratedReviews] = useState<GeneratedReviews | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBusiness() {
      try {
        setLoading(true);
        // Add category to select if it exists, otherwise it will just be ignored
        const { data, error } = await supabase
          .from('import_businesses')
          .select('name, primary_offerings')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        setBusiness(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching the business.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchBusiness();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-100 border-t-[#4F46E5] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center text-center">
        <div className="text-slate-300 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-slate-800">Business not found</h2>
        <p className="text-slate-500 mt-2 text-sm max-w-xs">{error}</p>
      </div>
    );
  }

  let offerings: string[] = [];
  if (Array.isArray(business.primary_offerings)) {
    offerings = business.primary_offerings;
  } else if (typeof business.primary_offerings === 'string') {
    try {
      offerings = JSON.parse(business.primary_offerings);
    } catch(e) {}
  }

  const toggleOffering = (offering: string) => {
    setSelectedOfferings(prev => {
      const next = new Set(prev);
      if (next.has(offering)) {
        next.delete(offering);
      } else {
        next.add(offering);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError(null);
    setGeneratedReviews(null);

    const tagsArray = Array.from(selectedOfferings);
    const category = business.category || offerings[0] || "Business";

    const res = await generateReviews(business.name, category, tagsArray, note);

    if (res.success && res.data) {
      setGeneratedReviews(res.data);
    } else {
      setGenError(res.error || "Something went wrong");
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-20">
      <main className="max-w-md mx-auto p-6 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="mb-10 pt-4">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 leading-snug">
            Reviewing <br />
            <span className="text-[#4F46E5] font-bold">{business.name}</span>
          </h1>
        </header>

        {/* Pills Section */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Select Offerings
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {offerings.length > 0 ? (
              offerings.map((offering, idx) => {
                const isSelected = selectedOfferings.has(offering);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleOffering(offering)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-out border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      isSelected 
                        ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-sm transform scale-[1.02]' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                  >
                    {offering}
                  </button>
                );
              })
            ) : (
              <p className="text-slate-400 text-sm">No specific offerings listed.</p>
            )}
          </div>
        </section>

        {/* Input Section */}
        <section className="mb-10">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Additional Notes
          </h2>
          <div className="relative">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a custom note..."
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all placeholder:text-slate-400 text-slate-800 shadow-sm hover:shadow-md focus:shadow-md focus:bg-white"
            />
          </div>
        </section>

        {/* Action Button */}
        <div className="mb-8">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-[#4F46E5] hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-medium text-lg py-4 rounded-2xl shadow-[0_8px_16px_rgba(79,70,229,0.25)] hover:shadow-[0_12px_20px_rgba(79,70,229,0.35)] disabled:shadow-none transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Generate Reviews</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
          
          {genError && (
            <p className="text-red-500 text-sm mt-3 text-center">{genError}</p>
          )}
        </div>

        {/* Generated Reviews Display */}
        <AnimatePresence>
          {generatedReviews && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
              className="mt-4 flex flex-col gap-6"
            >
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">
                Generated Reviews
              </h2>
              
              {/* Minimalist Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-slate-800">The Minimalist</h3>
                  <button className="text-slate-400 hover:text-[#4F46E5] transition-colors" onClick={() => navigator.clipboard.writeText(generatedReviews.minimalist)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
                <p className="text-slate-600 text-[15px] leading-relaxed">"{generatedReviews.minimalist}"</p>
              </motion.div>

              {/* Enthusiastic Local Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white border border-indigo-50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-[#4F46E5]"></div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-slate-800">The Enthusiastic Local</h3>
                  <button className="text-slate-400 hover:text-[#4F46E5] transition-colors" onClick={() => navigator.clipboard.writeText(generatedReviews.enthusiastic_local)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
                <p className="text-slate-600 text-[15px] leading-relaxed">"{generatedReviews.enthusiastic_local}"</p>
              </motion.div>

              {/* Balanced Professional Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white border border-emerald-50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-slate-800">The Balanced Professional</h3>
                  <button className="text-slate-400 hover:text-emerald-500 transition-colors" onClick={() => navigator.clipboard.writeText(generatedReviews.balanced_professional)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
                <p className="text-slate-600 text-[15px] leading-relaxed">"{generatedReviews.balanced_professional}"</p>
              </motion.div>

            </motion.section>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
