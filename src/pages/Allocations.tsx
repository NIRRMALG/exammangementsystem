// Imports already present above, remove duplicates


type Student = {
  id: string;
  student_id: string;
  name: string;
  paper_code?: string;
  exam_name?: string;
  exam_date?: string;
  session?: string;
};

type SeatingPlan = {
  classroom: Classroom;
  seats: (Student | null)[][];
  invigilator: any;
};


import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileDown, Mail } from "lucide-react";
import jsPDF from "jspdf";
import { calculateResourceRequirements, sendResourceAlert } from "@/lib/allocation-utils";

type Exam = {
  id: string;
  paper_title: string;
  paper_code: string;
  exam_date: string;
  session: string; // Morning/Afternoon/Evening
  total_students: number;
};

type Classroom = {
  id: string;
  name: string;
  capacity: number;
  rows: number;
  benches_per_row: number;
  seats_per_bench: number;
};


function Allocations() {
  type Exam = {
    id: string;
    paper_title: string;
    paper_code: string;
    exam_date: string;
    session: string; // Morning/Afternoon/Evening
    total_students: number;
  };
  // All hooks, logic, and JSX from the file go here
  // All hooks, logic, and JSX from the file go here
  // ...


  // PDF for absentees grouped by paper
  const generateAbsenteePDF = () => {
    if (!selectedDate || absentees.length === 0) return;
    const doc = new jsPDF();
    let yPos = 20;
    doc.setFontSize(16);
    doc.text("Absentees Report", 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(selectedDate).toLocaleDateString()}`, 20, yPos);
    yPos += 10;
    // Group absentees by paper
    const absenteesByPaper: { [paperCode: string]: Student[] } = {};
    seatingPlan.forEach(({ exam, plan }) => {
      plan.forEach(classroomPlan => {
        classroomPlan.seats.flat().forEach(student => {
          if (student && absentees.includes(student.student_id)) {
            if (!absenteesByPaper[exam.paper_code]) absenteesByPaper[exam.paper_code] = [];
            absenteesByPaper[exam.paper_code].push(student);
          }
        });
      });
    });
    Object.entries(absenteesByPaper).forEach(([paperCode, students]) => {
      doc.setFontSize(12);
      doc.text(`Paper: ${paperCode}`, 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      students.forEach((student, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${idx + 1}. ${student.student_id} - ${student.name}`, 25, yPos);
        yPos += 5;
      });
      yPos += 10;
    });
    doc.save(`absentees-${new Date(selectedDate).toISOString().split('T')[0]}.pdf`);
    toast({ title: "Absentee PDF", description: "Absentees PDF generated." });
  };
  const [examsForDate, setExamsForDate] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [seatingPlan, setSeatingPlan] = useState<{ exam: Exam; plan: SeatingPlan[] }[]>([]);
  const [absentees, setAbsentees] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchExamDates();
  }, []);

  const [examDates, setExamDates] = useState<string[]>([]);
  const fetchExamDates = async () => {
    const { data, error } = await supabase.from("exams").select("exam_date").order("exam_date", { ascending: true });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      const uniqueDates = [...new Set(data.map(e => e.exam_date))];
      setExamDates(uniqueDates);
    }
  };

  const [selectedDate, setSelectedDate] = useState<string>("");
  const generateAllocation = async () => {
    if (!selectedDate) {
      toast({ title: "Error", description: "Please select an exam date", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Fetch students for selected exam date
      const { data: students, error } = await supabase
        .from("students")
        .select("student_id, paper_code, exam_name, exam_date, session")
        .eq("exam_date", selectedDate);
      if (error) {
        toast({ title: "Error", description: `Error fetching students: ${error.message}`, variant: "destructive" });
        setLoading(false);
        return;
      }
      if (!students || students.length === 0) {
        toast({ title: "Success", description: "No students found for selected date. Seating allocation not generated.", variant: "destructive" });
        setSeatingPlan([]);
        setLoading(false);
        return;
      }

      // Fetch classrooms
      const { data: classrooms, error: classroomError } = await supabase
        .from("classrooms")
        .select("id, name, capacity, rows, benches_per_row, seats_per_bench")
        .order("name", { ascending: true });
      if (classroomError || !classrooms || classrooms.length === 0) {
        toast({ title: "Error", description: "No classrooms found.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Smart allocation logic
      // Helper: Check if placing student at (r, b, s) is valid
      function isValid(seats, r, b, s, student, relatedPapers) {
        const directions = [
          [0, 1, 0], [0, -1, 0], // benches left/right
          [1, 0, 0], [-1, 0, 0], // rows up/down
          [0, 0, 1], [0, 0, -1], // seat in bench left/right
          [1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0], // diagonals
        ];
        for (const [dr, db, ds] of directions) {
          const nr = r + dr, nb = b + db, ns = s + ds;
          if (
            nr >= 0 && nr < seats.length &&
            nb >= 0 && nb < seats[nr].length &&
            ns >= 0 && ns < seats[nr][nb].length
          ) {
            const neighbor = seats[nr][nb][ns];
            if (neighbor && (neighbor.paper_code === student.paper_code || relatedPapers.has(neighbor.paper_code))) {
              return false;
            }
          }
        }
        return true;
      }

      // Build related papers set (for demo, treat all papers with same prefix as related)
      function getRelatedPapers(paperCode) {
        const prefix = paperCode.split(/\d+/)[0];
        return new Set(students.filter(s => s.paper_code.startsWith(prefix)).map(s => s.paper_code));
      }

      // Allocate students to classrooms
      let studentIdx = 0;
      const seatingPlanArr = [];
      let unseatedStudents = [];
      for (const classroom of classrooms) {
        // Generate 3D seats array: columns x benches_per_row x seats_per_bench, with gaps between benches and columns
        const seats = Array.from({ length: classroom.rows * 2 - 1 }, (_, rIdx) =>
          Array.from({ length: classroom.benches_per_row * 2 - 1 }, (_, bIdx) =>
            (rIdx % 2 === 0 && bIdx % 2 === 0)
              ? Array.from({ length: classroom.seats_per_bench * 2 - 1 }, (_, sIdx) =>
                  (sIdx % 2 === 0 ? null : null)) // gap between seats
              : Array.from({ length: classroom.seats_per_bench * 2 - 1 }, () => null) // gap row/bench/seat
          )
        );
        for (let r = 0; r < classroom.rows; r++) {
          for (let b = 0; b < classroom.benches_per_row; b++) {
            for (let s = 0; s < classroom.seats_per_bench; s++) {
              let found = false;
              for (let i = studentIdx; i < students.length; i++) {
                const student = students[i];
                const relatedPapers = getRelatedPapers(student.paper_code);
                if (isValid(seats, r, b, s, student, relatedPapers)) {
                  seats[r][b][s] = student;
                  // Swap allocated student to current index
                  [students[studentIdx], students[i]] = [students[i], students[studentIdx]];
                  studentIdx++;
                  found = true;
                  break;
                }
              }
              if (!found && studentIdx < students.length) {
                // No valid student for this seat due to adjacency rule
                continue;
              }
            }
          }
        }
        seatingPlanArr.push({ classroom, seats, invigilator: null });
        if (studentIdx >= students.length) break;
      }
      if (studentIdx < students.length) {
        unseatedStudents = students.slice(studentIdx);
        toast({ title: "Warning", description: `Only ${studentIdx} students allocated. ${students.length - studentIdx} could not be seated due to capacity or adjacency rules. Please add at least ${students.length - studentIdx} more seats or classrooms to seat all students.`, variant: "destructive" });
      }
      setSeatingPlan([{ exam: { paper_title: "All Papers", paper_code: "ALL", exam_date: selectedDate, session: "", id: "", total_students: students.length }, plan: seatingPlanArr }]);
      toast({ title: "Success", description: `Seating allocation generated for ${studentIdx} student(s)` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const generatePDF = () => {
    if (seatingPlan.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Seating Plan & Invigilator Report", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(selectedDate).toLocaleDateString()}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Generate PDF for each exam
    seatingPlan.forEach(({ exam, plan }) => {
      // Exam Details
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Exam: ${exam.paper_title} (${exam.paper_code})`, 20, yPos);
      yPos += 10;

      // Seating plans for each classroom
      plan.forEach((classroomPlan) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Classroom header
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${classroomPlan.classroom.name}`, 20, yPos);
        yPos += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Capacity: ${classroomPlan.classroom.capacity} | Layout: ${classroomPlan.classroom.rows} rows × ${classroomPlan.classroom.benches_per_row} benches, ${classroomPlan.classroom.seats_per_bench} seats/bench`, 20, yPos);
  yPos += 7;

        if (classroomPlan.invigilator) {
          doc.text(`Invigilator: ${classroomPlan.invigilator.name} (${classroomPlan.invigilator.invigilator_id})`, 20, yPos);
        } else {
          doc.text("Invigilator: Not assigned", 20, yPos);
        }
        yPos += 10;

        // Student list (exclude absentees)
        doc.setFontSize(9);
        doc.text("Seating Layout (Rows as Columns, Theater Style):", 20, yPos);
        yPos += 7;
        for (let col = 0; col < classroomPlan.seats.length; col += 2) {
          doc.text(`Column ${col / 2 + 1}:`, 25, yPos);
          yPos += 5;
          for (let bench = 0; bench < classroomPlan.seats[col].length; bench += 2) {
            let benchLine = `  Bench ${bench / 2 + 1}: `;
            let seatList = [];
            for (let seat = 0; seat < classroomPlan.seats[col][bench].length; seat += 2) {
              const student = classroomPlan.seats[col][bench][seat];
              if (student && !(absentees.includes(student.student_id))) {
                seatList.push(`Seat ${seat / 2 + 1}: ${student.student_id} - ${student.name}`);
              } else {
                seatList.push(`Seat ${seat / 2 + 1}: Empty`);
              }
            }
            benchLine += seatList.join(", ");
            doc.text(benchLine, 30, yPos);
            yPos += 5;
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
          }
          yPos += 3;
        }

        yPos += 10;
      });

      yPos += 5;
    });

    // Save the PDF
    doc.save(`seating-plan-${new Date(selectedDate).toISOString().split('T')[0]}.pdf`);
    toast({ title: "Success", description: "PDF report generated successfully" });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Seating Allocations</h1>
          <p className="text-muted-foreground mt-1">Generate smart seating plans and assign invigilators</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter Absentees (Roll Numbers)</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="absentees">Comma separated roll numbers</Label>
            <input
              id="absentees"
              className="border rounded px-2 py-1 w-full mt-2"
              placeholder="E.g. S001,S002"
              value={absentees.join(",")}
              onChange={e => setAbsentees(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Exam Date</Label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an exam date" />
                </SelectTrigger>
                <SelectContent>
                  {examDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {new Date(date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateAllocation} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Allocation for All Exams
            </Button>
          </CardContent>
        </Card>

        {seatingPlan.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Seating Plans for {new Date(selectedDate).toLocaleDateString()}</h2>
              <div className="flex gap-2">
                <Button onClick={generatePDF} variant="outline">
                  <FileDown className="h-4 w-4 mr-2" />
                  Generate Seating PDF
                </Button>
                <Button onClick={generateAbsenteePDF} variant="outline">
                  <FileDown className="h-4 w-4 mr-2" />
                  Absentees PDF
                </Button>
              </div>
            </div>
            {seatingPlan.map(({ exam, plan }, examIdx) => (
              <div key={examIdx} className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground">
                  {exam.paper_title} ({exam.paper_code})
                </h3>
                {plan.map((classroomPlan, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>{classroomPlan.classroom.name}</span>
                        {classroomPlan.invigilator && (
                          <span className="text-sm font-normal text-muted-foreground">
                            Invigilator: {classroomPlan.invigilator.name}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${classroomPlan.classroom.benches_per_row * classroomPlan.classroom.seats_per_bench}, minmax(120px, 1fr))` }}>
                          {classroomPlan.seats.map((row, rowIdx) =>
                            row.flat().map((student, colIdx) => (
                              <div
                                key={`${rowIdx}-${colIdx}`}
                                className={`p-3 rounded border text-center text-sm ${
                                  student 
                                    ? "bg-primary/10 border-primary/20" 
                                    : "bg-muted border-muted-foreground/20"
                                }`}
                              >
                                {student ? (
                                  <>
                                    <div className="font-medium">{student.student_id}</div>
                                    <div className="text-xs text-muted-foreground truncate">{student.name}</div>
                                  </>
                                ) : (
                                  <div className="text-muted-foreground">Empty</div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        )}

  // PDF for absentees grouped by paper
      </div>
    </Layout>
  );
}

export default Allocations;
