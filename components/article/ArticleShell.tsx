import React, { ReactNode } from 'react';
import { DataProvider } from '../../contexts/DataContext';
import { NavigationProvider } from '../../contexts/NavigationContext';
import { ViewModeProvider } from '../../contexts/ViewModeContext';
import { PostProvider } from '../../contexts/PostContext';

interface ArticleShellProps {
  children: ReactNode;
  className?: string;
  /** If true, do not create an internal NavigationProvider (use outer one) */
  skipNavigation?: boolean;
  skipData?: boolean;
  skipPost?: boolean;
  skipViewMode?: boolean;
}

const ArticleShell: React.FC<ArticleShellProps> = ({ children, className = '', skipNavigation = false, skipData = false, skipPost = false, skipViewMode = false }) => {
  const Inner = (
    <div className={`min-h-screen bg-black text-white ${className}`}>
      {children}
    </div>
  );

  const withViewMode = skipViewMode ? Inner : <ViewModeProvider>{Inner}</ViewModeProvider>;
  const withNavigation = skipNavigation ? withViewMode : <NavigationProvider>{withViewMode}</NavigationProvider>;
  const withPost = skipPost ? withNavigation : <PostProvider>{withNavigation}</PostProvider>;
  const withData = skipData ? withPost : <DataProvider>{withPost}</DataProvider>;

  return withData;
};

export default ArticleShell;
