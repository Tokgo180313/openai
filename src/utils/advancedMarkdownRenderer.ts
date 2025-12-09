import MarkdownIt from "markdown-it"
import markdownItHighlightjs from 'markdown-it-highlightjs';

const md = new MarkdownIt({
    html:true,
    linkify:true,
    typographer:true,
    breaks:true,
    highlight:function(str:string,lang:string){
        if(lang&& markdownItHighlightjs.getLanguage(lang)){
            try {
                return markdownItHighlightjs.highlight(str,{language:lang}).value;
            } catch (__) {
                
            }
        }
        return '';
    }
})

md.use(function(md){
    const defaultRender = md.renderer.rules.link_open || function(tokens,idx,options,env,self){
        return self.rederToken(tokens,idx,options)
    };

    md.renderer.rules.link_open = function(tokens,idx,options,env,self){
        const token = tokens[idx];
        const hrefIndex = token.attrIndex("href");
        if(hrefIndex >= 0){
            const href = token.attrs[hrefIndex][1];
            if(href.startsWith('http')){
                token.attrPush(['target','_blank'])
                token.attrPush(['rel','noopener noreferrer'])
            }
        }
        return defaultRender(tokens,idx,options,env,self)
    }
})

export const advancedMarkdownRenderer = md;