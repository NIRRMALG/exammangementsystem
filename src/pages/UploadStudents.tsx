import React, { useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import * as XLSX from "xlsx";

const REQUIRED_COLUMNS = ["Roll No", "Name", "Department", "Gender", "Paper Code"];

const UploadStudents: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      // Validate columns
      const columns = Object.keys(json[0] || {});
      const missing = REQUIRED_COLUMNS.filter(col => !columns.includes(col));
      if (missing.length > 0) {
        setError(`Missing columns: ${missing.join(", ")}`);
        setPreview([]);
        return;
      }
      setPreview(json.slice(0, 10));
      setStudents(json);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Upload Student Data (Excel/CSV)</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Format Guide:</Label>
          <div className="text-xs mb-2">
            Required columns: <b>Roll No, Name, Department, Gender, Paper Code</b>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="mb-2"
            onChange={handleFile}
          />
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          {preview.length > 0 && (
            <div className="overflow-x-auto border rounded bg-white mb-2">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    {Object.keys(preview[0]).map((col) => (
                      <th key={col} className="px-2 py-1 border-b">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-2 py-1 border-b">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-xs text-muted-foreground p-2">Showing first 10 rows</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadStudents;
