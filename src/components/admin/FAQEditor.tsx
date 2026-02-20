"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
  sortOrder: number;
}

interface FAQEditorProps {
  faqs: FAQItem[];
  onChange: (faqs: FAQItem[]) => void;
}

export default function FAQEditor({ faqs, onChange }: FAQEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function addFAQ() {
    const newFaq: FAQItem = {
      question: "",
      answer: "",
      sortOrder: faqs.length,
    };
    const updated = [...faqs, newFaq];
    onChange(updated);
    setExpandedIndex(updated.length - 1);
  }

  function removeFAQ(index: number) {
    if (!confirm("Supprimer cette question FAQ ?")) return;
    const updated = faqs.filter((_, i) => i !== index).map((f, i) => ({
      ...f,
      sortOrder: i,
    }));
    onChange(updated);
    setExpandedIndex(null);
  }

  function updateFAQ(index: number, field: "question" | "answer", value: string) {
    const updated = faqs.map((f, i) =>
      i === index ? { ...f, [field]: value } : f
    );
    onChange(updated);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...faqs];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated.map((f, i) => ({ ...f, sortOrder: i })));
    setExpandedIndex(index - 1);
  }

  function moveDown(index: number) {
    if (index === faqs.length - 1) return;
    const updated = [...faqs];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated.map((f, i) => ({ ...f, sortOrder: i })));
    setExpandedIndex(index + 1);
  }

  return (
    <div className="space-y-3">
      {faqs.length === 0 ? (
        <p className="text-sm text-gray-500 italic py-4 text-center">
          Aucune question FAQ. Cliquez sur le bouton ci-dessous pour en ajouter.
        </p>
      ) : (
        faqs.map((faq, index) => (
          <div
            key={faq.id || `new-${index}`}
            className="border border-gray-200 rounded-lg bg-white overflow-hidden"
          >
            {/* FAQ header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50">
              <GripVertical size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 font-mono w-6">
                #{index + 1}
              </span>

              <button
                type="button"
                onClick={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
                className="flex-1 text-left text-sm font-medium text-gray-700 truncate hover:text-[#80368D] transition-colors"
              >
                {faq.question || "Nouvelle question..."}
              </button>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Monter"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === faqs.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Descendre"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeFAQ(index)}
                  className="p-1 text-red-400 hover:text-red-600 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* FAQ content (expanded) */}
            {expandedIndex === index && (
              <div className="px-4 py-4 space-y-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question *
                  </label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) =>
                      updateFAQ(index, "question", e.target.value)
                    }
                    placeholder="Ex: Comment télécharger cet ouvrage ?"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Réponse *
                  </label>
                  <RichTextEditor
                    content={faq.answer}
                    onChange={(html) => updateFAQ(index, "answer", html)}
                    placeholder="Rédigez la réponse ici..."
                  />
                </div>
              </div>
            )}
          </div>
        ))
      )}

      <button
        type="button"
        onClick={addFAQ}
        className="flex items-center gap-2 text-sm font-medium text-[#80368D] hover:text-[#6a2d76] bg-purple-50 hover:bg-purple-100 px-4 py-2.5 rounded-lg transition-colors w-full justify-center"
      >
        <Plus size={16} />
        Ajouter une question FAQ
      </button>
    </div>
  );
}
