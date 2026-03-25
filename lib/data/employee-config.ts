import type { Role, Appointment } from "@/lib/types/employee";

export const ROLES: Role[] = [
  {
    id: "software-engineer",
    name: "Software Engineer",
    description: "Development and technical implementation",
    documents: [
      {
        id: "se-employment-contract",
        name: "Employment Contract",
        fileName: "employment_contract.docx",
      },
      {
        id: "se-nda-agreement",
        name: "NDA Agreement",
        fileName: "nda_agreement.docx",
      },
      {
        id: "se-code-of-conduct",
        name: "Code of Conduct",
        fileName: "code_of_conduct.docx",
      },
      {
        id: "se-equipment-agreement",
        name: "Equipment Agreement",
        fileName: "equipment_agreement.docx",
      },
      {
        id: "se-remote-work-policy",
        name: "Remote Work Policy",
        fileName: "remote_work_policy.docx",
      },
      {
        id: "se-ip-assignment",
        name: "IP Assignment Agreement",
        fileName: "ip_assignment.docx",
      },
    ],
  },
  {
    id: "project-manager",
    name: "Project Manager",
    description: "Project planning and team coordination",
    documents: [
      {
        id: "pm-project-charter",
        name: "Project Charter",
        fileName: "project_charter.docx",
      },
      {
        id: "pm-team-guidelines",
        name: "Team Guidelines",
        fileName: "team_guidelines.docx",
      },
      {
        id: "pm-stakeholder-communication",
        name: "Stakeholder Communication Plan",
        fileName: "stakeholder_communication.docx",
      },
      {
        id: "pm-risk-management",
        name: "Risk Management Framework",
        fileName: "risk_management.docx",
      },
      {
        id: "pm-budget-template",
        name: "Budget Allocation Template",
        fileName: "budget_template.docx",
      },
    ],
  },
  {
    id: "hr-specialist",
    name: "HR Specialist",
    description: "Human resources and talent management",
    documents: [
      {
        id: "hr-policy",
        name: "HR Policy",
        fileName: "hr_policy.docx",
      },
      {
        id: "hr-benefits-overview",
        name: "Benefits Overview",
        fileName: "benefits_overview.docx",
      },
      {
        id: "hr-payroll-setup",
        name: "Payroll Setup Form",
        fileName: "payroll_setup.docx",
      },
      {
        id: "hr-leave-policy",
        name: "Leave & Absence Policy",
        fileName: "leave_policy.docx",
      },
    ],
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    description: "Data analysis and business intelligence",
    documents: [
      {
        id: "da-employment-contract",
        name: "Employment Contract",
        fileName: "employment_contract.docx",
      },
      {
        id: "da-data-access-agreement",
        name: "Data Access Agreement",
        fileName: "data_access_agreement.docx",
      },
      {
        id: "da-confidentiality-policy",
        name: "Confidentiality Policy",
        fileName: "confidentiality_policy.docx",
      },
      {
        id: "da-tool-license-agreement",
        name: "Tool License Agreement",
        fileName: "tool_license_agreement.docx",
      },
      {
        id: "da-reporting-standards",
        name: "Reporting Standards Guide",
        fileName: "reporting_standards.docx",
      },
      {
        id: "da-gdpr-compliance",
        name: "GDPR Compliance Acknowledgment",
        fileName: "gdpr_compliance.docx",
      },
      {
        id: "da-code-of-conduct",
        name: "Code of Conduct",
        fileName: "code_of_conduct.docx",
      },
    ],
  },
];

export const APPOINTMENTS: Appointment[] = [
  {
    id: "safety-training",
    name: "Safety Training",
    description: "Workplace safety and compliance training",
    documents: [
      {
        id: "st-safety-guidelines",
        name: "Safety Guidelines",
        fileName: "safety_guidelines.docx",
      },
      {
        id: "st-emergency-procedures",
        name: "Emergency Procedures",
        fileName: "emergency_procedures.docx",
      },
    ],
  },
  {
    id: "onboarding",
    name: "Onboarding",
    description: "New employee orientation and setup",
    documents: [
      {
        id: "ob-onboarding-checklist",
        name: "Onboarding Checklist",
        fileName: "onboarding_checklist.docx",
      },
      {
        id: "ob-welcome-packet",
        name: "Welcome Packet",
        fileName: "welcome_packet.docx",
      },
      {
        id: "ob-it-setup-guide",
        name: "IT Setup Guide",
        fileName: "it_setup_guide.docx",
      },
    ],
  },
  {
    id: "medical-checkup",
    name: "Medical Checkup",
    description: "Pre-employment medical examination",
    documents: [
      {
        id: "mc-medical-form",
        name: "Medical Form",
        fileName: "medical_form.docx",
      },
      {
        id: "mc-vaccination-record",
        name: "Vaccination Record",
        fileName: "vaccination_record.docx",
      },
    ],
  },
  {
    id: "fire-safety",
    name: "Fire Safety Drill",
    description: "Fire safety training and evacuation procedures",
    documents: [
      {
        id: "fs-fire-safety-manual",
        name: "Fire Safety Manual",
        fileName: "fire_safety_manual.docx",
      },
      {
        id: "fs-evacuation-plan",
        name: "Evacuation Plan",
        fileName: "evacuation_plan.docx",
      },
    ],
  },
  {
    id: "compliance-training",
    name: "Compliance Training",
    description: "Regulatory compliance and ethics",
    documents: [
      {
        id: "ct-compliance-handbook",
        name: "Compliance Handbook",
        fileName: "compliance_handbook.docx",
      },
      {
        id: "ct-anti-bribery-policy",
        name: "Anti-Bribery Policy",
        fileName: "anti_bribery_policy.docx",
      },
      {
        id: "ct-whistleblower-policy",
        name: "Whistleblower Policy",
        fileName: "whistleblower_policy.docx",
      },
    ],
  },
  {
    id: "ergonomics-assessment",
    name: "Ergonomics Assessment",
    description: "Workplace ergonomics evaluation",
    documents: [
      {
        id: "ea-ergonomics-checklist",
        name: "Ergonomics Checklist",
        fileName: "ergonomics_checklist.docx",
      },
    ],
  },
];
