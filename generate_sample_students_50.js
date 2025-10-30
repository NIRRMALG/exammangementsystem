import XLSX from 'xlsx';

const paperCodes = ['PC101', 'PC102', 'PC103', 'PC104', 'PC105'];
const examNames = ['Math', 'Physics', 'Chemistry', 'Biology', 'English'];
const sessions = ['Morning', 'Afternoon', 'Evening'];
const dates = ['2025-10-20', '2025-10-21', '2025-10-22', '2025-10-23'];

const students = [];
for (let i = 1; i <= 50; i++) {
  const student_id = `S${i.toString().padStart(3, '0')}`;
  const name = `Student ${i}`;
  const paper_code = paperCodes[i % paperCodes.length];
  const exam_name = examNames[i % examNames.length];
  const exam_date = dates[i % dates.length];
  const session = sessions[i % sessions.length];
  students.push({ student_id, name, paper_code, exam_name, exam_date, session });
}

const ws = XLSX.utils.json_to_sheet(students);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Students');
XLSX.writeFile(wb, 'public/sample_students_50.xlsx');

console.log('Sample Excel file generated: public/sample_students_50.xlsx');