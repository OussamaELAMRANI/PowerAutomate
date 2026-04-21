"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Navbar, Footer } from "@/components/layout";
import {
  EmployeeForm,
  EmployeeTable,
  GlobalSidebar,
} from "@/components/employee";
import { Button } from "@/components/ui";
import { Toast } from "@/components/ui/Toast";
import { generateEmployeeDocs } from "@/app/actions/generate-employee-docs";
import { Download, Users, Loader2 } from "lucide-react";
import type {
  Employee,
  GlobalProperties,
  Role,
  Appointment,
} from "@/lib/types/employee";
import CEBadge from "@/components/ui/CEBadge";

export default function EmployeeAutomationPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [globalProps, setGlobalProps] = useState<GlobalProperties>({
    companyName: "",
    companyEmail: "",
    companyAddress: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Dynamic template data from API
  const [roles, setRoles] = useState<Role[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // Fetch templates from filesystem on mount
  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        setRoles(data.roles || []);
        setAppointments(data.appointments || []);
        setTemplatesLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load templates:", err);
        setTemplatesLoaded(true);
      });
  }, []);

  const handleAddEmployee = useCallback((employee: Employee) => {
    setEmployees((prev) => [...prev, employee]);
    setToast({
      message: "Employee successfully added to the queue!",
      type: "success",
    });
  }, []);

  const handleUpdateEmployee = useCallback((employee: Employee) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === employee.id ? employee : e)),
    );
    setEditingEmployee(null);
    setFormKey((k) => k + 1);
    setToast({
      message: "Employee details updated successfully!",
      type: "success",
    });
  }, []);

  const handleEditEmployee = useCallback((employee: Employee) => {
    setEditingEmployee(employee);
    setFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDeleteEmployee = useCallback((employeeId: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    setToast({
      message: "Employee removed from the queue.",
      type: "success",
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingEmployee(null);
    setFormKey((k) => k + 1);
  }, []);

  const handleGenerate = async () => {
    if (employees.length === 0) {
      setToast({
        message: "Please add at least one employee before generating.",
        type: "error",
      });
      return;
    }

    setIsGenerating(true);
    try {
      let logoBase64 = globalProps.companyLogo;
      if (logoFile) {
        logoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(logoFile);
        });
      }

      const finalGlobalProps = {
        ...globalProps,
        companyLogo: logoBase64,
      };

      const result = await generateEmployeeDocs(
        employees,
        finalGlobalProps,
        roles,
        appointments,
      );

      if (result.success && result.zipBase64) {
        const byteCharacters = atob(result.zipBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/zip" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `employee-documents-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setToast({
          message: `Documents generated for ${employees.length} employee(s)!`,
          type: "success",
        });
      } else {
        setToast({
          message: result.error || "Failed to generate documents.",
          type: "error",
        });
      }
    } catch {
      setToast({
        message: "An unexpected error occurred while generating documents.",
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-blue-50">
      <Navbar />

      <main className="pt-20 pb-8 px-4 sm:pt-24 sm:pb-12">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-4 mb-2">
              <CEBadge />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
                  Employee Document Automation
                </h1>
                <p className="mt-1 text-sm text-gray-600 sm:text-base">
                  Register employees, assign roles & appointments, and generate
                  all required documents in one click.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content: Sidebar + Form */}
          <div className="flex gap-6 mb-8">
            {/* Collapsible Global Sidebar */}
            <GlobalSidebar
              value={globalProps}
              onChange={setGlobalProps}
              logoFile={logoFile}
              onLogoChange={setLogoFile}
            />

            {/* Employee Form */}
            <div className="flex-1 min-w-0">
              {templatesLoaded ? (
                <EmployeeForm
                  key={formKey}
                  onAdd={handleAddEmployee}
                  onUpdate={handleUpdateEmployee}
                  editingEmployee={editingEmployee}
                  onCancelEdit={handleCancelEdit}
                  roles={roles}
                  appointments={appointments}
                />
              ) : (
                <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-3 text-gray-500">
                    Loading templates...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          {employees.length > 0 && (
            <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-orange-200 bg-linear-to-r from-orange-50 to-amber-50 p-6 sm:flex-row sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Ready to generate
                  </p>
                  <p className="text-xs text-gray-500">
                    {employees.length} employee
                    {employees.length !== 1 ? "s" : ""} in queue
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleGenerate}
                isLoading={isGenerating}
                leftIcon={
                  isGenerating ? undefined : <Download className="h-5 w-5" />
                }
                className="w-full sm:w-auto !from-orange-500 !to-orange-600 !shadow-orange-500/25 hover:!shadow-orange-500/40"
              >
                {isGenerating ? "Generating..." : "Generate & Download ZIP"}
              </Button>
            </div>
          )}

          {/* Employee Table */}
          <EmployeeTable
            employees={employees}
            onEdit={handleEditEmployee}
            onDelete={handleDeleteEmployee}
            roles={roles}
            appointments={appointments}
          />
        </div>
      </main>

      <Footer />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
