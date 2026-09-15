'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Plus, Mail, Building, Phone, Tag, Trash2 } from 'lucide-react';
import { DocdrilContact } from '@/types';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<DocdrilContact[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');

  const loadContacts = () => {
    fetch('/api/v1/contacts')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setContacts(data.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      const res = await fetch('/api/v1/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, phone }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setName('');
        setEmail('');
        setCompany('');
        setPhone('');
        loadContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      const res = await fetch(`/api/v1/contacts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans p-3 sm:p-4 space-y-4 select-none">
      {/* Floating Spatial Header */}
      <header className="glass-surface px-4 sm:px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Inbox</span>
          </Link>
          <div className="h-4 w-px bg-white/60" />
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center shadow-[0_0_12px_rgba(244,114,182,0.5)]">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">DocMail Contacts</h1>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="rose-glow-btn px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Contact</span>
        </button>
      </header>

      {/* Contacts Grid */}
      <main className="flex-1 max-w-6xl mx-auto w-full">
        {contacts.length === 0 ? (
          <div className="glass-surface p-10 text-center space-y-4 my-8 max-w-md mx-auto">
            <div className="w-14 h-14 glass-inset rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">No Contacts Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                Add business contacts or they will automatically sync as you send and receive emails.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="rose-glow-btn px-5 py-2.5 text-xs font-bold inline-flex items-center space-x-2 cursor-pointer uppercase tracking-wider shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Contact</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="glass-card p-4 sm:p-5 space-y-3 flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-300 to-rose-400 flex items-center justify-center font-black text-white text-sm shadow-[0_0_12px_rgba(244,114,182,0.4)] flex-shrink-0">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h2 className="text-sm font-bold text-slate-900 truncate">{c.name}</h2>
                      <div className="text-xs text-slate-500 flex items-center space-x-1 truncate">
                        <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-white/60 mt-3">
                    {c.company && (
                      <div className="flex items-center space-x-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.company}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                  </div>

                  {c.tags && c.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="glass-inset text-slate-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="pt-3 border-t border-white/60 flex items-center justify-between">
                  <a
                    href={`mailto:${c.email}`}
                    className="glass-card px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-rose-500" />
                    <span>Send Email</span>
                  </a>

                  <button
                    onClick={() => handleDeleteContact(c.id)}
                    className="p-1.5 glass-card rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
          <div className="glass-surface w-full max-w-md p-6 space-y-4 shadow-2xl border border-white/80">
            <h2 className="text-base font-extrabold text-slate-900">Create New Contact</h2>
            <form onSubmit={handleCreateContact} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-inset p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="jane@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-inset p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Company (Optional)</label>
                <input
                  type="text"
                  placeholder="Docdril Inc."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full glass-inset p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full glass-inset p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rose-glow-btn px-5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
