"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  employeeFormSchema,
  EmployeeFormData,
} from "@/lib/validations/employee-form";
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
  Briefcase,
  Calendar,
  Clock,
  Shield,
  Hash,
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
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    mode: "onChange",
    defaultValues: editingEmployee
      ? {
          fullName: editingEmployee.fullName,
          birthday: editingEmployee.birthday,
          startDate: editingEmployee.startDate,
          roleId: editingEmployee.roleId,
          appointmentIds: editingEmployee.appointmentIds,
          roleType: editingEmployee.roleType || "",
          trainingHours: editingEmployee.trainingHours || "",
          guardIDNumber: editingEmployee.guardIDNumber || "",
          employeeIDNumber: editingEmployee.employeeIDNumber || "",
          useGuardAsEmployeeId: editingEmployee.useGuardAsEmployeeId || false,
        }
      : {
          fullName: "",
          birthday: "",
          startDate: "",
          roleId: "",
          appointmentIds: [],
          roleType: "",
          trainingHours: "",
          guardIDNumber: "",
          employeeIDNumber: "",
          useGuardAsEmployeeId: false,
        },
  });

  const selectedRoleId = watch("roleId");
  const selectedAppointmentIds = watch("appointmentIds");
  const useGuardAsEmployeeId = watch("useGuardAsEmployeeId");
  const guardIDNumber = watch("guardIDNumber");

  // Sync Guard ID → Employee ID when checkbox is checked
  useEffect(() => {
    if (useGuardAsEmployeeId) {
      setValue("employeeIDNumber", guardIDNumber || "");
    }
  }, [useGuardAsEmployeeId, guardIDNumber, setValue]);

  // --- Document selection state ---
  const [selectedRoleDocIds, setSelectedRoleDocIds] = useState<Set<string>>(
    () => new Set(editingEmployee?.selectedRoleDocIds || []),
  );
  const [selectedAppDocIds, setSelectedAppDocIds] = useState<Set<string>>(
    () => new Set(editingEmployee?.selectedAppointmentDocIds || []),
  );

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId),
    [selectedRoleId, roles],
  );

  const selectedAppointments = useMemo(
    () => appointments.filter((a) => selectedAppointmentIds?.includes(a.id)),
    [selectedAppointmentIds, appointments],
  );

  useEffect(() => {
    if (selectedRole) {
      setSelectedRoleDocIds(new Set(selectedRole.documents.map((d) => d.id)));
    } else {
      setSelectedRoleDocIds(new Set());
    }
  }, [selectedRole]);

  useEffect(() => {
    const allDocIds = selectedAppointments.flatMap((a) =>
      a.documents.map((d) => d.id),
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
    () =>
      roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
      })),
    [roles],
  );

  const appointmentOptions = useMemo(
    () =>
      appointments.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
      })),
    [appointments],
  );

  const handleFormSubmit = (data: EmployeeFormData) => {
    // Determine effective Employee ID
    const effectiveEmployeeId = data.useGuardAsEmployeeId
      ? data.guardIDNumber || ""
      : data.employeeIDNumber || "";

    const employee: Employee = {
      id: editingEmployee?.id || crypto.randomUUID(),
      fullName: data.fullName,
      birthday: data.birthday,
      startDate: data.startDate,
      roleId: data.roleId,
      appointmentIds: data.appointmentIds,
      selectedRoleDocIds: Array.from(selectedRoleDocIds),
      selectedAppointmentDocIds: Array.from(selectedAppDocIds),
      roleType: data.roleType,
      trainingHours: data.trainingHours,
      guardIDNumber: data.guardIDNumber,
      employeeIDNumber: effectiveEmployeeId,
      useGuardAsEmployeeId: data.useGuardAsEmployeeId,
    };

    if (editingEmployee) {
      onUpdate?.(employee);
    } else {
      onAdd(employee);
    }
  };

  const handleReset = () => {
    reset({
      fullName: "",
      birthday: "",
      startDate: "",
      roleId: "",
      appointmentIds: [],
      roleType: "",
      trainingHours: "",
      guardIDNumber: "",
      employeeIDNumber: "",
      useGuardAsEmployeeId: false,
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
    0,
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
            {/* Left: Form Fields — grouped sections */}
            <div className="space-y-6">
              {/* ═══ Personal Info ═══ */}
              <fieldset className="rounded-xl border border-gray-200 p-5 bg-white/60">
                <legend className="flex items-center gap-2 px-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                  <User className="h-4 w-4 text-blue-500" />
                  Personal Information
                </legend>
                <div className="space-y-4 mt-2">
                  <FormField
                    label="Full Name"
                    name="fullName"
                    id="fullName"
                    required
                    description="{FullName} placeholder"
                    error={errors.fullName?.message}
                  >
                    <Input
                      {...register("fullName")}
                      id="fullName"
                      placeholder="e.g. Johnathan Doe"
                      leftIcon={<User className="h-5 w-5" />}
                      hasError={!!errors.fullName}
                    />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Birthday"
                      name="birthday"
                      id="birthday"
                      description="{Birthday} placeholder"
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
                    <FormField
                      label="Start Date"
                      name="startDate"
                      id="startDate"
                      description="{StartDate} placeholder"
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
                </div>
              </fieldset>

              {/* ═══ Role & Training ═══ */}
              <fieldset className="rounded-xl border border-gray-200 p-5 bg-white/60">
                <legend className="flex items-center gap-2 px-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                  <Briefcase className="h-4 w-4 text-indigo-500" />
                  Role &amp; Training
                </legend>
                <div className="space-y-4 mt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Role"
                      name="roleId"
                      id="roleId"
                      description="{RoleName} placeholder"
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
                      description="{RoleType} placeholder"
                      label="Role Type"
                      name="roleType"
                      id="roleType"
                    >
                      <Input
                        {...register("roleType")}
                        id="roleType"
                        placeholder="e.g. Senior, Junior"
                        leftIcon={<Briefcase className="h-4 w-4" />}
                      />
                    </FormField>
                  </div>
                  <FormField
                    label="Training Hours"
                    name="trainingHours"
                    id="trainingHours"
                    description="{TrainingHours} placeholder"
                  >
                    <Input
                      {...register("trainingHours")}
                      id="trainingHours"
                      placeholder="e.g. 40"
                      leftIcon={<Clock className="h-4 w-4" />}
                    />
                  </FormField>
                </div>
              </fieldset>

              {/* ═══ Identification ═══ */}
              <fieldset className="rounded-xl border border-gray-200 p-5 bg-white/60">
                <legend className="flex items-center gap-2 px-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Identification
                </legend>
                <div className="space-y-4 mt-2">
                  <FormField
                    label="Guard ID Number"
                    name="guardIDNumber"
                    id="guardIDNumber"
                    description="{GuardIDNumber} placeholder"
                  >
                    <Input
                      {...register("guardIDNumber")}
                      id="guardIDNumber"
                      placeholder="e.g. GRD-001234"
                      leftIcon={<Shield className="h-4 w-4" />}
                    />
                  </FormField>

                  {/* Checkbox: Use Guard ID as Employee ID */}
                  <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none">
                    <Controller
                      name="useGuardAsEmployeeId"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={field.value}
                          onClick={() => field.onChange(!field.value)}
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 shrink-0 transition-colors cursor-pointer ${
                            field.value
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-gray-300 bg-white hover:border-gray-400"
                          }`}
                        >
                          {field.value && (
                            <Check
                              className="h-3 w-3 text-white"
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      )}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Use Guard ID as Employee ID
                      </span>
                      <p className="text-xs text-gray-400">
                        The Guard ID Number will be used as the Employee ID
                      </p>
                    </div>
                  </label>

                  <FormField
                    label="Employee ID Number"
                    name="employeeIDNumber"
                    id="employeeIDNumber"
                    description="{EmployeeIDNumber} placeholder"
                  >
                    <Input
                      {...register("employeeIDNumber")}
                      id="employeeIDNumber"
                      placeholder={
                        useGuardAsEmployeeId
                          ? "← Using Guard ID"
                          : "e.g. EMP-005678"
                      }
                      leftIcon={<Hash className="h-4 w-4" />}
                      disabled={useGuardAsEmployeeId}
                      className={
                        useGuardAsEmployeeId ? "opacity-60 !bg-gray-100" : ""
                      }
                    />
                  </FormField>
                </div>
              </fieldset>

              {/* ═══ Appointments ═══ */}
              <fieldset className="rounded-xl border border-gray-200 p-5 bg-white/60">
                <legend className="flex items-center gap-2 px-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  Appointments / Overlays
                </legend>
                <div className="mt-2">
                  <FormField
                    label="Select Appointments"
                    name="appointmentIds"
                    id="appointmentIds"
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
              </fieldset>
            </div>

            {/* Right: Document Checklists — stretches with form */}
            <div className="space-y-6 overflow-y-auto pr-1 custom-scrollbar lg:max-h-[calc(100vh-10rem)] lg:sticky lg:top-24 lg:self-start">
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
                              <Check
                                className="h-3 w-3 text-white"
                                strokeWidth={3}
                              />
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
                                <Check
                                  className="h-3 w-3 text-white"
                                  strokeWidth={3}
                                />
                              )}
                            </div>
                          </button>
                        );
                      }),
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
