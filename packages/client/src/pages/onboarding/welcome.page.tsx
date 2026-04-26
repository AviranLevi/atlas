// React / library
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { AtlasLogo } from '@/components/icons/AtlasLogo.icon';
import { ApiKeyStep } from '@/components/onboarding/ApiKeyStep';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { ProjectCreateBody } from '@/components/projects/ProjectCreateBody';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/auth.context';

const STEPS = [
  { id: 'auth', label: 'API key' },
  { id: 'project', label: 'First project' },
  { id: 'done', label: 'Done' },
];

export function WelcomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { setActiveProjectId } = useActiveProject();
  const [step, setStep] = useState<number>(isAuthenticated ? 1 : 0);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AtlasLogo className="h-6 w-6 text-primary" aria-hidden />
            <span className="font-semibold tracking-tight">Atlas</span>
          </div>
          <StepIndicator steps={STEPS} currentIndex={step} />
        </div>

        <div aria-live="polite" className="sr-only">
          Step {step + 1} of {STEPS.length}: {STEPS[step].label}
        </div>

        {step === 0 && <ApiKeyStep onContinue={() => setStep(1)} continueLabel="Next: pick a project" />}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Set up your first project</CardTitle>
              <CardDescription>
                Atlas anchors all tasks, agents, and knowledge to a project. Create a fresh folder or pick one that
                already exists on disk.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectCreateBody
                hideCancel
                onCreated={(p) => {
                  setActiveProjectId(p.id);
                  setCreatedProjectId(p.id);
                  setStep(2);
                }}
              />
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>You're all set</CardTitle>
              <CardDescription>
                Your project is ready. Add an agent and your first task next, or jump straight into the workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button onClick={() => navigate(createdProjectId ? `/projects/${createdProjectId}` : '/projects')}>
                Open project workspace
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/agents')}>
                Add an agent
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
