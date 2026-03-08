/**
 * Simple Markdown Renderer
 *
 * Renders basic markdown to React elements.
 * Supports: headers, bold, lists, paragraphs, line breaks
 */

interface MarkdownProps {
  content: string
}

export function Markdown({ content }: MarkdownProps) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines unless we're closing a list
    if (!trimmed) {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-white/80">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        )
        listItems = []
      }
      continue
    }

    // Headers
    if (trimmed.startsWith('##')) {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-white/80">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        )
        listItems = []
      }

      const level = trimmed.match(/^#+/)?.[0].length || 2
      const text = trimmed.replace(/^#+\s+/, '')

      if (level === 2) {
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-2xl font-bold text-white mb-4 mt-6">
            {renderInlineMarkdown(text)}
          </h2>
        )
      } else if (level === 3) {
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-xl font-bold text-white mb-3 mt-4">
            {renderInlineMarkdown(text)}
          </h3>
        )
      }
      continue
    }

    // Lists
    if (trimmed.startsWith('-')) {
      const item = trimmed.replace(/^-\s+/, '')
      listItems.push(item)
      continue
    }

    // Regular paragraphs
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-white/80">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      )
      listItems = []
    }

    elements.push(
      <p key={`p-${elements.length}`} className="text-white/80 mb-4">
        {renderInlineMarkdown(trimmed)}
      </p>
    )
  }

  // Close any remaining list
  if (listItems.length > 0) {
    elements.push(
      <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-1">
        {listItems.map((item, idx) => (
          <li key={idx} className="text-white/80">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ul>
    )
  }

  return <>{elements}</>
}

/**
 * Parse inline markdown (bold, italics)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  // Match **bold** and ***bold-italic***
  const regex = /\*{2,3}([^\*]+)\*{2,3}/g
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    const isBold = match[0].startsWith('**')
    const content = match[1]

    if (isBold) {
      parts.push(
        <strong key={`bold-${parts.length}`} className="font-semibold text-white">
          {content}
        </strong>
      )
    } else {
      parts.push(
        <em key={`italic-${parts.length}`} className="italic text-white/90">
          {content}
        </em>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : text
}
