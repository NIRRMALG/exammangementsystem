const XLSX = require('xlsx');
const fs = require('fs');

const papers = [
  { code: 'PAPER1', name: 'Mathematics' },
  { code: 'PAPER2', name: 'Physics' },
  { code: 'PAPER3', name: 'Chemistry' },
  { code: 'PAPER4', name: 'Biology' },
  { code: 'PAPER5', name: 'English' },
  { code: 'PAPER6', name: 'History' },
  { code: 'PAPER7', name: 'Geography' },
  { code: 'PAPER8', name: 'Computer Science' },
  { code: 'PAPER9', name: 'Economics' },
  { code: 'PAPER10', name: 'Political Science' },
];

const students = [];
const exam_date = '2025-11-01';
const session = 'Morning';
for (let i = 1; i <= 150; i++) {
  const paper = papers[(i - 1) % papers.length];
  students.push({
    student_id: `S${i.toString().padStart(3, '0')}`,
    name: `Student ${i}`,
    paper_code: paper.code,
    exam_name: paper.name,
    exam_date,
    session,
  });
}

const ws = XLSX.utils.json_to_sheet(students);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'students');
XLSX.writeFile(wb, './public/sample_students_150.xlsx');
console.log('Excel file generated: public/sample_students_150.xlsx');
