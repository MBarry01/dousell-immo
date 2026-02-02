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
    setIsSearching(true);
    const result = await searchOwners(query);
    setOwners(result.owners);
    setIsSearching(false);
  }, []);

  // Charger la liste initiale à l'ouverture
  useEffect(() => {
    if (isOpen) {
      handleSearch("");
    }
  }, [isOpen, handleSearch]);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      // Ne pas relancer la recherche vide car déjà faite au chargement
      if (searchQuery.trim().length > 0) {
        handleSearch(searchQuery);
      } else if (searchQuery === "" && isOpen) {
        // Optionnel : recharger la liste vide si on efface tout
        handleSearch("");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch, isOpen]);

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
      <label className="block text-sm font-medium text-muted-foreground mb-2">
        Propriétaire du bien
      </label>

      {/* Propriétaire sélectionné */}
      {selectedOwner ? (
        <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">{selectedOwner.full_name}</p>
              <p className="text-sm text-muted-foreground">{selectedOwner.phone}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Bouton d'ouverture */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center gap-3 bg-background border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <User className="w-5 h-5" />
            </div>
            <span className="text-muted-foreground">Sélectionner un propriétaire...</span>
          </button>
        </>
      )}

      {/* Modal de sélection */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {showCreateForm ? "Nouveau propriétaire" : "Sélectionner un propriétaire"}
                </h3>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateForm(false);
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!showCreateForm && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, téléphone..."
                    className="w-full bg-muted border border-transparent focus:bg-background focus:border-primary rounded-lg pl-10 pr-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
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
                    <label className="block text-sm text-muted-foreground mb-1">Nom complet *</label>
                    <input
                      type="text"
                      value={newOwner.full_name}
                      onChange={(e) => setNewOwner({ ...newOwner, full_name: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Ex: Mamadou Diallo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Téléphone *</label>
                    <input
                      type="tel"
                      value={newOwner.phone}
                      onChange={(e) => setNewOwner({ ...newOwner, phone: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Ex: 77 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Email (optionnel)</label>
                    <input
                      type="email"
                      value={newOwner.email}
                      onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Ex: mamadou@email.com"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {isSearching ? (
                    <div className="text-center py-8 text-muted-foreground">Recherche...</div>
                  ) : owners.length > 0 ? (
                    <div className="space-y-2">
                      {owners.map((owner) => (
                        <button
                          key={owner.id}
                          type="button"
                          onClick={() => handleSelect(owner)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                        >
                          <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-background border border-transparent group-hover:border-border flex items-center justify-center transition-colors">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{owner.full_name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun propriétaire trouvé. Créez-en un nouveau.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/20">
              {showCreateForm ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newOwner.full_name || !newOwner.phone || isCreating}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? "Création..." : "Créer"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
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
