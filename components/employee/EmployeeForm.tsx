"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  employeeFormSchema,
  EmployeeFormData,
} from "@/lib/validations/employee-form";
import { TRAINING_DURATIONS } from "@/lib/data/employee-config";
import {
  Button,
  Card,
  CardContent,
  FormField,
  Input,
  Select,
  MultiSelect,
  DatePicker,
} from "@/components/ui";
import {
  User,
  UserPlus,
  RotateCcw,
  FolderOpen,
  FileText,
  Check,
} from "lucide-react";
import type { Employee, Role, Appointment } from "@/lib/types/employee";

export interface EmployeeFormProps {
  onAdd: (employee: Employee) => void;
  onUpdate?: (employee: Employee) => void;
  editingEmployee?: Employee | null;
  onCancelEdit?: () => void;
  roles: Role[];
  appointments: Appointment[];
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  onAdd,
  onUpdate,
  editingEmployee,
  onCancelEdit,
  roles,
  appointments,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    mode: "onChange",
    defaultValues: editingEmployee
      ? {
          fullName: editingEmployee.fullName,
          birthday: editingEmployee.birthday,
          startDate: editingEmployee.startDate,
          trainingDuration: editingEmployee.trainingDuration,
          roleId: editingEmployee.roleId,
          appointmentIds: editingEmployee.appointmentIds,
        }
      : {
          fullName: "",
          birthday: "",
          startDate: "",
          trainingDuration: "",
          roleId: "",
          appointmentIds: [],
        },
  });

  const selectedRoleId = watch("roleId");
  const selectedAppointmentIds = watch("appointmentIds");

  // --- Document selection state (checked/unchecked) ---
  const [selectedRoleDocIds, setSelectedRoleDocIds] = useState<Set<string>>(
    () => new Set(editingEmployee?.selectedRoleDocIds || [])
  );
  const [selectedAppDocIds, setSelectedAppDocIds] = useState<Set<string>>(
    () => new Set(editingEmployee?.selectedAppointmentDocIds || [])
  );

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId),
    [selectedRoleId, roles]
  );

  const selectedAppointments = useMemo(
    () => appointments.filter((a) => selectedAppointmentIds?.includes(a.id)),
    [selectedAppointmentIds, appointments]
  );

  // Auto-select all docs when role changes
  useEffect(() => {
    if (selectedRole) {
      setSelectedRoleDocIds(new Set(selectedRole.documents.map((d) => d.id)));
    } else {
      setSelectedRoleDocIds(new Set());
    }
  }, [selectedRole]);

  // Auto-select all docs when appointments change
  useEffect(() => {
    const allDocIds = selectedAppointments.flatMap((a) =>
      a.documents.map((d) => d.id)
    );
    setSelectedAppDocIds(new Set(allDocIds));
  }, [selectedAppointments]);

  const toggleRoleDoc = (docId: string) => {
    setSelectedRoleDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const toggleAppDoc = (docId: string) => {
    setSelectedAppDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const roleOptions = useMemo(
    () => roles.map((r) => ({ id: r.id, name: r.name, description: r.description })),
    [roles]
  );

  const appointmentOptions = useMemo(
    () => appointments.map((a) => ({ id: a.id, name: a.name, description: a.description })),
    [appointments]
  );

  const trainingOptions = useMemo(
    () => TRAINING_DURATIONS.map((t) => ({ id: t.id, name: t.name })),
    []
  );

  const handleFormSubmit = (data: EmployeeFormData) => {
    const employee: Employee = {
      id: editingEmployee?.id || crypto.randomUUID(),
      fullName: data.fullName,
      birthday: data.birthday,
      startDate: data.startDate,
      trainingDuration: data.trainingDuration,
      roleId: data.roleId,
      appointmentIds: data.appointmentIds,
      selectedRoleDocIds: Array.from(selectedRoleDocIds),
      selectedAppointmentDocIds: Array.from(selectedAppDocIds),
    };

    if (editingEmployee) {
      onUpdate?.(employee);
    } else {
      onAdd(employee);
    }
    // Form state persists — do NOT reset after adding
  };

  const handleReset = () => {
    reset({
      fullName: "",
      birthday: "",
      startDate: "",
      trainingDuration: "",
      roleId: "",
      appointmentIds: [],
    });
    setSelectedRoleDocIds(new Set());
    setSelectedAppDocIds(new Set());
    onCancelEdit?.();
  };

  const coreDocCount = selectedRoleDocIds.size;
  const overlayDocCount = selectedAppDocIds.size;
  const totalRoleDocs = selectedRole?.documents.length || 0;
  const totalOverlayDocs = selectedAppointments.reduce(
    (acc, a) => acc + a.documents.length,
    0
  );

  return (
    <Card variant="gradient" className="overflow-visible">
      <div className="flex items-center justify-between p-6 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {editingEmployee ? "Edit Employee" : "New Employee Registration"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure profile details and assigned documentation for the{" "}
            {editingEmployee ? "employee" : "new hire"}.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
          title="Reset form"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="p-6 pt-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
            {/* Left: Form Fields */}
            <div className="space-y-5">
              {/* Full Name */}
              <FormField
                label="Full Name"
                name="fullName"
                required
                error={errors.fullName?.message}
              >
                <Input
                  {...register("fullName")}
                  placeholder="e.g. Johnathan Doe"
                  leftIcon={<User className="h-5 w-5" />}
                  hasError={!!errors.fullName}
                />
              </FormField>

              {/* Role & Birthday Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Role"
                  name="roleId"
                  required
                  error={errors.roleId?.message}
                >
                  <Controller
                    name="roleId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={roleOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select role"
                        hasError={!!errors.roleId}
                      />
                    )}
                  />
                </FormField>

                <FormField
                  label="Birthday"
                  name="birthday"
                  required
                  error={errors.birthday?.message}
                >
                  <Controller
                    name="birthday"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select birthday"
                        hasError={!!errors.birthday}
                      />
                    )}
                  />
                </FormField>
              </div>

              {/* Training & Start Date Row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Training Duration"
                  name="trainingDuration"
                  required
                  error={errors.trainingDuration?.message}
                >
                  <Controller
                    name="trainingDuration"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={trainingOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select duration"
                        hasError={!!errors.trainingDuration}
                      />
                    )}
                  />
                </FormField>

                <FormField
                  label="Start Date"
                  name="startDate"
                  required
                  error={errors.startDate?.message}
                >
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select start date"
                        hasError={!!errors.startDate}
                      />
                    )}
                  />
                </FormField>
              </div>

              {/* Appointments */}
              <FormField
                label="Select Appointments"
                name="appointmentIds"
                error={errors.appointmentIds?.message}
              >
                <Controller
                  name="appointmentIds"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      options={appointmentOptions}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select appointment type"
                      hasError={!!errors.appointmentIds}
                    />
                  )}
                />
              </FormField>
            </div>

            {/* Right: Document Checklists — scrollable with filters */}
            <div className="space-y-6 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
              {/* Core Documents (Role) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">
                    Core Documents
                  </h3>
                  {totalRoleDocs > 0 && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {coreDocCount}/{totalRoleDocs}
                    </span>
                  )}
                </div>
                {selectedRole ? (
                  <div className="space-y-2">
                    {selectedRole.documents.map((doc) => {
                      const isChecked = selectedRoleDocIds.has(doc.id);
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => toggleRoleDoc(doc.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-all cursor-pointer ${
                            isChecked
                              ? "border-blue-200 bg-white hover:border-blue-300 hover:shadow-md"
                              : "border-gray-200 bg-gray-50 opacity-60 hover:opacity-80"
                          }`}
                        >
                          <FolderOpen
                            className={`h-5 w-5 shrink-0 ${
                              isChecked ? "text-blue-500" : "text-gray-400"
                            }`}
                          />
                          <span
                            className={`flex-1 text-left text-sm font-medium ${
                              isChecked
                                ? "text-gray-700"
                                : "text-gray-400 line-through"
                            }`}
                          >
                            {doc.name}
                          </span>
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                              isChecked
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isChecked && (
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
                    <FileText className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-400">
                      Select a role to see associated documents
                    </p>
                  </div>
                )}
              </div>

              {/* Overlay Documents (Appointments) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">
                    Overlay Documents
                  </h3>
                  {totalOverlayDocs > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      {overlayDocCount}/{totalOverlayDocs}
                    </span>
                  )}
                </div>
                {selectedAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAppointments.map((appointment) =>
                      appointment.documents.map((doc) => {
                        const isChecked = selectedAppDocIds.has(doc.id);
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => toggleAppDoc(doc.id)}
                            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-all cursor-pointer ${
                              isChecked
                                ? "border-emerald-200 bg-white hover:border-emerald-300 hover:shadow-md"
                                : "border-gray-200 bg-gray-50 opacity-60 hover:opacity-80"
                            }`}
                          >
                            <FolderOpen
                              className={`h-5 w-5 shrink-0 ${
                                isChecked ? "text-emerald-500" : "text-gray-400"
                              }`}
                            />
                            <div className="flex-1 text-left">
                              <span
                                className={`text-sm font-medium ${
                                  isChecked
                                    ? "text-gray-700"
                                    : "text-gray-400 line-through"
                                }`}
                              >
                                {doc.name}
                              </span>
                              <span className="ml-2 text-xs text-gray-400">
                                ({appointment.name})
                              </span>
                            </div>
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                                isChecked
                                  ? "border-emerald-500 bg-emerald-500"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {isChecked && (
                                <Check className="h-3 w-3 text-white" strokeWidth={3} />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
                    <FileText className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-400">
                      Select appointments to see overlay documents
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<UserPlus className="h-4 w-4" />}
              className="w-full sm:w-auto !from-orange-500 !to-orange-600 !shadow-orange-500/25 hover:!shadow-orange-500/40"
            >
              {editingEmployee ? "Update Employee" : "Add Employee"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

EmployeeForm.displayName = "EmployeeForm";
