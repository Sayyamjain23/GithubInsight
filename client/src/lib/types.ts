// Repository data type
export interface Repository {
  id: string;
  fullName: string;
  description: string;
  ownerAvatar: string;
  stars: string;
  forks: string;
  openIssues: string;
  language: string;
  createdAt: string;
  lastUpdated: string;
  codeQuality: number;
  codeCoverage: number;
  commitFrequency: string;
  activeContributors: number;
  languages: LanguageData[];
  commitActivity: CommitActivity[];
  complexFiles: ComplexFile[];
  dependencies: Dependency[];
}

// Language data for chart
export interface LanguageData {
  name: string;
  percentage: number;
  color: string;
}

// Commit activity data for chart
export interface CommitActivity {
  month: string;
  count: number;
}

// Complex file data
export interface ComplexFile {
  path: string;
  complexity: number;
  level: "High" | "Medium" | "Low";
}

// Dependency data
export interface Dependency {
  name: string;
  version: string;
  status: "Up to date" | "Update available" | "Outdated";
}

// README generation options
export interface ReadmeOptions {
  includeInstallation?: boolean;
  includeUsage?: boolean;
  includeContributing?: boolean;
  includeLicense?: boolean;
  customSections?: {
    title: string;
    content: string;
  }[];
}

export interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  content?: string;
}

export interface FileAnalysisRequest {
  repositoryId: string;
  filePath: string;
}

export interface FileAnalysisResponse {
  fileName: string;
  analysis: string;
}
