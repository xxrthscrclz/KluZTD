import { createLowlight } from 'lowlight';

import bash from 'highlight.js/lib/languages/bash';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import sql from 'highlight.js/lib/languages/sql';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import java from 'highlight.js/lib/languages/java';
import kotlin from 'highlight.js/lib/languages/kotlin';
import goLang from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import cLang from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import swift from 'highlight.js/lib/languages/swift';
import markdown from 'highlight.js/lib/languages/markdown';
import diff from 'highlight.js/lib/languages/diff';
import ini from 'highlight.js/lib/languages/ini';
import plaintext from 'highlight.js/lib/languages/plaintext';

/** 코드 블록에서 고를 수 있는 언어만 넣는다 (common 전체보다 훨씬 가볍다) */
export const lowlight = createLowlight({ bash: bash, javascript: javascript, typescript: typescript, python: python, json: json, yaml: yaml, sql: sql, xml: xml, css: css, java: java, kotlin: kotlin, go: goLang, rust: rust, c: cLang, cpp: cpp, csharp: csharp, php: php, ruby: ruby, swift: swift, markdown: markdown, diff: diff, ini: ini, plaintext: plaintext });

// 자주 쓰는 별칭
lowlight.registerAlias({ javascript: ['js', 'jsx'], typescript: ['ts', 'tsx'], bash: ['sh', 'shell', 'zsh'], xml: ['html'], yaml: ['yml'], python: ['py'] });
