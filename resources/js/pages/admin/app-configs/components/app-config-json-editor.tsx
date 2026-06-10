import { json } from '@codemirror/lang-json';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror from '@uiw/react-codemirror';
import { useTheme } from 'next-themes';

type Props = {
    value: string;
    onChange: (value: string) => void;
    height?: string;
    readOnly?: boolean;
};

export function AppConfigJsonEditor({
    value,
    onChange,
    height = '240px',
    readOnly = false,
}: Props) {
    const { resolvedTheme } = useTheme();
    const editorTheme = resolvedTheme === 'dark' ? githubDark : githubLight;

    return (
        <div className="overflow-hidden rounded-md border bg-background">
            <CodeMirror
                value={value}
                height={height}
                theme={editorTheme}
                extensions={[json()]}
                editable={!readOnly}
                onChange={onChange}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                }}
            />
        </div>
    );
}
