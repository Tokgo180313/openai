// src/utils/prismConfig.ts
import Prism from "prismjs";
import "prismjs/components/prism-core";

// ========== PrismJS 语言支持 ==========
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-dart";

// ========== PrismJS 插件 ==========
import "prismjs/plugins/toolbar/prism-toolbar";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import "prismjs/plugins/line-highlight/prism-line-highlight";
import "prismjs/plugins/command-line/prism-command-line";
import "prismjs/plugins/show-language/prism-show-language";
import "prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard";

// ========== 样式导入 ==========
import "prismjs/themes/prism-tomorrow.css"; // 主题
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/command-line/prism-command-line.css";
import "prismjs/plugins/toolbar/prism-toolbar.css";
import "katex/dist/katex.min.css"; // 数学公式样式

export default Prism;
