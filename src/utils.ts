import Papa from 'papaparse';
import type { ExperimentRow, NumericKey } from './types';

export function parseCsv(text: string): ExperimentRow[] {
  const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (errors?.length) {
    console.warn('CSV parse warnings:', errors);
  }
  return (data as any[]).map((r) => ({
    model: String(r.model ?? '').trim(),
    dataset: String(r.dataset ?? '').trim(),
    output_len: Number(r.output_len),
    mse: Number(r.mse),
    mae: Number(r.mae),
  })).filter((r) =>
    r.model && r.dataset &&
    Number.isFinite(r.output_len) &&
    Number.isFinite(r.mse) &&
    Number.isFinite(r.mae)
  );
}

export function toCsv(rows: ExperimentRow[]): string {
  const header = ['model', 'dataset', 'output_len', 'mse', 'mae'];
  const body = rows.map(r => [r.model, r.dataset, r.output_len, r.mse, r.mae].join(',')).join('\n');
  return `${header.join(',')}\n${body}`;
}

export function findRowMinSecond(row: ExperimentRow): { minKey: NumericKey; secondKey: NumericKey } {
  const entries: { key: NumericKey; val: number }[] = [
    { key: 'output_len', val: row.output_len },
    { key: 'mse', val: row.mse },
    { key: 'mae', val: row.mae },
  ];
  entries.sort((a, b) => a.val - b.val);
  return { minKey: entries[0].key, secondKey: entries[1].key };
}

export function latexTable(rows: ExperimentRow[]): string {
  const header = ['model', 'dataset', 'output_len', 'mse', 'mae'];
  const lines: string[] = [];
  lines.push('\\begin{table}[ht]');
  lines.push('\\centering');
  lines.push('\\begin{tabular}{l l r r r}');
  lines.push('\\toprule');
  lines.push(header.join(' & ') + ' \\\\');
  lines.push('\\midrule');
  for (const r of rows) {
    const { minKey, secondKey } = findRowMinSecond(r);
    const format = (key: NumericKey, val: number) => {
      const s = Number.isFinite(val) ? val.toString() : '';
      if (key === minKey) return `\\textbf{${s}}`;
      if (key === secondKey) return `\\underline{${s}}`;
      return s;
    };
    const rowStr = [
      r.model,
      r.dataset,
      format('output_len', r.output_len),
      format('mse', r.mse),
      format('mae', r.mae),
    ].join(' & ') + ' \\\\';
    lines.push(rowStr);
  }
  lines.push('\\bottomrule');
  lines.push('\\end{tabular}');
  lines.push('\\caption{实验结果表}');
  lines.push('\\label{tab:exp-results}');
  lines.push('\\end{table}');
  return lines.join('\\n');
}

/**
 * 透视数据生成：将行转为 dataset + output_len 为行，模型为列，列下分 MSE/MAE
 */
