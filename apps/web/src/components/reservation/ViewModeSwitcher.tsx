import React from 'react';
import { LayoutGrid, Table, Columns } from 'lucide-react';

export type ViewMode = 'card' | 'table' | 'split';

interface ViewModeSwitcherProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ViewModeSwitcher({ viewMode, onViewModeChange }: ViewModeSwitcherProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('card')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
          viewMode === 'card'
            ? 'bg-white shadow text-blue-600'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        title="카드 뷰 (Ctrl+1)"
      >
        <LayoutGrid className="h-5 w-5" />
        <span className="text-sm font-medium">카드</span>
      </button>

      <button
        onClick={() => onViewModeChange('table')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
          viewMode === 'table'
            ? 'bg-white shadow text-blue-600'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        title="테이블 뷰 (Ctrl+2)"
      >
        <Table className="h-5 w-5" />
        <span className="text-sm font-medium">테이블</span>
      </button>

      <button
        onClick={() => onViewModeChange('split')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
          viewMode === 'split'
            ? 'bg-white shadow text-blue-600'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        title="스플릿 뷰 (Ctrl+3)"
      >
        <Columns className="h-5 w-5" />
        <span className="text-sm font-medium">스플릿</span>
      </button>
    </div>
  );
}
