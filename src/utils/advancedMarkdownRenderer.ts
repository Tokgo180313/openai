import MarkdownIt from "markdown-it"
import markdownItHighlightjs from 'markdown-it-highlightjs';

const md = new MarkdownIt({
    html:true,
    linkify:true,
    typographer:true,
    breaks:true,
    highlight:function(str:string,lang:string){
        const hl = markdownItHighlightjs as typeof markdownItHighlightjs & {
            getLanguage?: (lang: string) => boolean;
            highlight?: (str: string, opts: { language: string }) => { value: string };
        };
        if(lang && hl.getLanguage?.(lang)){
            try {
                return hl.highlight!(str,{language:lang}).value;
            } catch (__) {
                
            }
        }
        return '';
    }
})

md.use(function(md){
    const defaultRender = md.renderer.rules.link_open || function(tokens,idx,options,env,self){
        return self.renderToken(tokens, idx, options)
    };

    md.renderer.rules.link_open = function(tokens,idx,options,env,self){
        const token = tokens[idx];
        const hrefIndex = token.attrIndex("href");
        if(hrefIndex >= 0){
            const href = token.attrs![hrefIndex][1];
            if(href.startsWith('http')){
                token.attrPush(['target','_blank'])
                token.attrPush(['rel','noopener noreferrer'])
            }
        }
        return defaultRender(tokens,idx,options,env,self)
    }
})

export const advancedMarkdownRenderer = md;