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

type Classroom = {
  id: string;
  name: string;
  capacity: number;
  rows: number; // number of rows in classroom
  benches_per_row: number; // number of benches in each row
  seats_per_bench: number; // number of seats in each bench
};

const Classrooms = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    rows: 5,
    benches_per_row: 6,
    seats_per_bench: 2
  });
  const { toast } = useToast();

  const fetchClassrooms = async () => {
    const { data, error } = await supabase
      .from("classrooms")
      .select("id, name, capacity, rows, benches_per_row, seats_per_bench")
      .order("name", { ascending: true });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setClassrooms(data || []);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast({ title: "Error", description: userError?.message || "User not found", variant: "destructive" });
      return;
    }
  const capacity = formData.rows * formData.benches_per_row * formData.seats_per_bench;
  const { error } = await supabase.from("classrooms").insert([{ ...formData, capacity, user_id: user.id }]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Classroom created successfully" });
      setOpen(false);
  setFormData({ name: "", rows: 5, benches_per_row: 6, seats_per_bench: 2 });
      fetchClassrooms();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("classrooms").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Classroom deleted" });
      fetchClassrooms();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Classrooms</h1>
            <p className="text-muted-foreground mt-1">Manage classroom layouts and capacity</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Classroom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Classroom</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Classroom Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Room 101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rows">Number of Rows</Label>
                  <Input
                    id="rows"
                    type="number"
                    min="1"
                    value={formData.rows}
                    onChange={(e) => setFormData({ ...formData, rows: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="benches_per_row">Benches per Row</Label>
                  <Input
                    id="benches_per_row"
                    type="number"
                    min="1"
                    value={formData.benches_per_row}
                    onChange={(e) => setFormData({ ...formData, benches_per_row: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats_per_bench">Seats per Bench</Label>
                  <Input
                    id="seats_per_bench"
                    type="number"
                    min="1"
                    value={formData.seats_per_bench}
                    onChange={(e) => setFormData({ ...formData, seats_per_bench: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Capacity: <span className="font-bold text-foreground">{formData.rows * formData.benches_per_row * formData.seats_per_bench}</span> seats
                  </p>
                </div>
                <Button type="submit" className="w-full">Create Classroom</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Classrooms</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Layout</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classrooms.map((classroom) => (
                  <TableRow key={classroom.id}>
                    <TableCell className="font-medium">{classroom.name}</TableCell>
                    <TableCell>{classroom.rows} × {classroom.benches_per_row} benches, {classroom.seats_per_bench} seats/bench</TableCell>
                    <TableCell>{classroom.capacity} seats</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(classroom.id)}
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

export default Classrooms;
