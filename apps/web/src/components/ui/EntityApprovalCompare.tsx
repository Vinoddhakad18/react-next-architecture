/**
 * EntityApprovalCompare
 * Side-by-side field comparison for approval review modal.
 */

import { buildApprovalDataRows } from '@/lib/approval/approvalDataDisplay';

export interface EntityApprovalCompareProps {
  previousData?: Record<string, unknown>;
  proposedData?: Record<string, unknown>;
  changedFields?: string[];
}

export function EntityApprovalCompare({
  previousData,
  proposedData,
  changedFields,
}: EntityApprovalCompareProps) {
  const rows = buildApprovalDataRows(previousData, proposedData, changedFields);

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No change details available.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-2.5 font-medium text-slate-600 w-[28%]">Field</th>
            <th className="px-4 py-2.5 font-medium text-slate-600 w-[36%]">Current</th>
            <th className="px-4 py-2.5 font-medium text-amber-800 w-[36%]">Requested</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={row.key}
              className={row.changed ? 'bg-amber-50/60' : 'bg-white'}
            >
              <td className="px-4 py-2.5 font-medium text-slate-700">{row.label}</td>
              <td className="px-4 py-2.5 text-slate-700">{row.current}</td>
              <td
                className={`px-4 py-2.5 ${
                  row.changed && row.requested !== '—'
                    ? 'font-medium text-amber-900'
                    : 'text-slate-600'
                }`}
              >
                {row.requested}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
