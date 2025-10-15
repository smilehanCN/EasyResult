import type { ExperimentRow } from './types';
import { buildPivot } from './utils';

/**
 * LaTeX 透视表生成：包含 multicolumn 模型组头、Metrics 子头、multirow 数据集、以及 avg 行
 * 支持最佳和次佳结果标记，使用全局命令定义
 */
export function latexPivotTableWithFormatting(
  rows: ExperimentRow[], 
  opts?: { 
    caption?: string; 
    label?: string; 
    resizeToColumn?: boolean;
    modelOrder?: string[];
    datasetOrder?: string[];
  }
): string {
  const { models: allModels, datasets: allDatasets, outputLensByDataset, records } = buildPivot(rows);
  
  // 使用传入的顺序，如果没有则使用默认顺序
  const models = opts?.modelOrder?.filter(m => allModels.includes(m)) || allModels;
  const datasets = opts?.datasetOrder?.filter(d => allDatasets.includes(d)) || allDatasets;
  const caption = opts?.caption ?? '';
  const label = opts?.label ?? 'tab:results-pivot';
  const useResize = !!opts?.resizeToColumn;

  // 辅助函数：判断某行中最佳和次佳值
  const findBestAndSecond = (rowValues: (number | string)[]): { bestIndices: number[]; secondIndices: number[] } => {
    const nums = rowValues
      .map((v, idx) => ({ value: typeof v === 'number' ? v : Number(v), index: idx }))
      .filter(item => Number.isFinite(item.value));
    
    if (nums.length === 0) return { bestIndices: [], secondIndices: [] };
    
    const sorted = [...nums].sort((a, b) => a.value - b.value);
    const minVal = sorted[0].value;
    const secondVal = sorted.length > 1 ? sorted[1].value : minVal;
    
    const bestIndices = nums.filter(item => item.value === minVal).map(item => item.index);
    const secondIndices = nums.filter(item => item.value === secondVal && item.value !== minVal).map(item => item.index);
    
    return { bestIndices, secondIndices };
  };

  // 格式化数值，应用最佳/次佳标记
  const formatVal = (v: any, isBest: boolean = false, isSecond: boolean = false): string => {
    if (v === '' || v === undefined) return '';
    const numStr = typeof v === 'number' ? v.toFixed(3) : String(v);
    
    if (isBest) return `\\bestresult{${numStr}}`;
    if (isSecond) return `\\secondresult{${numStr}}`;
    return numStr;
  };

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
  
  // 添加全局命令定义
  lines.push('% LaTeX命令定义');
  lines.push('\\newcommand{\\bestresult}[1]{{\\textbf{\\textcolor{red}{#1}}}}');
  lines.push('\\newcommand{\\secondresult}[1]{{\\underline{\\textcolor{blue}{#1}}}}');
  lines.push('');
  
  lines.push('\\begin{table}[]');
  lines.push('\\centering');
  if (caption) lines.push(`\\caption{${caption}}`);
  lines.push(`\\label{${label}}`);
  if (useResize) lines.push('\\resizebox{\\columnwidth}{!}{%');

  // 列数 = 2(Models/Metrics 左侧占位) + models*2，模型之间添加分割线
  const colSpec = 'cc' + ('|cc').repeat(models.length);
  lines.push(`\\begin{tabular}{${colSpec}}`);
  lines.push('\\toprule');
  lines.push(headerModels.join(' & ') + ' \\\\');
  lines.push(headerMetrics.join(' & ') + ' \\\\');

  // 按 dataset 输出块，使用 multirow，在数据集之间添加分割线
  for (let datasetIdx = 0; datasetIdx < datasets.length; datasetIdx++) {
    if (datasetIdx > 0) {
      lines.push('\\midrule'); // 在数据集之间添加分割线
    }
    
    const d = datasets[datasetIdx];
    const lens = outputLensByDataset[d];
    const rowSpan = lens.length + 1; // +1 for avg
    let first = true;

    for (const ol of [...lens, 'avg']) {
      const rec = records.find(r => r.dataset === d && r.output_len === ol);
      const left = first ? `\\multirow{${rowSpan}}{*}{${d}} & ${ol}` : ` & ${ol}`;
      first = false;
      
      // 收集当前行的所有数值用于比较
      const rowValues: (number | string)[] = [];
      for (const m of models) {
        rowValues.push(rec?.[`${m}__mse`] ?? '');
        rowValues.push(rec?.[`${m}__mae`] ?? '');
      }
      
      // 找出最佳和次佳值的位置
      const { bestIndices, secondIndices } = findBestAndSecond(rowValues);
      
      // 格式化单元格
      const cells: string[] = [];
      for (let i = 0; i < rowValues.length; i++) {
        const value = rowValues[i];
        const isBest = bestIndices.includes(i);
        const isSecond = secondIndices.includes(i);
        cells.push(formatVal(value, isBest, isSecond));
      }
      
      lines.push(left + ' & ' + cells.join(' & ') + ' \\\\');
    }
  }

  lines.push('\\bottomrule');
  lines.push('\\end{tabular}');
  if (useResize) lines.push('}%');
  lines.push('\\end{table}');
  return lines.join('\n');
}