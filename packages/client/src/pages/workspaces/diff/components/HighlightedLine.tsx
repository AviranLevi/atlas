// React / library
import { memo, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

type HighlightedLineProps = {
  content: string;
  language?: string;
};

type StyleSheet = Record<string, React.CSSProperties>;

function useIsDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

/** Strips background/backgroundColor from every entry in a Prism style object. */
function stripBackgrounds(theme: StyleSheet): StyleSheet {
  const stripped: StyleSheet = {};
  for (const [key, value] of Object.entries(theme)) {
    const { background, backgroundColor, ...rest } = value as React.CSSProperties & Record<string, unknown>;
    stripped[key] = rest as React.CSSProperties;
  }
  return stripped;
}

const darkTheme = stripBackgrounds(oneDark as unknown as StyleSheet);
const lightTheme = stripBackgrounds(oneLight as unknown as StyleSheet);

const INLINE_STYLE: React.CSSProperties = {
  background: 'transparent',
  margin: 0,
  padding: 0,
  display: 'inline',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  fontFamily: 'inherit',
};

const CODE_TAG_STYLE: React.CSSProperties = { background: 'transparent' };

/** Renders a single line of code with syntax highlighting. Falls back to plain text for unknown languages. */
export const HighlightedLine = memo(function HighlightedLine({ content, language }: HighlightedLineProps) {
  const isDark = useIsDark();
  const theme = isDark ? darkTheme : lightTheme;

  if (!language || !content) return <>{content}</>;

  return (
    <SyntaxHighlighter
      language={language}
      style={theme}
      customStyle={INLINE_STYLE}
      codeTagProps={{ style: CODE_TAG_STYLE }}
      PreTag="span"
      CodeTag="span"
      useInlineStyles
    >
      {content}
    </SyntaxHighlighter>
  );
});
