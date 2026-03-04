"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge, Input } from "@/components/ui";
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import type { Employee, Role, Appointment } from "@/lib/types/employee";

export interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  roles: Role[];
  appointments: Appointment[];
}

const ROWS_PER_PAGE = 5;

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onEdit,
  onDelete,
  roles,
  appointments,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase();
    return employees.filter((emp) =>
      emp.fullName.toLowerCase().includes(query)
    );
  }, [employees, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / ROWS_PER_PAGE)
  );
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const getRoleName = (roleId: string) => {
    return roles.find((r) => r.id === roleId)?.name || roleId;
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      onDelete(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  if (employees.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <Users className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-700">
          No employees added yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Add employees using the form above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 overflow-hidden">
      {/* Table Header */}
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900">Employee Queue</h3>
          <Badge variant="info" size="md">
            {filteredEmployees.length}{" "}
            {filteredEmployees.length === 1 ? "employee" : "employees"}
          </Badge>
        </div>
        <div className="w-full sm:w-72">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            leftIcon={<Search className="h-4 w-4" />}
            className="!py-2 !text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Employee
              </th>
              <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 md:table-cell">
                Role
              </th>
              <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:table-cell">
                Start Date
              </th>
              <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:table-cell">
                Docs
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedEmployees.map((employee) => (
              <tr
                key={employee.id}
                className="transition-colors hover:bg-blue-50/30"
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {employee.fullName}
                  </p>
                </td>
                <td className="hidden px-6 py-4 md:table-cell">
                  <Badge variant="info" size="sm">
                    {getRoleName(employee.roleId)}
                  </Badge>
                </td>
                <td className="hidden px-6 py-4 text-sm text-gray-600 lg:table-cell">
                  {employee.startDate
                    ? new Date(employee.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="hidden px-6 py-4 sm:table-cell">
                  <div className="flex gap-1.5">
                    <Badge variant="default" size="sm">
                      {employee.selectedRoleDocIds.length} role
                    </Badge>
                    {employee.selectedAppointmentDocIds.length > 0 && (
                      <Badge variant="success" size="sm">
                        {employee.selectedAppointmentDocIds.length} overlay
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(employee)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit employee"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(employee.id)}
                      className={cn(
                        "rounded-lg p-2 transition-colors cursor-pointer",
                        deleteConfirmId === employee.id
                          ? "bg-red-50 text-red-600"
                          : "text-gray-400 hover:bg-red-50 hover:text-red-600"
                      )}
                      title={
                        deleteConfirmId === employee.id
                          ? "Click again to confirm"
                          : "Delete employee"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
          <p className="text-xs text-gray-500">
            Showing {(currentPage - 1) * ROWS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ROWS_PER_PAGE, filteredEmployees.length)} of{" "}
            {filteredEmployees.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "h-8 w-8 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

EmployeeTable.displayName = "EmployeeTable";
