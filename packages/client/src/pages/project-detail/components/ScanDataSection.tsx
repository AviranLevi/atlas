// React / library
import { FileCode, FolderOpen, FolderTree, Package, Terminal, Settings2 } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// Types
import type { ScanDataSectionProps } from '../project-detail.types';

export function ScanDataSection({ scanData }: ScanDataSectionProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Project Type & Languages */}
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          Type & Languages
        </div>
        {scanData.projectType && (
          <Badge variant="secondary" className="capitalize">
            {scanData.projectType}
          </Badge>
        )}
        {scanData.languages && scanData.languages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {scanData.languages.map((lang) => (
              <Badge key={lang} variant="outline" className="text-xs">
                {lang}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Sub-Projects */}
      {scanData.subProjects && scanData.subProjects.length > 0 && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            Sub-Projects ({scanData.subProjects.length})
          </div>
          <div className="space-y-2">
            {scanData.subProjects.map((sp) => (
              <div key={sp.path} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[11px]">{sp.path}/</code>
                  {sp.projectType && (
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {sp.projectType}
                    </Badge>
                  )}
                </div>
                {sp.languages && sp.languages.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {sp.languages.map((lang) => (
                      <Badge key={lang} variant="outline" className="text-[10px]">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Key Directories */}
      {scanData.keyDirectories && Object.keys(scanData.keyDirectories).length > 0 && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FolderTree className="h-4 w-4 text-muted-foreground" />
            Key Directories
          </div>
          <div className="space-y-1">
            {Object.entries(scanData.keyDirectories).map(([label, dir]) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground capitalize">{label}</span>
                <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[11px]">{dir}</code>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dependencies */}
      {scanData.dependencies && scanData.dependencies.length > 0 && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-muted-foreground" />
            Dependencies ({scanData.dependencies.length})
          </div>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {scanData.dependencies.slice(0, 30).map((dep) => (
              <Badge key={dep} variant="outline" className="text-[10px] font-mono">
                {dep}
              </Badge>
            ))}
            {scanData.dependencies.length > 30 && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                +{scanData.dependencies.length - 30} more
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Scripts */}
      {scanData.scripts && Object.keys(scanData.scripts).length > 0 && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            Scripts
          </div>
          <div className="space-y-1">
            {Object.entries(scanData.scripts).map(([name, cmd]) => (
              <div key={name} className="flex items-start gap-2 text-xs">
                <code className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-[11px] shrink-0">
                  {name}
                </code>
                <code className="text-muted-foreground font-mono text-[11px] truncate">{cmd}</code>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Formatting & Tooling */}
      {scanData.formatting && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            Formatting & Tooling
          </div>
          <div className="flex flex-wrap gap-1">
            {scanData.formatting.prettier && (
              <Badge variant="secondary" className="text-xs">
                Prettier
              </Badge>
            )}
            {scanData.formatting.eslint && (
              <Badge variant="secondary" className="text-xs">
                ESLint
              </Badge>
            )}
            {scanData.formatting.biome && (
              <Badge variant="secondary" className="text-xs">
                Biome
              </Badge>
            )}
            {scanData.formatting.editorconfig && (
              <Badge variant="secondary" className="text-xs">
                EditorConfig
              </Badge>
            )}
          </div>
          {scanData.packageManager && (
            <div className="text-xs text-muted-foreground">
              Package Manager: <span className="font-medium text-foreground">{scanData.packageManager}</span>
            </div>
          )}
          {scanData.cicd && (
            <div className="text-xs text-muted-foreground">
              CI/CD: <span className="font-medium text-foreground">{scanData.cicd}</span>
            </div>
          )}
          {scanData.monorepo && (
            <Badge variant="outline" className="text-xs">
              Monorepo
            </Badge>
          )}
        </Card>
      )}

      {/* Env Vars & Ports */}
      {((scanData.envVars && scanData.envVars.length > 0) || (scanData.ports && scanData.ports.length > 0)) && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            Environment
          </div>
          {scanData.ports && scanData.ports.length > 0 && (
            <div className="text-xs">
              <span className="text-muted-foreground">Ports:</span>{' '}
              {scanData.ports.map((p) => (
                <Badge key={p} variant="outline" className="text-[10px] font-mono ml-1">
                  {p}
                </Badge>
              ))}
            </div>
          )}
          {scanData.envVars && scanData.envVars.length > 0 && (
            <div>
              <span className="text-muted-foreground text-xs">Required env vars:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {scanData.envVars.map((v) => (
                  <code key={v} className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
                    {v}
                  </code>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
