<template>
  <div class="experiment-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">实验数据可视化系统</h1>
      <p class="page-subtitle">支持数据导入、筛选分析和多格式导出</p>
      <a href="https://github.com/smilehanCN/EasyResult" target="_blank" class="github-link">
        <span>📁</span> GitHub项目主页
      </a>
    </div>

    <a-space direction="vertical" style="width:100%;" size="large">
      <!-- 数据操作区域 -->
      <a-card title="数据操作" class="action-card">
        <a-space wrap size="middle">
          <a-input 
            v-model:value="csvUrl" 
            placeholder="输入 GitHub raw CSV URL" 
            class="url-input"
            prefix="🔗"
          />
          <a-button type="primary" @click="loadCsv" class="primary-btn">
            <template #icon><span>📥</span></template>
            读取CSV
          </a-button>
          <a-upload :beforeUpload="handleUpload" :showUploadList="false" accept=".csv">
            <a-button class="upload-btn">
              <template #icon><span>📁</span></template>
              上传并合并CSV
            </a-button>
          </a-upload>
          <a-button @click="downloadMergedCsv" class="download-btn">
            <template #icon><span>💾</span></template>
            下载合并后CSV
          </a-button>
          <a-button @click="exportExcel" class="export-btn">
            <template #icon><span>📊</span></template>
            导出Excel
          </a-button>
          <a-button @click="openLatexPivotModal" class="export-btn">
            <template #icon><span>📝</span></template>
            导出LaTeX
          </a-button>
        </a-space>
      </a-card>

      <!-- 筛选控制区域 -->
      <a-card title="数据筛选" class="filter-card">
        <a-space wrap size="middle">
          <div class="filter-group">
            <label class="filter-label">模型筛选</label>
            <a-select 
              v-model:value="modelFilters" 
              mode="multiple" 
              placeholder="选择模型" 
              allowClear 
              class="filter-select"
              :maxTagCount="2"
            >
              <a-select-option v-for="m in modelOptions" :key="m" :value="m">{{ m }}</a-select-option>
            </a-select>
          </div>
          <div class="filter-group">
            <label class="filter-label">数据集筛选</label>
            <a-select 
              v-model:value="datasetFilters" 
              mode="multiple" 
              placeholder="选择数据集" 
              allowClear 
              class="filter-select"
              :maxTagCount="2"
            >
              <a-select-option v-for="d in datasetOptions" :key="d" :value="d">{{ d }}</a-select-option>
            </a-select>
          </div>
          <a-button @click="clearFilters" class="clear-btn">
            <template #icon><span>🗑️</span></template>
            清空筛选
          </a-button>
        </a-space>
      </a-card>

      <!-- 透视可视化区域 -->
      <a-card class="visualization-card">
        <template #title>
          <div class="card-title">
            <span class="title-icon">📊</span>
            透视可视化
          </div>
        </template>
        <div class="table-container">
          <table class="metrics-table">
            <thead>
              <tr>
                <th colspan="2">Models</th>
                <draggable 
                  v-model="modelOrder" 
                  tag="tr"
                  item-key="id"
                  @end="onModelOrderChange"
                  class="model-drag-row"
                  style="display: contents;"
                >
                  <template #item="{ element }">
                    <th colspan="2" class="draggable-model-header">
                      <span class="drag-handle">⋮⋮</span>
                      {{ element }}
                    </th>
                  </template>
                </draggable>
              </tr>
              <tr>
                <th colspan="2">Metrics</th>
                <template v-for="m in orderedModels" :key="m">
                  <th>MSE</th>
                  <th>MAE</th>
                </template>
              </tr>
            </thead>
            <tbody>
              <template v-for="(dataset, datasetIndex) in orderedDatasets" :key="dataset">
                <template v-for="(row, index) in getDatasetRows(dataset)" :key="`${row.dataset}-${row.horizon}-${index}`">
                  <tr :class="{ 'dataset-first-row': index === 0 }">
                    <td 
                      v-if="index === 0" 
                      :rowspan="getDatasetRows(dataset).length"
                      class="dataset-cell"
                    >
                      {{ dataset }}
                    </td>
                    <td :class="{ 'dataset-first-row-cell': index === 0 && datasetIndex > 0 }">{{ row.horizon }}</td>
                    <td
                      v-for="(value, valueIndex) in getOrderedRowValues(row)"
                      :key="valueIndex"
                      :class="[
                        cellClass(getOrderedRowValues(row), valueIndex, value),
                        { 'dataset-first-row-cell': index === 0 && datasetIndex > 0 }
                      ]"
                    >
                      {{ formatPivot(value) }}
                    </td>
                  </tr>
                </template>
              </template>
            </tbody>
          </table>
        </div>
      </a-card>

      <!-- 原始数据展示区域 -->
      <a-card class="data-card">
        <template #title>
          <div class="card-title">
            <span class="title-icon">📋</span>
            原始数据展示
          </div>
        </template>
        <a-table
          :dataSource="filteredRows"
          :columns="columns"
          :rowKey="rowKey"
          :pagination="{ 
            pageSize: 10, 
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`
          }"
          class="data-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="isNumericColumn(column.dataIndex)">
              {{ formatNumber(record[column.dataIndex], column.dataIndex) }}
            </template>
            <template v-else>
              <span class="text-cell">{{ record[column.dataIndex] }}</span>
            </template>
          </template>
        </a-table>
      </a-card>
    </a-space>

    <!-- LaTeX 模态框 -->
    <a-modal v-model:open="latexOpen" title="LaTeX 表格代码" :width="800" :footer="null" class="latex-modal">
      <a-typography-paragraph>
        <a-typography-text code>
          <pre class="latex-code">{{ latexCode }}</pre>
        </a-typography-text>
      </a-typography-paragraph>
      <a-space>
        <a-button type="primary" @click="copyLatex">复制到剪贴板</a-button>
        <a-button @click="latexOpen=false">关闭</a-button>
      </a-space>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import type { ExperimentRow, NumericKey } from '../types';
import { parseCsv, toCsv, findRowMinSecond, latexTable, buildPivot } from '../utils';
import { latexPivotTableWithFormatting } from '../latexUtils';
import * as XLSX from 'xlsx';
import draggable from 'vuedraggable';

const csvUrl = ref<string>('');
const allRows = ref<ExperimentRow[]>([]);
const modelFilters = ref<string[]>([]);
const datasetFilters = ref<string[]>([]);
const latexOpen = ref<boolean>(false);
const latexCode = ref<string>('');
const datasetOrder = ref<string[]>([]);
const modelOrder = ref<string[]>([]);

const columns = [
  { title: 'model', dataIndex: 'model' },
  { title: 'dataset', dataIndex: 'dataset' },
  { title: 'output_len', dataIndex: 'output_len' },
  { title: 'mse', dataIndex: 'mse' },
  { title: 'mae', dataIndex: 'mae' },
];

const rowKey = (r: ExperimentRow) => `${r.model}__${r.dataset}__${r.output_len}__${r.mse}__${r.mae}`;

const modelOptions = computed(() => Array.from(new Set(allRows.value.map(r => r.model))).sort());
const datasetOptions = computed(() => Array.from(new Set(allRows.value.map(r => r.dataset))).sort());

const filteredRows = computed<ExperimentRow[]>(() => {
  return allRows.value.filter(r =>
    (modelFilters.value.length === 0 || modelFilters.value.includes(r.model)) &&
    (datasetFilters.value.length === 0 || datasetFilters.value.includes(r.dataset))
  );
});

function clearFilters() {
  modelFilters.value = [];
  datasetFilters.value = [];
}

function isNumericColumn(key: string): key is NumericKey {
  return key === 'output_len' || key === 'mse' || key === 'mae';
}

function formatNumber(n: number, key?: NumericKey): string {
  if (!Number.isFinite(n)) return '';
  if (key === 'mse' || key === 'mae') return Number(n).toFixed(3);
  return Number.isInteger(n) ? String(n) : Number(n).toString();
}

async function loadCsv() {
  if (!csvUrl.value) {
    message.warning('请填写 GitHub raw CSV URL');
    return;
  }
  try {
    const resp = await fetch(csvUrl.value, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`请求失败：${resp.status}`);
    const text = await resp.text();
    const rows = parseCsv(text);
    allRows.value = rows;
    message.success(`读取成功，共 ${rows.length} 行`);
  } catch (e: any) {
    console.error(e);
    message.error(`读取失败：${e?.message || String(e)}`);
  }
}

function mergeRows(existing: ExperimentRow[], incoming: ExperimentRow[]): ExperimentRow[] {
  const map = new Map<string, ExperimentRow>();
  for (const r of existing) {
    map.set(`${r.model}||${r.dataset}||${r.output_len}`, r);
  }
  for (const r of incoming) {
    map.set(`${r.model}||${r.dataset}||${r.output_len}`, r);
  }
  return Array.from(map.values());
}

function handleUpload(file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || '');
      const rows = parseCsv(text);
      allRows.value = mergeRows(allRows.value, rows);
      message.success(`上传并合并成功，新总行数：${allRows.value.length}`);
    } catch (e: any) {
      message.error(`解析失败：${e?.message || String(e)}`);
    }
  };
  reader.readAsText(file);
  return false;
}

function downloadMergedCsv() {
  const csv = toCsv(allRows.value);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'results_merged.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel() {
  const excelData: any[] = [];
  const header1 = ['Models', '', ...orderedModels.value.flatMap(m => [m, ''])];
  const header2 = ['Metrics', '', ...orderedModels.value.flatMap(() => ['MSE', 'MAE'])];
  excelData.push(header1, header2);
  
  for (const row of orderedTableData.value) {
    const excelRow = [row.dataset, row.horizon];
    const rowValues = getOrderedRowValues(row);
    
    for (let i = 0; i < rowValues.length; i++) {
      const value = rowValues[i];
      const formattedValue = formatPivot(value);
      excelRow.push(formattedValue);
    }
    excelData.push(excelRow);
  }
  
  const ws = XLSX.utils.aoa_to_sheet(excelData);
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  
  for (let rowIdx = 2; rowIdx < excelData.length; rowIdx++) {
    const row = orderedTableData.value[rowIdx - 2];
    const rowValues = getOrderedRowValues(row);
    
    for (let colIdx = 0; colIdx < rowValues.length; colIdx++) {
      const value = rowValues[colIdx];
      const cellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx + 2 });
      
      if (!ws[cellAddress]) continue;
      
      if (isBestValue(rowValues, colIdx, value)) {
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: "D4380D" } }
        };
      } else if (isSecondBest(rowValues, colIdx, value)) {
        ws[cellAddress].s = {
          font: { color: { rgb: "0958D9" }, underline: true }
        };
      }
    }
  }
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'results');
  XLSX.writeFile(wb, 'results.xlsx');
}

function openLatexPivotModal() {
  latexCode.value = latexPivotTableWithFormatting(filteredRows.value, { 
    caption: '', 
    label: 'tab:results-pivot', 
    resizeToColumn: true,
    modelOrder: orderedModels.value,
    datasetOrder: orderedDatasets.value
  });
  latexOpen.value = true;
}

async function copyLatex() {
  try {
    await navigator.clipboard.writeText(latexCode.value);
    message.success('已复制到剪贴板');
  } catch {
    message.warning('复制失败，请手动选择拷贝');
  }
}

const pivotModels = computed(() => buildPivot(filteredRows.value).models);
const pivotRecords = computed(() => buildPivot(filteredRows.value).records);
const pivotOutputLensByDataset = computed(() => buildPivot(filteredRows.value).outputLensByDataset);

const models = computed(() => {
  const allModels = pivotModels.value;
  if (modelFilters.value.length > 0) {
    return modelFilters.value.filter(m => allModels.includes(m));
  }
  return allModels;
});

const tableData = computed(() => {
  const rows: Array<{ dataset: string; horizon: number | string; values: Array<number | string> }> = [];
  const byDataset: Record<string, Array<{ horizon: number | string; values: Array<number | string> }>> = {};

  const datasetsToShow = datasetFilters.value.length > 0 
    ? datasetFilters.value 
    : Array.from(new Set(pivotRecords.value.map(r => r.dataset as string)));

  for (const rec of pivotRecords.value) {
    const d = rec.dataset as string;
    if (!datasetsToShow.includes(d)) continue;
    
    const ol = rec.output_len as number | string;
    const values: Array<number | string> = [];
    
    for (const m of models.value) {
      const mseValue = rec[`${m}__mse`];
      const maeValue = rec[`${m}__mae`];
      values.push(mseValue !== undefined && mseValue !== null && mseValue !== '' ? mseValue : 'Null');
      values.push(maeValue !== undefined && maeValue !== null && maeValue !== '' ? maeValue : 'Null');
    }
    
    if (!byDataset[d]) byDataset[d] = [];
    byDataset[d].push({ horizon: ol, values });
  }

  for (const d of datasetsToShow) {
    if (!byDataset[d]) continue;
    
    const lens = pivotOutputLensByDataset.value[d] ?? [];
    const ordered: Array<{ horizon: number | string; values: Array<number | string> }> = [];
    
    for (const ol of lens) {
      const r = byDataset[d].find(it => it.horizon === ol);
      if (r) ordered.push(r);
    }
    const avg = byDataset[d].find(it => it.horizon === 'avg');
    if (avg) ordered.push(avg);
    
    for (const r of ordered) {
      rows.push({ dataset: d, horizon: r.horizon, values: r.values });
    }
  }

  return rows;
});

function isBestValue(rowValues: Array<number | string>, valueIndex: number, value: number | string): boolean {
  if (value === 'Null' || value === '') return false;
  
  const nums = rowValues
    .filter(v => v !== 'Null' && v !== '')
    .map(v => (typeof v === 'number' ? v : Number(v)))
    .filter(v => Number.isFinite(v));
  if (!nums.length) return false;
  const minVal = Math.min(...nums);
  const current = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(current) && current === minVal;
}

function isSecondBest(rowValues: Array<number | string>, valueIndex: number, value: number | string): boolean {
  if (value === 'Null' || value === '') return false;
  
  const nums = rowValues
    .filter(v => v !== 'Null' && v !== '')
    .map(v => (typeof v === 'number' ? v : Number(v)))
    .filter(v => Number.isFinite(v));
  if (nums.length < 2) return false;
  const sorted = [...nums].sort((a, b) => a - b);
  const second = sorted[1];
  const current = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(current) && current === second;
}

function cellClass(rowValues: Array<number | string>, valueIndex: number, value: number | string): string {
  if (isBestValue(rowValues, valueIndex, value)) return 'best';
  if (isSecondBest(rowValues, valueIndex, value)) return 'second';
  return '';
}

function formatPivot(value: number | string): string {
  if (value === '' || value === 'Null') return 'Null';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(num)) return num.toFixed(3);
  return String(value);
}

const orderedModels = computed(() => {
  if (modelOrder.value.length === 0) {
    return models.value;
  }
  return modelOrder.value.filter(m => models.value.includes(m));
});

const orderedDatasets = computed(() => {
  if (datasetOrder.value.length === 0) {
    return Array.from(new Set(tableData.value.map(r => r.dataset)));
  }
  const allDatasets = Array.from(new Set(tableData.value.map(r => r.dataset)));
  return datasetOrder.value.filter(d => allDatasets.includes(d));
});

const orderedTableData = computed(() => {
  const ordered: Array<{ dataset: string; horizon: number | string; values: Array<number | string> }> = [];
  
  for (const dataset of orderedDatasets.value) {
    const datasetRows = tableData.value.filter(r => r.dataset === dataset);
    for (const row of datasetRows) {
      ordered.push(row);
    }
  }
  
  return ordered;
});

function getOrderedRowValues(row: { dataset: string; horizon: number | string; values: Array<number | string> }) {
  const orderedValues: Array<number | string> = [];
  
  for (const model of orderedModels.value) {
    const modelIndex = models.value.indexOf(model);
    if (modelIndex !== -1) {
      orderedValues.push(row.values[modelIndex * 2] ?? '');
      orderedValues.push(row.values[modelIndex * 2 + 1] ?? '');
    }
  }
  
  return orderedValues;
}

function getDatasetRows(dataset: string) {
  return tableData.value.filter(r => r.dataset === dataset);
}

function onModelOrderChange() {
  console.log('Model order changed:', modelOrder.value);
}

onMounted(() => {
  csvUrl.value = 'results_sample.csv';
  loadCsv();
});

watch([models, tableData], () => {
  if (datasetOrder.value.length === 0) {
    datasetOrder.value = Array.from(new Set(tableData.value.map(r => r.dataset)));
  }
  const currentModels = models.value;
  const newOrder = modelOrder.value.filter(m => currentModels.includes(m));
  const missingModels = currentModels.filter(m => !newOrder.includes(m));
  modelOrder.value = [...newOrder, ...missingModels];
}, { immediate: true });
</script>

<style scoped>
@import './ExperimentTable.vue.css';
</style>