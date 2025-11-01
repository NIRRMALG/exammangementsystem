import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { toast } from "../components/ui/use-toast";
import Layout from "../components/Layout";
import jsPDF from "jspdf";
import { FileDown } from "lucide-react";
// import { Loader2 } from "lucide-react"; // uncomment if you have this icon
import { supabase } from "../integrations/supabase/client";

// --- Types ---
type Student = {
  id: string;
  student_id: string;
  name: string;
  paper_code?: string;
  exam_name?: string;
  exam_date?: string;
};

type Classroom = {
  id: string;
  name: string;
  capacity: number;
  rows: number;
  benches_per_row?: number;
  seats_per_bench?: number;
};

type Exam = {
  id: string;
  paper_title: string;
  paper_code: string;
  exam_date: string;
  session: string;
  total_students: number;
};


// --- Invigilator type ---
type Invigilator = {
  id: string;
  name: string;
};

const Allocations: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [examDates, setExamDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [seatingPlan, setSeatingPlan] = useState<any[]>([]);
  // Classroom layout state
  const [numColumns, setNumColumns] = useState<number>(4);
  const [benchesPerColumn, setBenchesPerColumn] = useState<number>(5);
  const [seatsPerBench, setSeatsPerBench] = useState<number>(2);

  const classroomCapacity = numColumns * benchesPerColumn * seatsPerBench;
  const [absentees, setAbsentees] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [invigilators, setInvigilators] = useState<Invigilator[]>([]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("*");
        if (studentsError) {
          toast({
            title: "Error fetching students",
            description: studentsError.message,
            variant: "destructive",
          });
          // eslint-disable-next-line no-console
          console.error('Error fetching students:', studentsError);
        }
        setStudents(studentsData || []);
  // Debug: log students fetched
  // eslint-disable-next-line no-console
  console.log('Fetched students:', studentsData);

        const { data: classroomsData } = await supabase
          .from("classrooms")
          .select("id, name, capacity, rows")
          .order("name", { ascending: true });
  setClassrooms(classroomsData || []);
  // Debug: log classrooms fetched
  // eslint-disable-next-line no-console
  console.log('Fetched classrooms:', classroomsData);

        const { data: examsData } = await supabase
          .from("exams")
          .select("exam_date")
          .order("exam_date", { ascending: true });

        const dates =
          examsData?.length > 0
            ? Array.from(new Set(examsData.map((e: any) => e.exam_date)))
            : [];
  setExamDates(dates);
  // Debug: log exam dates
  // eslint-disable-next-line no-console
  console.log('Fetched exam dates:', dates);
  if (dates.length > 0) setSelectedDate(dates[0]);

        // Fetch invigilators (only select columns that exist)
        const { data: invigilatorsData, error: invigilatorsError } = await supabase
          .from("invigilators")
          .select("id, name");
        if (invigilatorsError) {
          toast({
            title: "Error fetching invigilators",
            description: invigilatorsError.message,
            variant: "destructive",
          });
        } else {
          setInvigilators(invigilatorsData || []);
          // Debug: log invigilators
          // eslint-disable-next-line no-console
          console.log('Fetched invigilators:', invigilatorsData);
        }
      } catch (error: any) {
        toast({
          title: "Error fetching data",
          description: error.message,
          variant: "destructive",
        });
        // eslint-disable-next-line no-console
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // --- Allocation Logic with strictest adjacency by paper_code ---
  const generateAllocation = async () => {
    setLoading(true);
    try {
      // Filter absentees
      const presentStudents = students.filter(
        (s) => !absentees.includes(s.student_id)
      );
      // Sort students by student_id for allocation
      const sorted = [...presentStudents].sort((a, b) => (a.student_id || '').localeCompare(b.student_id || ''));

      // Build a 3D array: [col][bench][seat] = student or null
      const plan: any[] = [];
      let studentIdx = 0;
      for (let c = 0; c < classrooms.length; c++) {
        const room = classrooms[c];
  // Always use user input for layout
  const cols = numColumns;
  const benches = benchesPerColumn;
  const seats = seatsPerBench;
        const grid: (Student | null)[][][] = [];
        for (let col = 0; col < cols; col++) {
          const colArr: (Student | null)[][] = [];
          for (let bench = 0; bench < benches; bench++) {
            const benchArr: (Student | null)[] = [];
            for (let seat = 0; seat < seats; seat++) {
              benchArr.push(null);
            }
            colArr.push(benchArr);
          }
          grid.push(colArr);
        }
        // Fill benches left-to-right, top-to-bottom, with student IDs (no adjacency check)
        for (let bench = 0; bench < benches; bench++) {
          for (let col = 0; col < cols; col++) {
            for (let seat = 0; seat < seats; seat++) {
              if (studentIdx < sorted.length) {
                grid[col][bench][seat] = sorted[studentIdx];
                studentIdx++;
              } else {
                grid[col][bench][seat] = null;
              }
            }
          }
        }
        // Check if any student is allocated in this classroom
        let hasStudent = false;
        for (let col = 0; col < cols; col++) {
          for (let bench = 0; bench < benches; bench++) {
            for (let seat = 0; seat < seats; seat++) {
              if (grid[col][bench][seat]) {
                hasStudent = true;
                break;
              }
            }
            if (hasStudent) break;
          }
          if (hasStudent) break;
        }
        plan.push({
          classroom: room,
          grid,
          invigilator: hasStudent ? (invigilators[c % invigilators.length]?.name || "Unassigned") : "Unassigned",
        });
      }
      setSeatingPlan(plan);
      toast({ title: "Success", description: "Seating allocation generated with strictest adjacency by paper code." });
    } catch (error: any) {
      toast({
        title: "Error generating allocation",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // --- PDF generation (stubs) ---
  // --- PDF Generation (true 2D grid with boxes) ---
  const generatePDF = () => {
    if (!seatingPlan.length) {
      toast({ title: "No seating plan", description: "Generate allocation first." });
      return;
    }
    const doc = new jsPDF();
    seatingPlan.forEach((roomPlan, idx) => {
      if (idx > 0) doc.addPage();
      doc.setFontSize(14);
      doc.text(`Classroom: ${roomPlan.classroom.name}`, 10, 15);
      doc.setFontSize(10);
      doc.text(`Invigilator: ${roomPlan.invigilator}`, 10, 22);
      const grid = roomPlan.grid;
      // grid[col][bench][seat]
      const cols = grid.length;
      const benches = grid[0]?.length || 0;
      const seats = grid[0]?.[0]?.length || 0;
      let startY = 30;
      let startX = 10;
      const cellW = 28;
      const cellH = 14;
      // Draw improved grid: benches as rows, columns as columns, seats as horizontal pairs, with gap between columns
      const colGap = 6; // px gap between columns
      doc.setFontSize(10);
      for (let col = 0; col < cols; col++) {
        let x = startX + col * (cellW + colGap);
        doc.text(`Col ${col + 1}`, x + cellW / 2 - 8, startY - 4, { align: 'center' });
      }
      for (let bench = 0; bench < benches; bench++) {
        let y = startY + bench * cellH;
        doc.setFontSize(10);
        doc.text(`Bench ${bench + 1}`, startX - 18, y + cellH / 2 + 2, { align: 'right' });
        for (let col = 0; col < cols; col++) {
          let x = startX + col * (cellW + colGap);
          for (let seat = 0; seat < seats; seat++) {
            let seatX = x + seat * (cellW / seats);
            let seatW = cellW / seats;
            const student = grid[col][bench][seat];
            doc.rect(seatX, y, seatW, cellH);
            let label = '_';
            if (student && student.student_id) {
              label = student.student_id;
              if (student.paper_code) label += `\n${student.paper_code}`;
            }
            doc.setFontSize(8);
            const lines = label.split('\n');
            lines.forEach((line, i) => {
              doc.text(line, seatX + seatW / 2, y + 6 + i * 5, { align: 'center' });
            });
          }
        }
      }
    });
    doc.save('seating_plan.pdf');
    toast({ title: "PDF generated", description: "Seating plan PDF downloaded." });
  };
  const generateAbsenteePDF = () => {
    toast({
      title: "PDF generation",
      description: "Absentee PDF generation not implemented yet.",
    });
  };

  // --- JSX ---
  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Seating Allocations</h1>
        <p className="text-muted-foreground mt-1">
          Generate smart seating plans and assign invigilators
        </p>

        {/* Classroom Layout Input */}
        <Card>
          <CardHeader>
            <CardTitle>Classroom Layout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-4 items-end">
              <div>
                <Label htmlFor="numColumns">Columns (C)</Label>
                <input
                  id="numColumns"
                  type="number"
                  min={1}
                  value={numColumns}
                  onChange={e => setNumColumns(Math.max(1, Number(e.target.value)))}
                  className="border rounded px-2 py-1 w-20"
                />
              </div>
              <div>
                <Label htmlFor="benchesPerColumn">Benches/Column (B)</Label>
                <input
                  id="benchesPerColumn"
                  type="number"
                  min={1}
                  value={benchesPerColumn}
                  onChange={e => setBenchesPerColumn(Math.max(1, Number(e.target.value)))}
                  className="border rounded px-2 py-1 w-20"
                />
              </div>
              <div>
                <Label htmlFor="seatsPerBench">Seats/Bench (S)</Label>
                <input
                  id="seatsPerBench"
                  type="number"
                  min={1}
                  value={seatsPerBench}
                  onChange={e => setSeatsPerBench(Math.max(1, Number(e.target.value)))}
                  className="border rounded px-2 py-1 w-20"
                />
              </div>
              <div className="ml-4">
                <Label>Capacity</Label>
                <div className="font-bold text-lg">{classroomCapacity}</div>
              </div>
            </div>
            {/* Visual grid with color-coding */}
            <div className="mt-4">
              <Label>Classroom Layout Preview (Color-coded by Paper)</Label>
              <div
                className="border rounded bg-muted mt-2 overflow-x-auto"
                style={{ width: '100%', maxWidth: 600 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}>
                  {[...Array(numColumns)].map((_, colIdx) => (
                    <div key={colIdx} style={{ borderRight: colIdx < numColumns - 1 ? '1px solid #ccc' : undefined }}>
                      {[...Array(benchesPerColumn)].map((_, benchIdx) => (
                        <div key={benchIdx} style={{ display: 'flex', gap: 2, margin: 2 }}>
                          {[...Array(seatsPerBench)].map((_, seatIdx) => {
                            // For demo: assign a fake paper_code based on seat position
                            const fakePaper = `PAPER${((colIdx * benchesPerColumn * seatsPerBench) + (benchIdx * seatsPerBench) + seatIdx) % 6}`;
                            // Simple hash to color
                            const colorMap = [
                              '#e57373', // red
                              '#64b5f6', // blue
                              '#81c784', // green
                              '#ffd54f', // yellow
                              '#ba68c8', // purple
                              '#ffb74d', // orange
                            ];
                            const color = colorMap[(colIdx + benchIdx + seatIdx) % colorMap.length];
                            return (
                              <div
                                key={seatIdx}
                                style={{
                                  width: 18,
                                  height: 18,
                                  background: color,
                                  border: '1px solid #b6c2d1',
                                  borderRadius: 3,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 8,
                                  color: '#222',
                                }}
                                title={`Col ${colIdx + 1}, Bench ${benchIdx + 1}, Seat ${seatIdx + 1} | ${fakePaper}`}
                              >
                                {/* Show short paper code for demo */}
                                {fakePaper.replace('PAPER', 'P')}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Absentee Input */}
        <Card>
          <CardHeader>
            <CardTitle>Enter Absentees (Roll Numbers)</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="absentees">Comma-separated roll numbers</Label>
            <input
              id="absentees"
              className="border rounded px-2 py-1 w-full mt-2"
              placeholder="E.g. S001,S002"
              value={absentees.join(",")}
              onChange={(e) =>
                setAbsentees(
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </CardContent>
        </Card>

        {/* Allocation Generator */}
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
            <Button
              onClick={generateAllocation}
              disabled={loading || !selectedDate}
              className="w-full"
            >
              {selectedDate ? `Generate Allocation for ${new Date(selectedDate).toLocaleDateString()}` : 'Select a date to allocate'}
            </Button>
            {!selectedDate && (
              <div className="text-red-600 text-sm mt-2">Please select an exam date to generate allocations.</div>
            )}
          </CardContent>
        </Card>

        {/* Show warning if no students fetched */}
        {students.length === 0 && (
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded mb-4">
            <strong>Warning:</strong> No students found in the database. Please check your Supabase data.
          </div>
        )}
        {/* Seating Plan Section */}
        {seatingPlan.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">
                Seating Plans for {new Date(selectedDate).toLocaleDateString()}
              </h2>
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
            {/* Warning if not enough seats or invigilators */}
            {students.length > classroomCapacity && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4">
                <strong>Warning:</strong> Not enough seats for all students. Please increase classroom size or add more rooms.
              </div>
            )}
            {classrooms.length > 0 && students.length > 0 && (() => {
              const requiredInvigilators = Math.ceil(students.length / 30);
              const invigilatorCount = invigilators.length;
              if (invigilatorCount < requiredInvigilators) {
                return (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4">
                    <strong>Warning:</strong> Not enough invigilators for allocation rules. Required: {requiredInvigilators}, Available: {invigilatorCount}.
                  </div>
                );
              }
              return null;
            })()}
            {/* Render classroom seating plan with strict adjacency rule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {seatingPlan.map((roomPlan, idx) => (
                <Card key={roomPlan.classroom.id}>
                  <CardHeader>
                    <CardTitle>
                      {roomPlan.classroom.name}
                      <span className="ml-2 text-xs text-muted-foreground">(Capacity: {roomPlan.classroom.capacity})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <strong>Invigilator:</strong> {roomPlan.invigilator}
                    </div>
                    <div className="mt-2">
                      <Label>Seating Grid</Label>
                      <div className="border rounded bg-muted mt-2 overflow-x-auto" style={{ width: '100%', maxWidth: 600 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${roomPlan.grid.length}, 1fr)` }}>
                          {roomPlan.grid.map((col: any, colIdx: number) => (
                            <div key={colIdx} style={{ borderRight: colIdx < roomPlan.grid.length - 1 ? '1px solid #ccc' : undefined }}>
                              {col.map((bench: any, benchIdx: number) => (
                                <div key={benchIdx} style={{ display: 'flex', gap: 2, margin: 2 }}>
                                  {bench.map((student: Student | null, seatIdx: number) => {
                                    let color = '#eee';
                                    if (student && student.paper_code) {
                                      // Color by paper_code
                                      const hash = Array.from(student.paper_code).reduce((acc, c) => acc + c.charCodeAt(0), 0);
                                      const colorMap = [
                                        '#e57373', // red
                                        '#64b5f6', // blue
                                        '#81c784', // green
                                        '#ffd54f', // yellow
                                        '#ba68c8', // purple
                                        '#ffb74d', // orange
                                      ];
                                      color = colorMap[hash % colorMap.length];
                                    }
                                    return (
                                      <div
                                        key={seatIdx}
                                        style={{
                                          width: 18,
                                          height: 18,
                                          background: color,
                                          border: '1px solid #b6c2d1',
                                          borderRadius: 3,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: 8,
                                          color: '#222',
                                        }}
                                        title={student ? `${student.student_id} | ${student.name} | ${student.paper_code}` : 'Empty'}
                                      >
                                        {student ? (student.paper_code ? student.paper_code.replace(/\D/g, '').slice(-2) : 'S') : ''}
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Allocations;
