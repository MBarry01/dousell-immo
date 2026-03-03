'use client';
import type { TableBlock as T } from '@/types/article';

interface Props { block: T; onChange: (b: T) => void; }

export function TableBlock({ block, onChange }: Props) {
  const setHeader = (i: number, val: string) => {
    const headers = [...block.headers];
    headers[i] = val;
    onChange({ ...block, headers });
  };
  const setCell = (r: number, c: number, val: string) => {
    const rows = block.rows.map(row => [...row]);
    rows[r][c] = val;
    onChange({ ...block, rows });
  };
  const addCol = () => onChange({ ...block, headers: [...block.headers, ''], rows: block.rows.map(r => [...r, '']) });
  const addRow = () => onChange({ ...block, rows: [...block.rows, block.headers.map(() => '')] });

  return (
    <div className="overflow-x-auto space-y-2">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              {block.headers.map((h, i) => (
                <th key={i} className="border-b border-border p-2">
                  <input value={h} onChange={e => setHeader(i, e.target.value)}
                    placeholder={`En-tête ${i + 1}`}
                    className="w-full bg-transparent font-semibold text-foreground text-center outline-none" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="border-b border-border p-2">
                    <input value={cell} onChange={e => setCell(r, c, e.target.value)}
                      placeholder="—"
                      className="w-full bg-transparent text-foreground text-center outline-none" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button onClick={addRow} className="text-xs text-[#F4C430] hover:underline">+ Ligne</button>
        <button onClick={addCol} className="text-xs text-[#F4C430] hover:underline">+ Colonne</button>
      </div>
    </div>
  );
}
