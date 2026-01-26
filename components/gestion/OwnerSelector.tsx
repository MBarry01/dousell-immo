"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, User, Phone, Mail, Check, X } from "lucide-react";
import { searchOwners, createOwner } from "@/app/(workspace)/gestion/biens/actions";

type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

type OwnerSelectorProps = {
  value?: string;
  onChange: (ownerId: string | undefined, ownerData?: Owner) => void;
  className?: string;
};

export function OwnerSelector({ value, onChange, className = "" }: OwnerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOwner, setNewOwner] = useState({ full_name: "", phone: "", email: "" });
  const [isCreating, setIsCreating] = useState(false);

  // Recherche de propriétaires
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setOwners([]);
      return;
    }

    setIsSearching(true);
    const result = await searchOwners(query);
    setOwners(result.owners);
    setIsSearching(false);
  }, []);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Sélection d'un propriétaire
  const handleSelect = (owner: Owner) => {
    setSelectedOwner(owner);
    onChange(owner.id, owner);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Créer un nouveau propriétaire
  const handleCreate = async () => {
    if (!newOwner.full_name || !newOwner.phone) return;

    setIsCreating(true);
    const result = await createOwner(newOwner);
    setIsCreating(false);

    if (result.success && result.owner) {
      setSelectedOwner(result.owner);
      onChange(result.owner.id, result.owner);
      setShowCreateForm(false);
      setNewOwner({ full_name: "", phone: "", email: "" });
      setIsOpen(false);
    }
  };

  // Retirer le propriétaire sélectionné
  const handleClear = () => {
    setSelectedOwner(null);
    onChange(undefined);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-zinc-300 mb-2">
        Propriétaire du bien
      </label>

      {/* Propriétaire sélectionné */}
      {selectedOwner ? (
        <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="font-medium text-white">{selectedOwner.full_name}</p>
              <p className="text-sm text-zinc-400">{selectedOwner.phone}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      ) : (
        <>
          {/* Bouton d'ouverture */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-lg p-3 hover:border-zinc-600 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <span className="text-zinc-400">Sélectionner un propriétaire...</span>
          </button>
        </>
      )}

      {/* Modal de sélection */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {showCreateForm ? "Nouveau propriétaire" : "Sélectionner un propriétaire"}
                </h3>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateForm(false);
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {!showCreateForm && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, téléphone..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#F4C430]"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {showCreateForm ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Nom complet *</label>
                    <input
                      type="text"
                      value={newOwner.full_name}
                      onChange={(e) => setNewOwner({ ...newOwner, full_name: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#F4C430]"
                      placeholder="Ex: Mamadou Diallo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Téléphone *</label>
                    <input
                      type="tel"
                      value={newOwner.phone}
                      onChange={(e) => setNewOwner({ ...newOwner, phone: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#F4C430]"
                      placeholder="Ex: 77 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Email (optionnel)</label>
                    <input
                      type="email"
                      value={newOwner.email}
                      onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#F4C430]"
                      placeholder="Ex: mamadou@email.com"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {isSearching ? (
                    <div className="text-center py-8 text-zinc-500">Recherche...</div>
                  ) : owners.length > 0 ? (
                    <div className="space-y-2">
                      {owners.map((owner) => (
                        <button
                          key={owner.id}
                          type="button"
                          onClick={() => handleSelect(owner)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                            <User className="w-5 h-5 text-zinc-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{owner.full_name}</p>
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                              {owner.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {owner.phone}
                                </span>
                              )}
                              {owner.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {owner.email}
                                </span>
                              )}
                            </div>
                          </div>
                          {value === owner.id && (
                            <Check className="w-5 h-5 text-[#F4C430]" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="text-center py-8 text-zinc-500">
                      Aucun propriétaire trouvé
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-500">
                      Tapez au moins 2 caractères pour rechercher
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800">
              {showCreateForm ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-zinc-700 rounded-lg text-white hover:bg-zinc-800 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newOwner.full_name || !newOwner.phone || isCreating}
                    className="flex-1 px-4 py-2 bg-[#F4C430] text-black rounded-lg font-medium hover:bg-[#F4C430]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? "Création..." : "Créer"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-zinc-600 rounded-lg text-zinc-300 hover:border-[#F4C430] hover:text-[#F4C430] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Créer un nouveau propriétaire
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
