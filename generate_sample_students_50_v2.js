import XLSX from 'xlsx';

const sessions = ['FN', 'AN'];
const exams = [
  { paper_code: 'MML', exam_name: 'Mathematics for ML' },
  { paper_code: 'MDS', exam_name: 'Mathematics for DS' },
  { paper_code: 'PHY', exam_name: 'Physics' },
  { paper_code: 'CHE', exam_name: 'Chemistry' }
];
const dates = ['2025-10-20', '2025-10-21'];

const students = [];
for (let i = 1; i <= 50; i++) {
  const student_id = `S${i.toString().padStart(3, '0')}`;
  const name = `Student ${i}`;
  // Alternate between the two similar exams for first 30 students, then others
  let examIdx = i % 4;
  if (i <= 25) examIdx = 0; // First 25: Mathematics for ML
  else if (i <= 40) examIdx = 1; // Next 15: Mathematics for DS
  const { paper_code, exam_name } = exams[examIdx];
  const exam_date = dates[i % dates.length];
  const session = sessions[i % sessions.length];
  students.push({ student_id, name, paper_code, exam_name, exam_date, session });
}

const ws = XLSX.utils.json_to_sheet(students);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Students');
XLSX.writeFile(wb, 'public/sample_students_50.xlsx');

console.log('Sample Excel file generated: public/sample_students_50.xlsx');
