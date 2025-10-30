import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Exam = {
  id: string;
  paper_title: string;
  paper_code: string;
  exam_date: string;
  session_time: string;
  session_duration: number;
};

const Exams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    paper_title: "",
    paper_code: "",
    exam_date: "",
    session_time: "",
    session_duration: 180
  });
  const { toast } = useToast();

  const fetchExams = async () => {
    const { data, error } = await supabase
      .from("exams")
      .select("id, paper_title, paper_code, exam_date, session_time, session_duration")
      .order("exam_date", { ascending: true });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setExams(data || []);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast({ title: "Error", description: userError?.message || "User not found", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("exams").insert([{ ...formData, user_id: user.id }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Exam created successfully" });
      setOpen(false);
      setFormData({
        paper_title: "",
        paper_code: "",
        exam_date: "",
        session_time: "",
        session_duration: 180
      });
      fetchExams();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Exam deleted" });
      fetchExams();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Exams</h1>
            <p className="text-muted-foreground mt-1">Manage exam schedules and details</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paper_title">Paper Title</Label>
                  <Input
                    id="paper_title"
                    value={formData.paper_title}
                    onChange={(e) => setFormData({ ...formData, paper_title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paper_code">Paper Code</Label>
                  <Input
                    id="paper_code"
                    value={formData.paper_code}
                    onChange={(e) => setFormData({ ...formData, paper_code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exam_date">Exam Date</Label>
                  <Input
                    id="exam_date"
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_time">Session Time</Label>
                  <Input
                    id="session_time"
                    type="time"
                    value={formData.session_time}
                    onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_duration">Duration (minutes)</Label>
                  <Input
                    id="session_duration"
                    type="number"
                    value={formData.session_duration}
                    onChange={(e) => setFormData({ ...formData, session_duration: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Create Exam</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paper Title</TableHead>
                  <TableHead>Paper Code</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.paper_title}</TableCell>
                    <TableCell>{exam.paper_code}</TableCell>
                    <TableCell>{new Date(exam.exam_date).toLocaleDateString()}</TableCell>
                    <TableCell>{exam.session_time}</TableCell>
                    <TableCell>{exam.session_duration} min</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(exam.id)}
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
      </div>
    </Layout>
  );
};

export default Exams;
