import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "./ui/spinner";
import { Repository, GitHubFile, FileAnalysisResponse } from "@/lib/types";
import { getRepositoryFiles, analyzeFile, analyzeRepositoryCode } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface FileExplorerProps {
  repository: Repository;
}

export default function FileExplorer({ repository }: FileExplorerProps) {
  const { toast } = useToast();
  const [currentPath, setCurrentPath] = useState<string>("");
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FileAnalysisResponse | null>(null);
  const [isExplorerLoading, setIsExplorerLoading] = useState(false);

  // Extract owner and repo from the repository's fullName
  const [owner, repo] = repository.fullName.split('/');

  // Fetch files mutation
  const fetchFilesMutation = useMutation({
    mutationFn: async (path: string) => {
      setIsExplorerLoading(true);
      const result = await getRepositoryFiles(owner, repo, path);
      setIsExplorerLoading(false);
      return result;
    },
    onSuccess: (data) => {
      setFiles(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to fetch files: ${error.message}`,
        variant: "destructive",
      });
      setIsExplorerLoading(false);
    },
  });

  // Analyze file mutation
  const analyzeFileMutation = useMutation({
    mutationFn: async (filePath: string) => {
      return analyzeFile({
        repositoryId: repository.id,
        filePath,
      });
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to analyze file: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Analyze entire repository mutation
  const analyzeRepoMutation = useMutation({
    mutationFn: async () => {
      return analyzeRepositoryCode(repository.id);
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to analyze repository: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Load repository files
  const loadFiles = (path: string = "") => {
    setSelectedFile(null);
    setAnalysisResult(null);
    
    // Update breadcrumbs
    if (path === "") {
      setBreadcrumbs([]);
    } else {
      const parts = path.split('/');
      setBreadcrumbs(parts);
    }
    
    setCurrentPath(path);
    fetchFilesMutation.mutate(path);
  };

  // Handle file or directory click
  const handleFileClick = (file: GitHubFile) => {
    if (file.type === 'dir') {
      loadFiles(file.path);
    } else {
      setSelectedFile(file.path);
      setAnalysisResult(null);
    }
  };

  // Handle breadcrumb click
  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      loadFiles();
    } else {
      const path = breadcrumbs.slice(0, index + 1).join('/');
      loadFiles(path);
    }
  };

  // Handle analyze button click
  const handleAnalyzeClick = () => {
    if (selectedFile) {
      analyzeFileMutation.mutate(selectedFile);
    }
  };
  
  // Handle analyze entire repository button click
  const handleAnalyzeRepositoryClick = () => {
    setAnalysisResult(null);
    analyzeRepoMutation.mutate();
  };

  // Initialize file explorer
  const handleExploreClick = () => {
    loadFiles();
  };

  return (
    <div className="rounded-xl shadow-md border border-gray-200 overflow-hidden bg-gradient-to-br from-white to-gray-50">
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="bg-primary/10 p-2 rounded-lg mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Code Explorer</h2>
              <p className="text-sm text-gray-500">Browse and analyze repository files with AI assistance</p>
            </div>
          </div>
          
          <Button
            onClick={handleExploreClick}
            disabled={isExplorerLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Explore Files
          </Button>
        </div>
      </div>
      
      <div className="px-6 py-5">
        {fetchFilesMutation.isPending || isExplorerLoading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner className="h-8 w-8 text-primary" />
            <span className="ml-2 text-gray-600">Loading files...</span>
          </div>
        ) : files.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white">
              <div className="flex items-center text-sm mb-4 bg-gray-50 p-2 rounded-lg overflow-x-auto">
                <button
                  onClick={() => handleBreadcrumbClick(-1)}
                  className="flex items-center px-2 py-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Root
                </button>
                {breadcrumbs.map((part, index) => (
                  <span key={index} className="flex items-center">
                    <span className="mx-1 text-gray-400">/</span>
                    <button
                      onClick={() => handleBreadcrumbClick(index)}
                      className="px-2 py-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors whitespace-nowrap"
                    >
                      {part}
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="h-96 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-1">
                {files.map((file, index) => (
                  <div
                    key={index}
                    onClick={() => handleFileClick(file)}
                    className={`flex items-center p-2 cursor-pointer rounded-md hover:bg-blue-50 transition-colors duration-150 ${
                      selectedFile === file.path ? "bg-blue-50 border border-blue-100" : ""
                    }`}
                  >
                    {file.type === 'dir' ? (
                      <div className="bg-yellow-100 p-1 rounded mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
                          <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-1 rounded mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">{file.name}</span>
                  </div>
                ))}
              </div>
              
              {selectedFile && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-sm font-medium text-gray-900">Selected File</h3>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-800 mb-3 font-mono border-l-4 border-primary">
                    {selectedFile}
                  </div>
                  <Button
                    onClick={handleAnalyzeClick}
                    disabled={analyzeFileMutation.isPending || !selectedFile}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-primary to-blue-700 hover:from-primary hover:to-blue-800 transition-all duration-200"
                  >
                    {analyzeFileMutation.isPending ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        Analyze File with AI
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
              <div className="flex items-center mb-4">
                <div className="bg-primary/10 p-1.5 rounded-md mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">AI Code Analysis</h3>
              </div>
              
              {analyzeFileMutation.isPending || analyzeRepoMutation.isPending ? (
                <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-b from-blue-50 to-white rounded-lg border border-blue-100 p-6">
                  <Spinner className="h-10 w-10 text-primary mb-4" />
                  <div className="text-center">
                    <span className="block text-primary font-medium mb-1">AI Analysis in Progress</span>
                    <span className="text-sm text-gray-600">
                      {analyzeRepoMutation.isPending 
                        ? "Analyzing entire repository structure, patterns, and key features" 
                        : "Examining code structure, dependencies, and patterns"}
                    </span>
                  </div>
                  <div className="mt-6 w-full max-w-xs bg-gray-200 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ) : analysisResult ? (
                <div className="h-96 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                    <div className="bg-gray-100 p-1 rounded mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">{analysisResult.fileName}</h4>
                  </div>
                  <Separator className="mb-4" />
                  <div className="prose prose-sm max-w-none text-gray-700 markdown-content">
                    <ReactMarkdown>
                      {analysisResult.analysis}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-6 text-center">
                  <div className="bg-gray-100 p-3 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium mb-1">AI Code Analysis</p>
                  <p className="text-sm text-gray-500 mb-3 max-w-xs">Select a file from the explorer and click "Analyze File with AI" to get detailed insights</p>
                  
                  <Button
                    onClick={handleAnalyzeRepositoryClick}
                    disabled={analyzeRepoMutation.isPending}
                    className="mb-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                  >
                    {analyzeRepoMutation.isPending ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2" />
                        Analyzing Repository...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                        </svg>
                        Analyze Entire Repository
                      </>
                    )}
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 w-full max-w-xs">
                    <div className="flex items-center bg-gray-50 p-2 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Purpose & Functions</span>
                    </div>
                    <div className="flex items-center bg-gray-50 p-2 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Dependencies</span>
                    </div>
                    <div className="flex items-center bg-gray-50 p-2 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Key Logic</span>
                    </div>
                    <div className="flex items-center bg-gray-50 p-2 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Optimizations</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="relative z-10 flex flex-col items-center justify-center h-64 text-center">
              <div className="bg-white p-3 rounded-full shadow-md mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Explore Repository Files</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Browse the complete file structure of this repository and use AI to analyze any file's functionality
              </p>
              <Button
                onClick={handleExploreClick}
                disabled={isExplorerLoading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-gradient-to-r from-primary to-blue-700 hover:from-primary/90 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                Explore Files
              </Button>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-5 right-5 bg-blue-100 h-24 w-24 rounded-full opacity-50"></div>
            <div className="absolute bottom-5 left-5 bg-primary/10 h-16 w-16 rounded-full"></div>
            <div className="absolute top-1/2 left-1/4 bg-blue-50 h-12 w-12 rounded-full transform -translate-y-1/2"></div>
          </div>
        )}
      </div>
    </div>
  );
}