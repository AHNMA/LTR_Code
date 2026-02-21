
import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Post, PostSection } from '../types';
import { syncService } from '../services/sync';

interface PostContextType {
  posts: Post[];
  getPostsBySection: (section: PostSection) => Post[];
  addPost: (post: Post) => void;
  updatePost: (post: Post) => void;
  deletePost: (id: string) => void;
  getPost: (id: string) => Post | undefined;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [postVersion, setPostVersion] = useState(0);
  const forceUpdate = () => setPostVersion(v => v + 1);

  // postVersion as dependency ensures hook re-runs when we manually trigger it
  const posts = useLiveQuery(() => db.posts.toArray(), [postVersion]) || [];

  const getPostsBySection = (section: PostSection) => {
    // Only return published posts for the frontend sections
    return posts.filter(post => {
        if (post.status !== 'published') return false;
        
        // Handle both new array format and legacy string format
        if (Array.isArray(post.section)) {
            return post.section.includes(section);
        } else {
            return post.section === section;
        }
    });
  };

  const addPost = async (post: Post) => {
    await db.posts.add(post);
    forceUpdate();
    syncService.autoPush();
  };

  const updatePost = async (updatedPost: Post) => {
    await db.posts.put(updatedPost);
    forceUpdate();
    syncService.autoPush();
  };

  const deletePost = async (id: string) => {
    await db.posts.delete(id);
    forceUpdate();
    syncService.autoPush();
  };

  const getPost = (id: string) => {
    return posts.find(p => p.id === id);
  };

  return (
    <PostContext.Provider value={{ posts, getPostsBySection, addPost, updatePost, deletePost, getPost }}>
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostContext);
  if (context === undefined) throw new Error('usePosts must be used within a PostProvider');
  return context;
};
