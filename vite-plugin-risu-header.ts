import type { Plugin } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Vite 플러그인: RisuAI 플러그인 헤더 자동 생성
 */
export function risuPluginHeader(): Plugin {
  return {
    name: 'vite-plugin-risu-header',
    apply: 'build',
    enforce: 'post',
    
    generateBundle: {
      order: 'post',
      handler(options, bundle) {
      // 번들된 JS 파일 찾기
      const jsFile = Object.keys(bundle).find(fileName => fileName.endsWith('.js'));
      
      if (!jsFile) return;
      
      const chunk = bundle[jsFile];
      if (chunk.type !== 'chunk') return;
      
      // plugin.ts 파일 읽기
      const pluginConfigPath = path.resolve(__dirname, 'src/plugin.ts');
      const pluginConfig = fs.readFileSync(pluginConfigPath, 'utf-8');
      
      // 헤더 생성
      const header = generateRisuHeader(pluginConfig);
      
      // 기존 코드 앞에 헤더 추가
      chunk.code = header + '\n' + chunk.code;
      }
    }
  };
}

/**
 * plugin.ts 내용을 파싱하여 RisuAI 헤더 생성
 */
function generateRisuHeader(pluginConfig: string): string {
  const lines: string[] = [];
  
  // PLUGIN_TITLE, PLUGIN_VERSION 추출
  const titleMatch = pluginConfig.match(/PLUGIN_TITLE\s*=\s*['"](.+?)['"]/);
  const versionMatch = pluginConfig.match(/PLUGIN_VERSION\s*=\s*['"](.+?)['"]/);
  
  const title = titleMatch ? titleMatch[1] : 'unnamed-plugin';
  const version = versionMatch ? versionMatch[1] : 'v1.0.0';
  
  // 플러그인 이름 (필수)
  lines.push(`//@name ${title}`);
  
  // 디스플레이 이름 (선택)
  lines.push(`//@display-name ${title}`);
  
  lines.push('//@api 3.0');
  lines.push(`//@version ${version.replace(/^v/, '')}`);

  // RISU_ARGS에서 인자 추출
  const argsMatch = pluginConfig.match(/const\s+RISU_ARGS[^{]*\{([\s\S]*?)\}/);
  if (argsMatch) {
    const argsContent = argsMatch[1];
    
    // [ARG1]: RisuArgType.String 형태 파싱
    const argPattern = /\[(\w+)\]\s*:\s*RisuArgType\.(\w+)/g;
    let match;
    
    while ((match = argPattern.exec(argsContent)) !== null) {
      const argNameVar = match[1]; // ARG1, ARG2 등
      const argType = match[2].toLowerCase(); // String -> string, Int -> int
      
      // 실제 ARG1, ARG2 변수의 값 찾기
      const argValueMatch = pluginConfig.match(new RegExp(`const\\s+${argNameVar}\\s*=\\s*['"](.+?)['"]`));
      const argValue = argValueMatch ? argValueMatch[1] : argNameVar.toLowerCase();
      
      lines.push(`//@arg ${argValue} ${argType}`);
    }
  }
  
  return lines.join('\n');
}

