"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function FAQSection({ faqs }: { faqs: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (faqs.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Questions fréquentes
      </h2>
      {faqs.map((faq, index) => (
        <div
          key={faq.id}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">{faq.question}</span>
            <ChevronDown
              size={20}
              className={`text-gray-400 transition-transform ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`accordion-content ${openIndex === index ? "open" : ""}`}
          >
            <div className="px-4 pb-4 text-gray-600 text-sm">
              {faq.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
