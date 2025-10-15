# EasyResult 实验数据展示

基于 Vue 3 + TypeScript + Ant Design Vue 的前端页面，支持：
- 从 GitHub raw 读取 CSV（表头：model,dataset,output_len,mse,mae）
- 表格筛选（model/dataset）
- 本地 CSV 上传并合并
- 每行标记最小值（红色加粗）与次小值（蓝色下划线）
- 导出 Excel（xlsx）
- 导出 LaTeX 三线表代码并在模态框中展示

## 使用

在项目根目录执行：

```powershell
npm i
npm run dev
```

然后在浏览器打开 http://localhost:5173

## 依赖

- Vue 3
- Ant Design Vue
- PapaParse
- SheetJS / xlsx

## GitHub 数据更新建议

出于安全考虑，前端不直接使用 PAT 发 PR。推荐流程：
1. 在网页中上传并合并 CSV。
2. 点击“下载合并后CSV”，得到 `results_merged.csv`。
3. 在本地替换仓库中的 CSV，提交并发起 Pull Request。