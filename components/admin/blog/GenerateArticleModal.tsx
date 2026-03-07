'use client';
// components/admin/blog/GenerateArticleModal.tsx
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
const CATEGORIES = ['Guides', 'Investissement', 'Juridique', 'Marché', 'Conseils', 'Innovation'];
const ANGLES = ['Guide pratique', 'Analyse de marché', 'Comparatif', 'Réglementation juridique', 'Conseils diaspora'];
const PUBLICS = ['Propriétaire', 'Investisseur/Diaspora', 'Locataire', 'Agent immobilier'];
const LONGUEURS = ['Standard 1200 mots', 'Court 800 mots', 'Long 2000 mots'];

interface Props {
  userEmail: string;
}

export function GenerateArticleModal({ userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    sujet: '',
    categorie: 'Guides',
    angle: 'Analyse de marché',
    public_cible: 'Propriétaire',
    longueur: 'Standard 1200 mots',
    email_notif: userEmail,
  });

  const router = useRouter();

  // Listen for realtime article generation from n8n
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('article-generation-listener')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'articles' },
        (payload) => {
          if (payload.new.status === 'draft') {
            toast.success('🎉 Article généré avec succès !', {
              description: `"${payload.new.title}" est maintenant disponible brouillon.`,
              duration: 5000,
            });
            router.refresh(); // Automatically refresh the page to show the new article
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erreur inconnue');
      } else {
        setSuccess(true);
        setTimeout(() => { setOpen(false); setSuccess(false); }, 3000);
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="rounded-full border border-[#F4C430] text-[#F4C430] px-5 py-2.5 text-sm font-semibold hover:bg-[#F4C430]/10 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
        >
          ✨ Générer avec IA
        </button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-lg rounded-2xl p-6 sm:max-w-lg">
        <DialogHeader className="mb-2">
          <DialogTitle>Générer un article avec IA</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-foreground">Génération lancée !</p>
            <p className="text-sm text-muted-foreground mt-1">Vous recevrez un email à <strong>{form.email_notif}</strong> quand l'article sera prêt.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sujet <span className="text-muted-foreground/60">(optionnel en mode auto)</span></label>
              <input
                type="text"
                value={form.sujet}
                onChange={e => set('sujet', e.target.value)}
                placeholder="Ex : Impact des taux d'intérêt sur l'immobilier à Dakar"
                className="mt-1 w-full rounded-xl bg-muted border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#F4C430]/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Catégorie</label>
                <select value={form.categorie} onChange={e => set('categorie', e.target.value)} className="mt-1 w-full rounded-xl bg-muted border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F4C430]/40">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Angle</label>
                <select value={form.angle} onChange={e => set('angle', e.target.value)} className="mt-1 w-full rounded-xl bg-muted border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F4C430]/40">
                  {ANGLES.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Public cible</label>
                <select value={form.public_cible} onChange={e => set('public_cible', e.target.value)} className="mt-1 w-full rounded-xl bg-muted border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F4C430]/40">
                  {PUBLICS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Longueur</label>
                <select value={form.longueur} onChange={e => set('longueur', e.target.value)} className="mt-1 w-full rounded-xl bg-muted border border-border px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F4C430]/40">
                  {LONGUEURS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email de notification</label>
              <input
                type="email"
                value={form.email_notif}
                onChange={e => set('email_notif', e.target.value)}
                required
                className="mt-1 w-full rounded-xl bg-muted border border-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#F4C430]/40"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-[#F4C430] text-black py-2.5 text-sm font-semibold hover:bg-[#E5B82A] transition-colors disabled:opacity-60">
                {loading ? 'Lancement…' : '✨ Générer'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
