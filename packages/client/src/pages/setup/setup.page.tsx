// React / library
import { useNavigate } from 'react-router-dom';

// Components
import { ApiKeyStep } from '@/components/onboarding/ApiKeyStep';

export function SetupPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ApiKeyStep onContinue={() => navigate('/')} continueLabel="Continue to Atlas" />
    </div>
  );
}
