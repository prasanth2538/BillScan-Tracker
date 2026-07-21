const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ExcelReporter {
  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.reportPath = path.join(__dirname, '..', 'reports', 'test-results.xlsx');
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    if (fs.existsSync(this.reportPath)) {
      try {
        await this.workbook.xlsx.readFile(this.reportPath);
        this.worksheet = this.workbook.getWorksheet('Test Results');
        if (!this.worksheet) {
          this.initializeWorksheet();
        } else {
          // Re-apply columns to ensure keys map correctly when adding rows
          this.applyColumns();
        }
      } catch (e) {
        // If file is corrupted or locked, start fresh
        this.workbook = new ExcelJS.Workbook();
        this.initializeWorksheet();
      }
    } else {
      this.initializeWorksheet();
    }
    
    this.initialized = true;
  }

  applyColumns() {
    this.worksheet.columns = [
      { header: 'Test Case ID', key: 'id', width: 15 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Test Name', key: 'name', width: 30 },
      { header: 'Platform', key: 'platform', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Start Time', key: 'startTime', width: 20 },
      { header: 'End Time', key: 'endTime', width: 20 },
      { header: 'Duration (ms)', key: 'duration', width: 15 },
      { header: 'Screenshot Path', key: 'screenshot', width: 40 },
      { header: 'Error Message', key: 'error', width: 50 },
    ];
  }

  initializeWorksheet() {
    this.worksheet = this.workbook.addWorksheet('Test Results');
    this.applyColumns();
    
    // Style the header row
    this.worksheet.getRow(1).font = { bold: true };
    this.worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  }

  async addRecord(record) {
    await this.init();
    
    const row = this.worksheet.addRow(record);
    
    // Color code the status
    const statusCell = row.getCell('status');
    if (record.status === 'Passed') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } }; // Light green
    } else if (record.status === 'Failed') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFB6C1' } }; // Light red
    }
    
    await this.workbook.xlsx.writeFile(this.reportPath);
  }
}

module.exports = new ExcelReporter();
