import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
import { Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Student = {
  student_id: string;
  paper_code: string;
  exam_name: string;
  exam_date: string;
  session: string;
};

const ImportInstructions = () => (
  <div className="mb-4 p-4 border rounded bg-gray-50">
    <h2 className="font-bold mb-2">How to format your Excel file for import</h2>
    <ul className="list-disc pl-6 text-sm">
      <li>Required columns (case-sensitive): <code>student_id</code>, <code>paper_code</code>, <code>exam_name</code>, <code>exam_date</code>, <code>session</code></li>
      <li><strong>Date format:</strong> For Excel, enter dates as text (<code>YYYY-MM-DD</code>) or as Excel date cells. For CSV, use <code>YYYY-MM-DD</code> as text.</li>
      <li>Example row: <code>1001, MATH101, Math, 2025-10-30, FN</code></li>
      <li>You can use <code>sample_students_100.csv</code> in the <code>public</code> folder as a template.</li>
    </ul>
  </div>
);

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    paper_code: ""
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Only pick columns that exist in the students table
        const jsonData = XLSX.utils.sheet_to_json(worksheet).map((row: any) => ({
          student_id: row.student_id,
          paper_code: row.paper_code,
          exam_name: row.exam_name,
          exam_date: typeof row.exam_date === 'number'
            ? XLSX.SSF.format('yyyy-mm-dd', row.exam_date)
            : row.exam_date,
          session: row.session
        }));

        for (const student of jsonData) {
          const { error } = await supabase
            .from('students')
            .insert([student]);
          if (error) {
            toast({
              title: "Error",
              description: `Failed to add student ${student.student_id}: ${error.message}`,
              variant: "destructive"
            });
          }
        }

        fetchStudents();
        toast({
          title: "Success",
          description: `Successfully imported ${jsonData.length} students`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process file. Please check the file format.",
          variant: "destructive"
        });
      }
      setIsUploading(false);
    };

    reader.readAsArrayBuffer(file);
  };
  const { toast } = useToast();

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("student_id, paper_code, exam_name, exam_date, session")
      .order("student_id", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setStudents((data as Student[]) || []);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast({ title: "Error", description: userError?.message || "User not found", variant: "destructive" });
      return;
    }
  const { error } = await supabase.from("students").insert([{ ...formData, user_id: user.id }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Student added successfully" });
      setOpen(false);
  setFormData({ student_id: "", paper_code: "" });
      fetchStudents();
    }
  };

  const handleDelete = async (student_id: string) => {
    const { error } = await supabase.from("students").delete().eq("student_id", student_id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Student deleted" });
      fetchStudents();
    }
  };

  const [deletingAll, setDeletingAll] = useState(false);

  // Handler to delete all students
  const handleDeleteAll = async () => {
    setDeletingAll(true);
    const { error } = await supabase.from('students').delete().neq('student_id', '');
    setDeletingAll(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "All students deleted" });
      fetchStudents();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <ImportInstructions />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Students</h1>
            <p className="text-sm text-muted-foreground">Manage student records here.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Import Students'}
              </Button>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student_id">Student ID</Label>
                    <Input
                      id="student_id"
                      value={formData.student_id}
                      onChange={(e) =>
                        setFormData({ ...formData, student_id: e.target.value })
                      }
                      required
                    />
                  </div>
                  {/* Name field removed */}
                  <div className="space-y-2">
                    <Label htmlFor="paper_code">Paper Code</Label>
                    <Input
                      id="paper_code"
                      value={formData.paper_code}
                      onChange={(e) =>
                        setFormData({ ...formData, paper_code: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit">Add Student</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  {/* Name column removed */}
                  <TableHead>Paper Code</TableHead>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Exam Date</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: Student) => (
                  <TableRow key={student.student_id}>
                    <TableCell className="font-medium">{student.student_id}</TableCell>
                    {/* Name cell removed */}
                    <TableCell>{student.paper_code}</TableCell>
                    <TableCell>{student.exam_name}</TableCell>
                    <TableCell>{student.exam_date}</TableCell>
                    <TableCell>{student.session}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(student.student_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="mt-8 flex justify-end">
          <Button
            variant="destructive"
            onClick={handleDeleteAll}
            disabled={deletingAll}
          >
            {deletingAll ? 'Deleting...' : 'Delete All Students'}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Students;
