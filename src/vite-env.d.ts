/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module "prismjs";

declare module "markdown-it-highlightjs" {
  import type MarkdownIt from "markdown-it";
  function highlightjs(md: MarkdownIt): MarkdownIt;
  namespace highlightjs {
    function getLanguage(lang: string): boolean;
    function highlight(
      str: string,
      options: { language: string },
    ): { value: string };
  }
  export default highlightjs;
}

import "vue-router";

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    roles?: string[];
  }
}
