import { useState } from 'react'
import WebView from 'react-native-webview'

const buildHtml = (content: string, bg: string) => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background-color: ${bg};
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 15px;
      line-height: 1.7;
      word-break: break-word;
    }
    p { margin-bottom: 0.65em; }
    p:last-child { margin-bottom: 0; }
    h1, h2, h3, h4 { font-weight: 600; margin-bottom: 0.45em; margin-top: 0.8em; }
    h1:first-child, h2:first-child, h3:first-child { margin-top: 0; }
    h1 { font-size: 1.35em; }
    h2 { font-size: 1.15em; }
    h3 { font-size: 1.0em; }
    strong, b { font-weight: 600; }
    em, i { font-style: italic; }
    u { text-decoration: underline; }
    s { text-decoration: line-through; color: #888888; }
    a { color: #8FF363; text-decoration: none; }
    ul, ol { padding-left: 1.4em; margin-bottom: 0.65em; }
    ul:last-child, ol:last-child { margin-bottom: 0; }
    li { margin-bottom: 0.2em; }
    blockquote {
      border-left: 3px solid #1A1A1A;
      padding-left: 0.9em;
      color: #888888;
      margin-bottom: 0.65em;
      font-style: italic;
    }
    code {
      background: #1A1A1A;
      color: #8FF363;
      padding: 0.1em 0.35em;
      border-radius: 4px;
      font-size: 0.88em;
      font-family: 'Courier New', monospace;
    }
    pre {
      background: #1A1A1A;
      padding: 0.8em 1em;
      border-radius: 8px;
      margin-bottom: 0.65em;
      overflow-x: auto;
    }
    pre code {
      background: transparent;
      padding: 0;
      border-radius: 0;
      color: #FFFFFF;
    }
    hr {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.08);
      margin: 0.75em 0;
    }
  </style>
</head>
<body>
  ${content}
  <script>
    function reportHeight() {
      var h = document.body.scrollHeight;
      window.ReactNativeWebView.postMessage(String(h));
    }
    reportHeight();
    var ro = new ResizeObserver(reportHeight);
    ro.observe(document.body);
  </script>
</body>
</html>`

interface Props {
  html: string
  backgroundColor?: string
}

export function RichTextRenderer({ html, backgroundColor = '#111111' }: Props) {
  const [height, setHeight] = useState(0)

  if (!html || html === '<p></p>' || html.trim() === '') return null

  return (
    <WebView
      source={{ html: buildHtml(html, backgroundColor) }}
      style={{ height: height || undefined, minHeight: 20, backgroundColor: 'transparent' }}
      scrollEnabled={false}
      onMessage={(e) => {
        const h = parseInt(e.nativeEvent.data, 10)
        if (!isNaN(h) && h > 0) setHeight(h)
      }}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      nestedScrollEnabled={false}
      androidLayerType="hardware"
    />
  )
}
