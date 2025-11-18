import React from 'react';
import EyeIcon from './icons/EyeIcon';

interface PromptInputProps {
  projectGoal: string;
  setProjectGoal: (goal: string) => void;
  onStart: () => void;
  onReset: () => void;
  onPreview: () => void;
  isGenerating: boolean;
  isComplete: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({
  projectGoal,
  setProjectGoal,
  onStart,
  onReset,
  onPreview,
  isGenerating,
  isComplete,
}) => {
  const handlePrimaryAction = () => {
    if (isComplete) {
      onPreview();
    } else {
      onStart();
    }
  };

  const primaryButtonText = isGenerating
    ? 'Generating...'
    : isComplete
      ? 'Preview Application'
      : 'Start Generation';

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col gap-4">
      <label htmlFor="project-goal" className="font-bold text-sky-400">
        1. Define Your Project Goal
      </label>
      <textarea
        id="project-goal"
        value={projectGoal}
        onChange={e => setProjectGoal(e.target.value)}
        placeholder="e.g., A web app for tracking personal fitness goals with data visualization..."
        className="w-full h-32 p-2 bg-slate-700/50 rounded-md border border-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none transition-colors"
        disabled={isGenerating}
      />
      <div className="flex gap-2">
        <button
          onClick={handlePrimaryAction}
          disabled={isGenerating || (!isComplete && !projectGoal.trim())}
          className="flex-grow bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isComplete && <EyeIcon className="w-5 h-5" />}
          {primaryButtonText}
        </button>
        <button
          onClick={onReset}
          className="bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500 disabled:bg-slate-700 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default PromptInput;
