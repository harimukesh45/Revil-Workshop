import React, { useState } from 'react';
import { Play } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { rust } from '@codemirror/lang-rust';
import { oneDark } from '@codemirror/theme-one-dark';
import { motion } from 'framer-motion';

const languageExtensions = {
  javascript: javascript(),
  python: python(),
  cpp: cpp(),
  c: cpp(),
  java: java(),
  rust: rust(),
  ruby: null, // CodeMirror doesn't have a built-in Ruby mode
};

const supportedLanguages = {
  javascript: 'javascript',
  python: 'python',
  cpp: 'cpp',
  c: 'c',
  java: 'java',
  rust: 'rust',
  ruby: 'ruby',
};

const CodeEditor = ({ code, onChange, onResult, isDisabled }) => {
  const [language, setLanguage] = useState('javascript');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleRunCode = async () => {
    if (isDisabled) return;
    setIsExecuting(true);
    try {
      const result = await executeCode(code, language);
      onResult(result);
    } catch (error) {
      onResult({
        success: false,
        output: null,
        error: 'Execution failed: ' + error.message,
      });
    }
    setIsExecuting(false);
  };

  const executeCode = async (code, language) => {
    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: supportedLanguages[language],
          version: '*', // Auto-select latest version
          source: code,
        }),
      });

      if (!response.ok) throw new Error(`API responded with status ${response.status}`);

      const data = await response.json();
      return {
        success: response.ok,
        output: data?.run?.output || '',
        error: data?.run?.stderr || (response.ok ? null : 'Unknown execution error'),
      };
    } catch (error) {
      return { success: false, output: null, error: `Execution request failed: ${error.message}` };
    }
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="bg-gray-900 p-4 rounded-lg h-[400px] flex flex-col"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="text-cyan-400 font-medium text-base">{'</>'} Code </div>
          <select
            className="bg-gray-800 text-cyan-400 p-1 rounded"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isDisabled}
          >
            {Object.keys(supportedLanguages).map((lang) => (
              <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
            ))}
          </select>
        </div>
        
        <motion.div 
          className="flex-1 overflow-auto mirror-scrollbar rounded-md my-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CodeMirror
            value={code}
            extensions={languageExtensions[language] ? [languageExtensions[language]] : []}
            theme={oneDark}
            onChange={(value) => onChange(value)}
            basicSetup={{ lineNumbers: true }}
            className="h-full w-full"
          />
        </motion.div>
      </motion.div>

      <div className="flex justify-end">
        <motion.button
          onClick={handleRunCode}
          disabled={isExecuting || isDisabled}
          className={`bg-cyan-400 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 
            ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}
            ${isDisabled ? 'bg-gray-600 cursor-not-allowed text-cyan-400' : 'hover:bg-cyan-500'}`}
          whileTap={{ scale: 0.95 }}
        >
          <Play size={16} />
          {isExecuting ? 'Running...' : 'Run Code'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CodeEditor;
