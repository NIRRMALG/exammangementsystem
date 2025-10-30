import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, School, Users, UserCheck, Plus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";

type Exam = {
  id: string;
  paper_title: string;
  paper_code: string;
  exam_date: string;
  session_time: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    exams: 0,
    classrooms: 0,
    students: 0,
    invigilators: 0
  });
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [profile, setProfile] = useState<{ username: string; institution_name: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, institution_name")
        .eq("id", user.id)
        .single();
      if (profileError) {
        // Optionally show error toast
      }
      if (profileData) setProfile(profileData);

      // Fetch stats
      const [exams, classrooms, students, invigilators] = await Promise.all([
        supabase.from("exams").select("id", { count: "exact", head: true }),
        supabase.from("classrooms").select("id", { count: "exact", head: true }),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("invigilators").select("id", { count: "exact", head: true })
      ]);
      setStats({
        exams: exams.count || 0,
        classrooms: classrooms.count || 0,
        students: students.count || 0,
        invigilators: invigilators.count || 0
      });

      // Fetch recent exams
      const { data: examsData, error: examsError } = await supabase
        .from("exams")
        .select("id, paper_title, paper_code, exam_date, session_time")
        .order("exam_date", { ascending: false })
        .limit(5);
      if (examsError) {
        // Optionally show error toast
      }
      if (examsData) setRecentExams(examsData);
    };
    fetchData();
  }, []);

  const statCards = [
    { title: "Total Exams", value: stats.exams, icon: BookOpen, color: "text-primary" },
    { title: "Classrooms", value: stats.classrooms, icon: School, color: "text-accent" },
    { title: "Students", value: stats.students, icon: Users, color: "text-primary" },
    { title: "Invigilators", value: stats.invigilators, icon: UserCheck, color: "text-accent" }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.username || "User"} from {profile?.institution_name || "your institution"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Exams</CardTitle>
              <Button onClick={() => navigate("/exams")} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Exam
              </Button>
            </CardHeader>
            <CardContent>
              {recentExams.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No exams created yet. Create your first exam to get started!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paper Title</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentExams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.paper_title}</TableCell>
                        <TableCell>{exam.paper_code}</TableCell>
                        <TableCell>{new Date(exam.exam_date).toLocaleDateString()}</TableCell>
                        <TableCell>{exam.session_time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => navigate("/exams")} className="w-full justify-start" variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                Create New Exam
              </Button>
              <Button onClick={() => navigate("/allocations")} className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Seating Plan
              </Button>
              <Button onClick={() => navigate("/classrooms")} className="w-full justify-start" variant="outline">
                <School className="h-4 w-4 mr-2" />
                Add Classroom
              </Button>
              <Button onClick={() => navigate("/students")} className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Add Students
              </Button>
              <Button onClick={() => navigate("/invigilators")} className="w-full justify-start" variant="outline">
                <UserCheck className="h-4 w-4 mr-2" />
                Add Invigilator
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
