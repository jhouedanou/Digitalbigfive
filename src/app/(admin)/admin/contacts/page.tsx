"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string | null;
  jobTitle: string | null;
  createdAt: string;
  downloads: { resource: { title: string } }[];
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    fetch("/api/contacts")
      .then((res) => res.json())
      .then((data) => setContacts(data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Contacts ({contacts.length})
        </h1>
        <a
          href="/api/contacts/export"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Download size={16} />
          Export CSV
        </a>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Nom
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Email
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Organisation
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Fonction
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Ressources
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {c.firstName} {c.lastName}
                </td>
                <td className="px-6 py-4 text-gray-600">{c.email}</td>
                <td className="px-6 py-4 text-gray-600">
                  {c.organization || "-"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {c.jobTitle || "-"}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {c.downloads.map((d) => d.resource.title).join(", ") || "-"}
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contacts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun contact collecté
          </div>
        )}
      </div>
    </div>
  );
}
