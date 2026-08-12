import React, { useEffect, useState } from 'react';
import SEO from '../components/common/SEO';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import { API_BASE_URL } from '../config';

interface LegalSection {
  title: string;
  content: string[];
}

export const TermsConditions: React.FC = () => {
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchTerms = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (response.ok) {
          const data = await response.json();
          setSections(data.termsConditions || []);
        }
      } catch (err) {
        console.error('Failed to load terms:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  return (
    <>
      <SEO
        title="Terms & Conditions — TREEBORN Skincare"
        description="Read the official Terms & Conditions for shopping online and using the TREEBORN Skincare website and services."
      />

      <Navbar />

      <main className="pt-32 pb-24 min-h-[60vh] bg-white font-sans text-slate-800">
        <Container>
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="text-center pb-6 border-b border-slate-100 mb-8">
              <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Terms & Conditions</h1>
              <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest font-semibold">TreeBorn Collection Legal Document</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-650 rounded-full animate-spin" />
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-10 text-slate-400">No terms and conditions content available.</div>
            ) : (
              <div className="space-y-10">
                {sections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-4">
                    <h2 className="text-xl font-display font-bold text-slate-800 tracking-tight">
                      {section.title}
                    </h2>
                    <div className="space-y-4">
                      {section.content?.map((para, pIdx) => (
                        <p key={pIdx} className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
};

export default TermsConditions;
