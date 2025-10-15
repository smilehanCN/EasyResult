export interface ExperimentRow {
  model: string;
  dataset: string;
  output_len: number;
  mse: number;
  mae: number;
}

export type NumericKey = 'output_len' | 'mse' | 'mae';
export const numericKeys: NumericKey[] = ['output_len', 'mse', 'mae'];