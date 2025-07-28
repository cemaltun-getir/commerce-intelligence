'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { StyleProvider, createCache, extractStyle } from '@ant-design/cssinjs';
import { useRef } from 'react';

export default function AntdCompatProvider({ children }: { children: React.ReactNode }) {
  const cache = useRef(createCache());
  
  useServerInsertedHTML(() => {
    return (
      <style
        id="antd"
        dangerouslySetInnerHTML={{
          __html: extractStyle(cache.current, true),
        }}
      />
    );
  });

  return (
    <StyleProvider cache={cache.current}>
      {children}
    </StyleProvider>
  );
} 