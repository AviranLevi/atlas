// Components
import { MarkdownContent } from '@/components/ui/markdown-content';

type NarrativeBlockProps = {
  content: string;
};

export function NarrativeBlock({ content }: NarrativeBlockProps) {
  return (
    <div className="py-1">
      <MarkdownContent content={content} />
    </div>
  );
}