export function buildPivot(
  rows: ExperimentRow[]
): {
  models: string[];
  datasets: string[];
  outputLensByDataset: Record<string, number[]>;
  records: Array<Record<string, any>>;
} {
  const models = Array.from(new Set(rows.map(r => r.model))).sort();
  const datasets = Array.from(new Set(rows.map(r => r.dataset))).sort();

  // 收集每个 dataset 下的 output_len 列表（升序）
  const outputLensByDataset: Record<string, number[]> = {};
  for (const d of datasets) {
    outputLensByDataset[d] = Array.from(
      new Set(rows.filter(r => r.dataset === d).map(r => r.output_len))
    ).sort((a, b) => a - b);
  }

  // 便于快速查找
  const key = (d: string, ol: number | string, m: string) => `${d}||${ol}||${m}`;
  const map = new Map<string, ExperimentRow>();
  for (const r of rows) {
    map.set(key(r.dataset, r.output_len, r.model), r);
  }

  // 构造行记录：每个 dataset 的每个 output_len 一行，再追加 avg 行
  const records: Array<Record<string, any>> = [];
  for (const d of datasets) {
    for (const ol of outputLensByDataset[d]) {
      const rec: Record<string, any> = { dataset: d, output_len: ol };
      for (const m of models) {
        const row = map.get(key(d, ol, m));
        rec[`${m}__mse`] = row?.mse ?? '';
        rec[`${m}__mae`] = row?.mae ?? '';
      }
      records.push(rec);
    }
    // avg 行：按该 dataset 下所有 output_len 对每个模型求平均
    const avg: Record<string, any> = { dataset: d, output_len: 'avg' };
    for (const m of models) {
      const valsMse = rows.filter(r => r.dataset === d && r.model === m).map(r => r.mse);
      const valsMae = rows.filter(r => r.dataset === d && r.model === m).map(r => r.mae);
      const mean = (arr: number[]) => {
        const nums = arr.filter(v => Number.isFinite(v));
        if (!nums.length) return '';
        const s = nums.reduce((a, b) => a + b, 0) / nums.length;
        return Number(s.toFixed(3));
      };
      avg[`${m}__mse`] = mean(valsMse);
      avg[`${m}__mae`] = mean(valsMae);
    }
    records.push(avg);
  }

  return { models, datasets, outputLensByDataset, records };
}

/**
 * LaTeX 透视表生成：包含 multicolumn 模型组头、Metrics 子头、multirow 数据集、以及 avg 行
 * 可选 resizebox 适配列宽
 */
export function latexPivotTable(rows: ExperimentRow[], opts?: { caption?: string; label?: string; resizeToColumn?: boolean }): string {
  const { models, datasets, outputLensByDataset, records } = buildPivot(rows);
  const caption = opts?.caption ?? '';
  const label = opts?.label ?? 'tab:results-pivot';
  const useResize = !!opts?.resizeToColumn;

  // 构造表头行
  const headerModels = ['\\multicolumn{2}{c}{Models}'];
  for (const m of models) {
    headerModels.push(`\\multicolumn{2}{c}{${m}}`);
  }
  const headerMetrics = ['\\multicolumn{2}{c}{Metrics}'];
  for (let i = 0; i < models.length; i++) {
    headerMetrics.push('MSE', 'MAE');
  }

  const lines: string[] = [];
  lines.push('\\begin{table}[]');
  lines.push('\\centering');
  if (caption) lines.push(`\\caption{${caption}}`);
  lines.push(`\\label{${label}}`);
  if (useResize) lines.push('\\resizebox{\\columnwidth}{!}{%');

  // 列数 = 2(Models/Metrics 左侧占位) + models*2
  lines.push(`\\begin{tabular}{${'c'.repeat(2 + models.length * 2)}}`);
  lines.push('\\toprule');
  lines.push(headerModels.join(' & ') + ' \\\\');
  lines.push(headerMetrics.join(' & ') + ' \\\\');

  // 按 dataset 输出块，使用 multirow
  for (const d of datasets) {
    const lens = outputLensByDataset[d];
    const rowSpan = lens.length + 1; // +1 for avg
    let first = true;
    const formatVal = (v: any) => (v === '' || v === undefined ? '' : String(v));

    for (const ol of [...lens, 'avg']) {
      const rec = records.find(r => r.dataset === d && r.output_len === ol);
      const left = first ? `\\multirow{${rowSpan}}{*}{${d}} & ${ol}` : ` & ${ol}`;
      first = false;
      const cells: string[] = [];
      for (const m of models) {
        cells.push(formatVal(rec?.[`${m}__mse`]));
        cells.push(formatVal(rec?.[`${m}__mae`]));
      }
      lines.push(left + ' & ' + cells.join(' & ') + ' \\\\');
    }
  }

  lines.push('\\bottomrule');
  lines.push('\\end{tabular}');
  if (useResize) lines.push('}%');
  lines.push('\\end{table}');
  return lines.join('\\n');
}