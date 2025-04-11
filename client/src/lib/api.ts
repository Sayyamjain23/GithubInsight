import { apiRequest } from "./queryClient";
import { Repository, ReadmeOptions, GitHubFile, FileAnalysisRequest, FileAnalysisResponse } from "./types";

// Function to analyze a GitHub repository
export async function analyzeRepository(url: string): Promise<Repository> {
  try {
    const response = await apiRequest("POST", "/api/analyze", { url });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error analyzing repository:", error);
    throw error;
  }
}

// Function to generate a README for a repository
export async function generateReadme(
  repoId: string, 
  options?: ReadmeOptions
): Promise<{ content: string, filename: string }> {
  try {
    const response = await apiRequest("POST", `/api/readme/${repoId}`, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error generating README:", error);
    throw error;
  }
}

// Function to download the generated README
export function downloadReadme(content: string, filename: string = "README.md"): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

// Function to get files from a repository
export async function getRepositoryFiles(owner: string, repo: string, path: string = ""): Promise<GitHubFile[]> {
  try {
    const response = await apiRequest("GET", `/api/files/${owner}/${repo}?path=${encodeURIComponent(path)}`);
    const data = await response.json();
    
    // Transform GitHub API response to our GitHubFile format
    return Array.isArray(data) 
      ? data.map((item: any) => ({
          name: item.name,
          path: item.path,
          type: item.type === 'dir' ? 'dir' : 'file',
        }))
      : []; // If not an array, return empty array
    
  } catch (error) {
    console.error("Error fetching repository files:", error);
    throw error;
  }
}

// Function to analyze a file using OpenRouter API
export async function analyzeFile(request: FileAnalysisRequest): Promise<FileAnalysisResponse> {
  try {
    const response = await apiRequest("POST", "/api/analyze-file", request);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error analyzing file:", error);
    throw error;
  }
}

// Function to analyze the entire repository with AI
export async function analyzeRepositoryCode(repositoryId: string): Promise<FileAnalysisResponse> {
  try {
    const response = await apiRequest("POST", "/api/analyze-repository-code", { repositoryId });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error analyzing repository code:", error);
    throw error;
  }
}
