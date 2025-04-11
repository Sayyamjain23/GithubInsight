import { Repository, ComplexFile, Dependency } from "@/lib/types";
import LanguageChart from "./charts/language-chart";
import CommitChart from "./charts/commit-chart";

interface CodeAnalysisProps {
  repository: Repository;
}

export default function CodeAnalysis({ repository }: CodeAnalysisProps) {
  const getComplexityColor = (level: string) => {
    switch (level) {
      case "High":
        return "bg-red-500";
      case "Medium":
        return "bg-orange-500";
      case "Low":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Up to date":
        return "bg-green-100 text-green-800";
      case "Update available":
        return "bg-yellow-100 text-yellow-800";
      case "Outdated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-medium text-gray-900">Code Analysis</h2>
      </div>
      
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Languages Distribution */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">Languages Distribution</h3>
            <div className="h-64 bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              <LanguageChart languages={repository.languages} />
            </div>
          </div>
          
          {/* Commit Activity */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">Commit Activity</h3>
            <div className="h-64 bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              <CommitChart commitActivity={repository.commitActivity} />
            </div>
          </div>
          
          {/* File Complexity */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">Top Complex Files</h3>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complexity</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {repository.complexFiles.map((file: ComplexFile, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-700">{file.path}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-2 w-36 bg-gray-200 rounded-full">
                            <div className={`h-2 ${getComplexityColor(file.level)} rounded-full`} style={{ width: `${file.complexity}%` }}></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-700">{file.level}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Dependency Analysis */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">Dependencies</h3>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dependency</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {repository.dependencies.map((dep: Dependency, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{dep.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{dep.version}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(dep.status)}`}>
                          {dep.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
