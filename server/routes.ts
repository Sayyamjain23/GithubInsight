import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { repositorySchema } from "@shared/schema";
import { analyzeCode } from "./services/openrouter";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to analyze a GitHub repository
  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const bodySchema = z.object({
        url: z.string().url("Invalid URL format")
          .refine(url => url.includes("github.com"), { 
            message: "URL must be a GitHub repository" 
          })
      });

      const { url } = bodySchema.parse(req.body);

      // Extract owner and repo name from GitHub URL
      const urlParts = url.replace(/\/$/, "").split("/");
      const owner = urlParts[urlParts.length - 2];
      const repo = urlParts[urlParts.length - 1];

      if (!owner || !repo) {
        return res.status(400).json({ 
          message: "Invalid GitHub repository URL. Format should be: https://github.com/owner/repo" 
        });
      }
      
      // Try to get repository from storage first (cache)
      const existingRepo = await storage.getRepositoryByFullName(`${owner}/${repo}`);
      if (existingRepo) {
        return res.json(existingRepo);
      }

      // Fetch repository data from GitHub API
      const repoData = await fetchRepositoryData(owner, repo);
      
      // Save repository to storage
      const savedRepo = await storage.createRepository(repoData);
      
      return res.json(savedRepo);
    } catch (error) {
      console.error("Error analyzing repository:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      if (axios.isAxiosError(error) && error.response) {
        return res.status(error.response.status).json({
          message: `GitHub API error: ${error.response.data.message || "Unknown error"}`
        });
      }
      
      return res.status(500).json({ message: "Failed to analyze repository" });
    }
  });

  // API endpoint to generate README for a repository
  app.post("/api/readme/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const options = req.body || {};
      
      // Fetch repository data
      const repository = await storage.getRepository(id);
      
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      
      // Generate README content
      const readmeContent = generateReadmeContent(repository, options);
      
      return res.json({
        content: readmeContent,
        filename: "README.md"
      });
    } catch (error) {
      console.error("Error generating README:", error);
      return res.status(500).json({ message: "Failed to generate README" });
    }
  });

  // API endpoint to get repository files
  app.get("/api/files/:owner/:repo", async (req: Request, res: Response) => {
    try {
      const { owner, repo } = req.params;
      const path = req.query.path as string || "";
      
      // Fetch repository contents from GitHub API
      const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const response = await axios.get(contentsUrl);
      
      return res.json(response.data);
    } catch (error) {
      console.error("Error fetching repository files:", error);
      if (axios.isAxiosError(error) && error.response) {
        return res.status(error.response.status).json({
          message: `GitHub API error: ${error.response.data.message || "Unknown error"}`
        });
      }
      return res.status(500).json({ message: "Failed to fetch repository files" });
    }
  });
  
  // API endpoint to analyze a file in a repository
  app.post("/api/analyze-file", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const bodySchema = z.object({
        repositoryId: z.string().min(1, "Repository ID is required"),
        filePath: z.string().min(1, "File path is required")
      });
      
      const { repositoryId, filePath } = bodySchema.parse(req.body);
      
      // Fetch repository data
      const repository = await storage.getRepository(repositoryId);
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      
      const [owner, repo] = repository.fullName.split('/');
      
      // Fetch file content from GitHub API
      const fileContentUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
      const fileContentResponse = await axios.get(fileContentUrl);
      
      // Fetch directory structure
      const dirStructureUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;
      const structureResponse = await axios.get(dirStructureUrl);
      
      const fileContent = Buffer.from(fileContentResponse.data.content, 'base64').toString('utf-8');
      
      // Simplify directory structure for the AI
      const dirStructure = structureResponse.data.tree
        .filter((item: any) => item.type === 'tree' || item.type === 'blob')
        .map((item: any) => `${item.type === 'tree' ? 'directory' : 'file'}: ${item.path}`)
        .join('\n');
      
      // Prepare code content (selected file and relevant imports)
      const codeContent = `File: ${filePath}\n\n\`\`\`\n${fileContent}\n\`\`\``;
      
      // Call OpenRouter to analyze the code
      const analysis = await analyzeCode(dirStructure, codeContent, filePath);
      
      return res.json({
        fileName: filePath.split('/').pop() || filePath,
        analysis
      });
    } catch (error) {
      console.error("Error analyzing file:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      if (axios.isAxiosError(error) && error.response) {
        return res.status(error.response.status).json({
          message: `GitHub API error: ${error.response.data.message || "Unknown error"}`
        });
      }
      
      return res.status(500).json({ message: "Failed to analyze file" });
    }
  });
  
  // API endpoint to analyze the entire repository
  app.post("/api/analyze-repository-code", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const bodySchema = z.object({
        repositoryId: z.string().min(1, "Repository ID is required"),
      });
      
      const { repositoryId } = bodySchema.parse(req.body);
      
      // Fetch repository data
      const repository = await storage.getRepository(repositoryId);
      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }
      
      const [owner, repo] = repository.fullName.split('/');
      
      // Fetch directory structure
      const dirStructureUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;
      const structureResponse = await axios.get(dirStructureUrl);
      
      // Simplify directory structure for the AI
      const dirStructure = structureResponse.data.tree
        .filter((item: any) => item.type === 'tree' || item.type === 'blob')
        .map((item: any) => `${item.type === 'tree' ? 'directory' : 'file'}: ${item.path}`)
        .join('\n');
      
      // Get a sample of important files (at most 5 files)
      const importantFileExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.php', '.go', '.rb', '.c', '.cpp'];
      const codeFiles = structureResponse.data.tree
        .filter((item: any) => 
          item.type === 'blob' && 
          importantFileExtensions.some(ext => item.path.endsWith(ext)) &&
          !item.path.includes('node_modules/') &&
          !item.path.includes('vendor/') && 
          !item.path.match(/\.(min|bundle|compiled)\./i)
        )
        .slice(0, 5);
      
      // Fetch content of important files
      let sampleCode = '';
      for (const file of codeFiles) {
        try {
          const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`;
          const fileResponse = await axios.get(fileUrl);
          const content = Buffer.from(fileResponse.data.content, 'base64').toString('utf-8');
          
          // Add file content with markdown formatting
          sampleCode += `\nFile: ${file.path}\n\`\`\`\n${content.slice(0, 1000)}${content.length > 1000 ? '...' : ''}\n\`\`\`\n`;
        } catch (err) {
          console.error(`Error fetching file ${file.path}:`, err);
          // Continue with other files if one fails
        }
      }
      
      // Call OpenRouter to analyze the repo structure and sample code
      const analysis = await analyzeCode(dirStructure, sampleCode, "entire repository");
      
      return res.json({
        fileName: repository.fullName,
        analysis
      });
    } catch (error) {
      console.error("Error analyzing repository:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      if (axios.isAxiosError(error) && error.response) {
        return res.status(error.response.status).json({
          message: `GitHub API error: ${error.response.data.message || "Unknown error"}`
        });
      }
      
      return res.status(500).json({ message: "Failed to analyze repository" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to fetch repository data from GitHub API
async function fetchRepositoryData(owner: string, repo: string) {
  try {
    // Fetch repository info
    const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    const repoInfo = repoResponse.data;

    // Fetch languages
    const languagesResponse = await axios.get(repoInfo.languages_url);
    const languagesData = languagesResponse.data as Record<string, number>;
    
    // Calculate total bytes to get percentage
    let totalBytes = 0;
    Object.values(languagesData).forEach(bytes => {
      totalBytes += (bytes as number);
    });
    
    // Prepare languages array with colors
    const languageColors: Record<string, string> = {
      JavaScript: "#f1e05a",
      TypeScript: "#3178c6",
      HTML: "#e34c26",
      CSS: "#563d7c",
      Python: "#3572A5",
      Java: "#b07219",
      Go: "#00ADD8",
      Rust: "#dea584",
      C: "#555555",
      "C++": "#f34b7d",
      "C#": "#178600"
    };

    const languages = Object.entries(languagesData).map(entry => {
      const name = entry[0];
      const bytes = entry[1] as number;
      return {
        name,
        percentage: (bytes / (totalBytes || 1)) * 100,
        color: languageColors[name] || "#808080"
      };
    });

    // Fetch commit activity
    const commitActivityResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`);
    const commitData = commitActivityResponse.data || [];
    
    // Process commit data for chart (last 7 weeks to months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Make sure commitData is an array before using slice
    const commitActivity = Array.isArray(commitData) 
      ? commitData.slice(-7).map((weekData: any, index: number) => {
          const date = new Date(weekData.week * 1000);
          const month = months[date.getMonth()];
          return {
            month,
            count: weekData.total
          };
        })
      : Array(7).fill(0).map((_, index) => {
          const date = new Date();
          date.setDate(date.getDate() - (index * 7));
          const month = months[date.getMonth()];
          return {
            month,
            count: 0
          };
        });

    // Calculate average weekly commits for commit frequency
    const averageWeeklyCommits = Array.isArray(commitData) 
      ? commitData.slice(-12).reduce((sum: number, week: any) => sum + week.total, 0) / (Math.min(commitData.length, 12) || 1)
      : 0;
    const commitFrequency = `${Math.round(averageWeeklyCommits)}/week`;

    // Format dates
    const createdAt = new Date(repoInfo.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const lastUpdated = getRelativeTimeString(new Date(repoInfo.updated_at));

    // Mock some data that we can't easily get from GitHub API
    const codeQuality = Math.floor(70 + Math.random() * 25); // 70-95%
    const codeCoverage = Math.floor(60 + Math.random() * 30); // 60-90%

    // Mock complex files data
    const complexFiles = [
      {
        path: `src/core/${repo}Core.js`,
        complexity: 85,
        level: "High" as const
      },
      {
        path: `src/components/${repo}Component.js`,
        complexity: 65,
        level: "Medium" as const
      },
      {
        path: `src/utils/helpers.js`,
        complexity: 45,
        level: "Low" as const
      }
    ];

    // Mock dependencies data
    const dependencies = [
      {
        name: "react",
        version: "^18.2.0",
        status: "Up to date" as const
      },
      {
        name: "lodash",
        version: "^4.17.21",
        status: "Up to date" as const
      },
      {
        name: "axios",
        version: "^0.21.1",
        status: "Update available" as const
      }
    ];

    // Prepare repository data
    const repositoryData = {
      id: repoInfo.id.toString(),
      fullName: repoInfo.full_name,
      description: repoInfo.description || `A ${repoInfo.language} repository`,
      ownerAvatar: repoInfo.owner.avatar_url,
      stars: formatNumber(repoInfo.stargazers_count),
      forks: formatNumber(repoInfo.forks_count),
      openIssues: formatNumber(repoInfo.open_issues_count),
      language: repoInfo.language || "Unknown",
      createdAt,
      lastUpdated,
      codeQuality,
      codeCoverage,
      commitFrequency,
      activeContributors: Math.floor(10 + Math.random() * 490), // Random number 10-500
      languages,
      commitActivity,
      complexFiles,
      dependencies
    };

    return repositoryData;
  } catch (error) {
    console.error("Error fetching repository data:", error);
    throw error;
  }
}

// Helper function to generate README content
function generateReadmeContent(repository: any, options: any) {
  const {
    includeInstallation = true,
    includeUsage = true,
    includeContributing = true,
    includeLicense = true,
    customSections = []
  } = options;

  const repoName = repository.fullName.split('/')[1];
  
  let content = `# ${repoName}\n\n`;
  content += `${repository.description}\n\n`;
  
  content += `![GitHub stars](https://img.shields.io/github/stars/${repository.fullName}?style=social) `;
  content += `![License](https://img.shields.io/github/license/${repository.fullName}) `;
  content += `![Last commit](https://img.shields.io/github/last-commit/${repository.fullName})\n\n`;
  
  content += `## Overview\n\n`;
  content += `This repository contains a ${repository.language} project that ${repository.description.toLowerCase()}.\n\n`;
  
  // Languages section
  content += `## Languages\n\n`;
  repository.languages.forEach((lang: any) => {
    content += `- ${lang.name}: ${lang.percentage.toFixed(1)}%\n`;
  });
  content += `\n`;
  
  if (includeInstallation) {
    content += `## Installation\n\n`;
    content += `\`\`\`bash\n`;
    content += `# Clone the repository\n`;
    content += `git clone https://github.com/${repository.fullName}.git\n\n`;
    content += `# Change directory\n`;
    content += `cd ${repoName}\n\n`;
    content += `# Install dependencies\n`;
    if (repository.language === "JavaScript" || repository.language === "TypeScript") {
      content += `npm install\n`;
    } else if (repository.language === "Python") {
      content += `pip install -r requirements.txt\n`;
    } else if (repository.language === "Java") {
      content += `mvn install\n`;
    } else {
      content += `# Install dependencies according to your package manager\n`;
    }
    content += `\`\`\`\n\n`;
  }
  
  if (includeUsage) {
    content += `## Usage\n\n`;
    content += `\`\`\``;
    if (repository.language === "JavaScript" || repository.language === "TypeScript") {
      content += `javascript\n`;
      content += `import { ${repoName} } from '${repoName.toLowerCase()}';\n\n`;
      content += `// Initialize the component\n`;
      content += `const ${repoName.toLowerCase()} = new ${repoName}();\n`;
      content += `${repoName.toLowerCase()}.start();\n`;
    } else if (repository.language === "Python") {
      content += `python\n`;
      content += `from ${repoName.toLowerCase()} import ${repoName}\n\n`;
      content += `# Initialize the component\n`;
      content += `${repoName.toLowerCase()} = ${repoName}()\n`;
      content += `${repoName.toLowerCase()}.start()\n`;
    } else if (repository.language === "Java") {
      content += `java\n`;
      content += `import com.example.${repoName};\n\n`;
      content += `// Initialize the component\n`;
      content += `${repoName} ${repoName.toLowerCase()} = new ${repoName}();\n`;
      content += `${repoName.toLowerCase()}.start();\n`;
    } else {
      content += `\n// Example usage code for ${repoName}\n`;
    }
    content += `\`\`\`\n\n`;
  }
  
  if (includeContributing) {
    content += `## Contributing\n\n`;
    content += `Contributions are welcome! Please feel free to submit a Pull Request.\n\n`;
    content += `1. Fork the repository\n`;
    content += `2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)\n`;
    content += `3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)\n`;
    content += `4. Push to the branch (\`git push origin feature/amazing-feature\`)\n`;
    content += `5. Open a Pull Request\n\n`;
  }
  
  if (includeLicense) {
    content += `## License\n\n`;
    content += `This project is licensed under the MIT License - see the LICENSE file for details.\n\n`;
  }
  
  // Add custom sections
  customSections.forEach((section: any) => {
    if (section.title && section.content) {
      content += `## ${section.title}\n\n`;
      content += `${section.content}\n\n`;
    }
  });
  
  // Add footer
  content += `---\n\n`;
  content += `Generated by GitHub Repository Analyzer on ${new Date().toLocaleDateString()}\n`;
  
  return content;
}

// Helper function to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

// Helper function to get relative time string
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}
