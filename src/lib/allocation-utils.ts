import { supabase } from './supabase';

export type ExamWithStudents = {
  id: string;
  paper_title: string;
  paper_code: string;
  exam_date: string;
  session: string;
  students: any[];
};

export type Classroom = {
  id: string;
  name: string;
  capacity: number;
  rows: number;
  columns: number;
};

export type SeatingPlan = {
  classroom: Classroom;
  studentPlacements: {
    studentId: string;
    row: number;
    column: number;
    examId: string;
  }[];
  invigilatorsNeeded: number;
};

export const calculateResourceRequirements = async (
  exams: ExamWithStudents[],
  classrooms: Classroom[]
) => {
  const totalStudents = exams.reduce((sum, exam) => sum + exam.students.length, 0);
  const totalCapacity = classrooms.reduce((sum, room) => sum + room.capacity, 0);

  if (totalStudents > totalCapacity) {
    throw new Error('Insufficient classroom capacity for all students');
  }

  // Sort classrooms by capacity (descending)
  const sortedClassrooms = [...classrooms].sort((a, b) => b.capacity - a.capacity);

  // Initialize allocation plan
  const seatingPlans: SeatingPlan[] = [];
  let remainingStudents = [...exams.flatMap(exam => 
    exam.students.map(student => ({
      studentId: student.id,
      examId: exam.id
    }))
  )];

  // Allocate classrooms optimally
  for (const classroom of sortedClassrooms) {
    if (remainingStudents.length === 0) break;

    const currentClassroomPlan: SeatingPlan = {
      classroom,
      studentPlacements: [],
      invigilatorsNeeded: Math.ceil((classroom.rows * classroom.columns) / 30) // 1 invigilator per 30 students
    };

    // Fill classroom with students
    let row = 0;
    let col = 0;
    
    while (row < classroom.rows && remainingStudents.length > 0) {
      if (col >= classroom.columns) {
        col = 0;
        row += 1;
      }

      // Skip every other seat for social distancing
      if (col % 2 === 0 && row % 2 === 0) {
        const student = remainingStudents.shift();
        if (student) {
          currentClassroomPlan.studentPlacements.push({
            ...student,
            row,
            column: col
          });
        }
      }
      
      col += 1;
    }

    if (currentClassroomPlan.studentPlacements.length > 0) {
      seatingPlans.push(currentClassroomPlan);
    }
  }

  // Calculate total resources needed
  const totalInvigilatorsNeeded = seatingPlans.reduce(
    (sum, plan) => sum + plan.invigilatorsNeeded,
    0
  );

  const classroomsUsed = seatingPlans.length;

  return {
    seatingPlans,
    totalInvigilatorsNeeded,
    classroomsUsed,
    success: remainingStudents.length === 0
  };
};

export const sendResourceAlert = async (requirements: {
  totalInvigilatorsNeeded: number;
  classroomsUsed: number;
  examDate: string;
  session: string;
  adminEmail: string;
}) => {
  if (!requirements.adminEmail) return;

  await supabase.functions.invoke('send-resource-alert', {
    body: {
      to: requirements.adminEmail,
      subject: `Resource Requirements for ${requirements.examDate} - ${requirements.session} Session`,
      message: `
        Resource requirements for upcoming exams:
        
        Date: ${requirements.examDate}
        Session: ${requirements.session}
        
        Required Resources:
        - Invigilators needed: ${requirements.totalInvigilatorsNeeded}
        - Classrooms to be used: ${requirements.classroomsUsed}
        
        Please ensure all resources are available.
      `
    }
  });
};