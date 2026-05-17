export type BusinessProfile = {
  businessName: string;
  industry: string;
  companySize: string;
  description: string;
  departments: string[];
  tools: string[];
  communicationChannels: string[];
  commonProcesses: string;
  approvalHierarchy: string;
  goalsAutomation: string;
  painPoints: string;
};

export const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Education",
  "Real Estate",
  "Consulting",
  "Other",
] as const;

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

export const DEPARTMENTS = [
  "Sales",
  "Marketing",
  "Finance",
  "HR",
  "Engineering",
  "Operations",
  "Customer Support",
  "Legal",
] as const;

export const TOOLS = [
  "Slack",
  "Gmail",
  "Google Sheets",
  "Notion",
  "Salesforce",
  "HubSpot",
  "QuickBooks",
  "Jira",
  "Trello",
  "Asana",
  "Zapier",
  "Microsoft Teams",
] as const;

export const COMMUNICATION_CHANNELS = [
  "Email",
  "Slack",
  "Microsoft Teams",
  "WhatsApp",
  "Phone",
  "In-person meetings",
] as const;

export const emptyBusinessProfile = (): BusinessProfile => ({
  businessName: "",
  industry: "",
  companySize: "",
  description: "",
  departments: [],
  tools: [],
  communicationChannels: [],
  commonProcesses: "",
  approvalHierarchy: "",
  goalsAutomation: "",
  painPoints: "",
});

export const PROFILE_STORAGE_KEY = "n8nexus-business-profile";

export function countCompletedSections(profile: BusinessProfile): number {
  let count = 0;
  if (
    profile.businessName.trim() &&
    profile.industry &&
    profile.companySize &&
    profile.description.trim()
  ) {
    count += 1;
  }
  if (
    profile.departments.length > 0 &&
    profile.tools.length > 0 &&
    profile.communicationChannels.length > 0
  ) {
    count += 1;
  }
  if (profile.commonProcesses.trim() && profile.approvalHierarchy.trim()) {
    count += 1;
  }
  if (profile.goalsAutomation.trim() && profile.painPoints.trim()) {
    count += 1;
  }
  return count;
}
