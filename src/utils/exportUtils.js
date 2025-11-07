// Export utilities for different formats

// Export as Markdown
export const exportAsMarkdown = (results, query = '') => {
  let markdown = `# GitHub Copilot Use Cases\n\n`

  if (query) {
    markdown += `Search query: **${query}**\n\n`
  }

  markdown += `Total results: ${results.length}\n\n`
  markdown += `Generated on: ${new Date().toLocaleString()}\n\n`
  markdown += `---\n\n`

  results.forEach((result, index) => {
    markdown += `## ${index + 1}. ${result.title}\n\n`

    if (result.category) {
      markdown += `**Category:** ${result.category}`
      if (result.subcategory) {
        markdown += ` > ${result.subcategory}`
      }
      markdown += `\n\n`
    }

    markdown += `**Description:** ${result.description}\n\n`

    if (result.copilot_surface && result.copilot_surface.length > 0) {
      markdown += `**Surfaces:** ${result.copilot_surface.join(', ')}\n\n`
    }

    if (result.mode && result.mode.length > 0) {
      markdown += `**Modes:** ${result.mode.join(', ')}\n\n`
    }

    if (result.risk_level) {
      markdown += `**Risk Level:** ${result.risk_level}\n\n`
    }

    if (result.example_prompts && result.example_prompts.length > 0) {
      markdown += `**Example Prompts:**\n\n`
      result.example_prompts.forEach((prompt, i) => {
        markdown += `${i + 1}. \`${prompt}\`\n`
      })
      markdown += `\n`
    }

    if (result.tags && result.tags.length > 0) {
      markdown += `**Tags:** ${result.tags.join(', ')}\n\n`
    }

    markdown += `---\n\n`
  })

  return markdown
}

// Export as JSON
export const exportAsJSON = (results) => {
  return JSON.stringify(results, null, 2)
}

// Export as CSV
export const exportAsCSV = (results) => {
  const headers = ['ID', 'Title', 'Category', 'Subcategory', 'Description', 'Surfaces', 'Modes', 'Risk Level', 'Tags']
  const rows = results.map(result => [
    result.id || '',
    result.title || '',
    result.category || '',
    result.subcategory || '',
    result.description || '',
    result.copilot_surface ? result.copilot_surface.join('; ') : '',
    result.mode ? result.mode.join('; ') : '',
    result.risk_level || '',
    result.tags ? result.tags.join('; ') : ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return csvContent
}

// Download file helper
export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export functions with download
export const exportResults = (results, format = 'markdown', query = '') => {
  const timestamp = new Date().toISOString().split('T')[0]
  let content, filename, mimeType

  switch (format) {
    case 'markdown':
      content = exportAsMarkdown(results, query)
      filename = `copilot-use-cases-${timestamp}.md`
      mimeType = 'text/markdown'
      break

    case 'json':
      content = exportAsJSON(results)
      filename = `copilot-use-cases-${timestamp}.json`
      mimeType = 'application/json'
      break

    case 'csv':
      content = exportAsCSV(results)
      filename = `copilot-use-cases-${timestamp}.csv`
      mimeType = 'text/csv'
      break

    default:
      throw new Error(`Unsupported export format: ${format}`)
  }

  downloadFile(content, filename, mimeType)
  return { filename, size: content.length }
}

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (err) {
      console.error('Failed to copy:', err)
      document.body.removeChild(textArea)
      return false
    }
  }
}

export default {
  exportAsMarkdown,
  exportAsJSON,
  exportAsCSV,
  exportResults,
  copyToClipboard
}
