import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { componentFamily } from '../utils/boardEdit';

interface Suggestion { label: string; prompt: string; send: boolean }

/** Contextual next-step suggestions derived from what is actually on the board. */
export function buildSuggestions(doms: Record<string, any>, language: string): Suggestion[] {
  const id = language !== 'en';
  const list: Suggestion[] = [];
  const seen = new Set<string>();
  Object.values(doms).forEach((el: any) => {
    const fam = componentFamily(el);
    const title = el.config?.title || el.componentType || '';
    if (seen.has(fam)) return;
    seen.add(fam);
    if (fam === 'mindmap' || fam === 'markmap' || fam === 'flowchart') {
      list.push({ label: id ? 'Tambah cabang' : 'Add a branch', prompt: id ? `Tambahkan cabang baru ke "${title}": ` : `Add a new branch to "${title}": `, send: false });
      list.push({ label: id ? 'Buat catatan dari peta ini' : 'Notes from this map', prompt: id ? `Buatkan catatan materi dari "${title}".` : `Write study notes from "${title}".`, send: true });
    } else if (fam === 'document') {
      list.push({ label: id ? 'Sambung catatan' : 'Continue the notes', prompt: id ? `Lanjutkan "${title}" dengan bagian berikutnya.` : `Continue "${title}" with the next section.`, send: true });
      list.push({ label: id ? 'Buat kuis dari catatan' : 'Quiz from notes', prompt: id ? `Buat 5 soal kuis dari "${title}".` : `Create a 5-question quiz from "${title}".`, send: true });
    } else if (fam === 'quiz') {
      list.push({ label: id ? 'Tambah pilihan / ubah soal' : 'Edit this question', prompt: id ? `Ubah soal "${title}": ` : `Edit the question "${title}": `, send: false });
    } else if (fam === 'todo' || fam === 'attendance') {
      list.push({ label: id ? 'Tambah item' : 'Add items', prompt: id ? `Tambahkan ke "${title}": ` : `Add to "${title}": `, send: false });
    }
  });
  if (list.length === 0) {
    list.push(
      { label: id ? 'Buat peta konsep' : 'Make a mind map', prompt: id ? 'Buat peta konsep tentang ' : 'Make a mind map about ', send: false },
      { label: id ? 'Buat kuis' : 'Make a quiz', prompt: id ? 'Buat 5 soal kuis tentang ' : 'Create a 5-question quiz about ', send: false },
      { label: id ? 'Pasang timer 10 menit' : '10-minute timer', prompt: id ? 'Pasang timer 10 menit' : 'Start a 10 minute timer', send: true },
    );
  }
  return list.slice(0, 4);
}

interface Props {
  language: string;
  disabled?: boolean;
  onSend: (prompt: string) => void;
  onFill: (prompt: string) => void;
  className?: string;
}

export const AiSuggestionChips: React.FC<Props> = ({ language, disabled, onSend, onFill, className = '' }) => {
  const doms = useStore(s => s.domElements);
  const suggestions = useMemo(() => buildSuggestions(doms, language), [doms, language]);
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Saran">
      {suggestions.map(s => (
        <button
          key={s.label}
          type="button"
          disabled={disabled}
          onClick={() => (s.send ? onSend(s.prompt) : onFill(s.prompt))}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white hover:bg-trido/5 text-trido border border-trido/20 text-[12px] font-bold transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Sparkles size={11} /> {s.label}
        </button>
      ))}
    </div>
  );
};
