import { createContext, useContext } from 'react';
import { BlockAttributes, BlockType, ContentBlock } from '../../../types';

export interface EditorContextType {
    selectedBlockId: string | null;
    setSelectedBlockId: (id: string | null) => void;
    updateBlock: (clientId: string, attributes: Partial<BlockAttributes>) => void;
    removeBlock: (clientId: string) => void;
    moveBlock: (clientId: string, direction: 'up' | 'down') => void;
    // Fix: Updated insertBlock signature to support optional atIndex parameter for targeted block insertion
    insertBlock: (type: BlockType, atIndex?: number) => void;
    setMediaPickerTarget: (target: { clientId: string, isCollection?: boolean } | null) => void;
    getBlock: (clientId: string) => ContentBlock | undefined;
}

export const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};