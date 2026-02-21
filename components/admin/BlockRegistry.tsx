
import React from 'react';
import { BlockType } from '../../types';
import * as YouTubeBlock from './blocks/YouTubeBlock';
import * as GalleryBlock from './blocks/GalleryBlock';
import * as SliderBlock from './blocks/SliderBlock';
import * as ImageBlock from './blocks/ImageBlock';
import * as ParagraphBlock from './blocks/ParagraphBlock';
import * as HeadingBlock from './blocks/HeadingBlock';
import * as ListBlock from './blocks/ListBlock';
import * as QuoteBlock from './blocks/QuoteBlock';
import * as DetailsBlock from './blocks/DetailsBlock';
import * as TableBlock from './blocks/TableBlock';
import * as SeparatorBlock from './blocks/SeparatorBlock';
import * as CommentBlock from './blocks/CommentBlock';
import * as SpotifyBlock from './blocks/SpotifyBlock';
import * as DriverBlock from './blocks/DriverBlock';
import * as TeamBlock from './blocks/TeamBlock';
import * as EventBlock from './blocks/EventBlock';
import * as CalendarBlock from './blocks/CalendarBlock';
import * as StandingsBlock from './blocks/StandingsBlock';
import * as ResultsBlock from './blocks/ResultsBlock';
import * as TitleWatchBlock from './blocks/TitleWatchBlock';

// --- Registry Interface ---
interface BlockModule {
    Editor: React.FC<any>;
    Inspector?: React.FC<any>;
    defaultAttributes: Record<string, any>;
}

export const BlockRegistry: Record<string, BlockModule> = {
    'custom/youtube': {
        Editor: YouTubeBlock.YouTubeEditor,
        Inspector: YouTubeBlock.YouTubeInspector,
        defaultAttributes: YouTubeBlock.defaultAttributes
    },
    'custom/gallery': {
        Editor: GalleryBlock.GalleryEditor,
        Inspector: GalleryBlock.GalleryInspector,
        defaultAttributes: GalleryBlock.defaultAttributes
    },
    'custom/image': {
        Editor: ImageBlock.ImageEditor,
        Inspector: ImageBlock.ImageInspector,
        defaultAttributes: ImageBlock.defaultAttributes
    },
    
    // Text Group
    'custom/paragraph': { 
        Editor: ParagraphBlock.ParagraphEditor, 
        Inspector: ParagraphBlock.ParagraphInspector, 
        defaultAttributes: ParagraphBlock.paragraphDefaults 
    },
    'custom/heading': { 
        Editor: HeadingBlock.HeadingEditor, 
        Inspector: HeadingBlock.HeadingInspector,
        defaultAttributes: HeadingBlock.headingDefaults 
    },
    'custom/list': { 
        Editor: ListBlock.ListEditor, 
        Inspector: ListBlock.ListInspector, 
        defaultAttributes: ListBlock.listDefaults 
    },
    'custom/quote': { 
        Editor: QuoteBlock.QuoteEditor, 
        Inspector: QuoteBlock.QuoteInspector, 
        defaultAttributes: QuoteBlock.quoteDefaults 
    },
    
    // Structure Group
    'custom/details': { Editor: DetailsBlock.DetailsEditor, Inspector: DetailsBlock.DetailsInspector, defaultAttributes: DetailsBlock.detailsDefaults },
    'custom/table': { Editor: TableBlock.TableEditor, Inspector: TableBlock.TableInspector, defaultAttributes: TableBlock.tableDefaults },
    'custom/separator': { Editor: SeparatorBlock.SeparatorEditor, Inspector: SeparatorBlock.SeparatorInspector, defaultAttributes: { style: 'tech' } },
    'custom/comment': { Editor: CommentBlock.CommentEditor, Inspector: CommentBlock.CommentInspector, defaultAttributes: CommentBlock.defaultAttributes },
    'custom/spotify': { Editor: SpotifyBlock.SpotifyEditor, Inspector: SpotifyBlock.SpotifyInspector, defaultAttributes: { url: '', blockSize: 'medium', align: 'center' } },
    'custom/slider': { Editor: SliderBlock.SliderEditor, Inspector: SliderBlock.SliderInspector, defaultAttributes: SliderBlock.sliderDefaults },

    // F1 Group
    'f1/driver': { Editor: DriverBlock.DriverEditor, Inspector: DriverBlock.DriverInspector, defaultAttributes: { id: '', mode: 'full', blockSize: 'medium', align: 'center', style: 'card' } },
    'f1/team': { Editor: TeamBlock.TeamEditor, Inspector: TeamBlock.TeamInspector, defaultAttributes: { id: '', mode: 'full', blockSize: 'medium', align: 'center', style: 'card' } },
    'f1/event': { Editor: EventBlock.EventEditor, Inspector: EventBlock.EventInspector, defaultAttributes: { id: '', mode: 'full', blockSize: 'medium', align: 'center', style: 'card' } },
    'f1/calendar': { Editor: CalendarBlock.CalendarEditor, Inspector: CalendarBlock.CalendarInspector, defaultAttributes: { limit: 3, style: 'card', blockSize: 'medium', align: 'center' } },
    'f1/standings': { Editor: StandingsBlock.StandingsEditor, Inspector: StandingsBlock.StandingsInspector, defaultAttributes: { type: 'drivers', style: 'card', blockSize: 'medium', align: 'center' } },
    'f1/results': { Editor: ResultsBlock.ResultsEditor, Inspector: ResultsBlock.ResultsInspector, defaultAttributes: { id: '', sessionId: 'race', mode: 'full' } },
    'f1/title-watch': { Editor: TitleWatchBlock.TitleWatchEditor, Inspector: TitleWatchBlock.TitleWatchInspector, defaultAttributes: { type: 'drivers', style: 'card', blockSize: 'medium', align: 'center' } },
};

export const getBlockModule = (type: BlockType): BlockModule | undefined => {
    return BlockRegistry[type];
};
