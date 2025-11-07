import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { copyToClipboard } from '../utils/exportUtils'
import { getRelatedUseCases } from '../utils/searchUtils'
import './SearchResults.css'

function SearchResults({
  results,
  searchQuery,
  viewMode = 'expanded',
  allUseCases = [],
  onUseCaseClick
}) {
  const [expandedId, setExpandedId] = useState(null)
  const [copiedPromptId, setCopiedPromptId] = useState(null)
  const [copyFeedback, setCopyFeedback] = useState({})
  const [visibleCount, setVisibleCount] = useState(50)
  const { toggleFavorite, isFavorite } = useApp()

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleCopyPrompt = async (prompt, promptId) => {
    const success = await copyToClipboard(prompt)
    if (success) {
      setCopiedPromptId(promptId)
      setCopyFeedback({ [promptId]: true })
      setTimeout(() => {
        setCopiedPromptId(null)
        setCopyFeedback({ [promptId]: false })
      }, 2000)
    }
  }

  const handleFavoriteClick = (e, useCaseId) => {
    e.stopPropagation()
    toggleFavorite(useCaseId)
  }

  const handleUseCaseClick = (useCase) => {
    if (onUseCaseClick) {
      onUseCaseClick(useCase)
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleRelatedClick = (relatedUseCase) => {
    if (onUseCaseClick) {
      onUseCaseClick(relatedUseCase)
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const highlightText = (text, query) => {
    if (!text || !query) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index}>{part}</mark>
      ) : (
        part
      )
    )
  }

  const getRelatedForUseCase = (useCase) => {
    return getRelatedUseCases(useCase, allUseCases, 3)
  }

  return (
    <div className={`search-results ${viewMode}`}>
      <div className="results-count" role="status" aria-live="polite">
        About {results.length} result{results.length !== 1 ? 's' : ''}
      </div>

      <div className="results-list" role="list">
        {results.slice(0, visibleCount).map((result) => {
          const relatedUseCases = getRelatedForUseCase(result)
          const isExpanded = expandedId === result.id
          const isFav = isFavorite(result.id)

          return (
            <article
              key={result.id}
              className={`result-item ${viewMode}`}
              role="listitem"
              aria-labelledby={`result-title-${result.id}`}
            >
              {/* Header with Category and Actions */}
              <div className="result-header">
                <div className="result-breadcrumb">
                  {result.category && (
                    <span className="result-category">{result.category}</span>
                  )}
                  {result.subcategory && (
                    <span className="result-subcategory">
                      {' / '}{result.subcategory}
                    </span>
                  )}
                </div>

                <div className="result-actions">
                  <button
                    className={`action-button favorite-button ${isFav ? 'favorited' : ''}`}
                    onClick={(e) => handleFavoriteClick(e, result.id)}
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    aria-pressed={isFav}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill={isFav ? 'currentColor' : 'none'}
                      aria-hidden="true"
                    >
                      <path
                        d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Title - Clickable to navigate */}
              <h2
                id={`result-title-${result.id}`}
                className="result-title"
                onClick={() => handleUseCaseClick(result)}
                role="link"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleUseCaseClick(result)
                  }
                }}
              >
                {highlightText(result.title, searchQuery)}
              </h2>

              {/* Description */}
              <p className="result-description">
                {highlightText(result.description, searchQuery)}
              </p>

              {/* Metadata */}
              {viewMode === 'expanded' && (
                <div className="result-meta">
                  {result.copilot_surface && result.copilot_surface.length > 0 && (
                    <div className="meta-item">
                      <span className="meta-label">Surfaces:</span>
                      <div className="meta-tags">
                        {result.copilot_surface.map((surface, idx) => (
                          <span key={idx} className="tag surface-tag">
                            {surface}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.mode && result.mode.length > 0 && (
                    <div className="meta-item">
                      <span className="meta-label">Mode:</span>
                      <div className="meta-tags">
                        {result.mode.map((mode, idx) => (
                          <span key={idx} className="tag mode-tag">
                            {mode}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.risk_level && (
                    <div className="meta-item">
                      <span className="meta-label">Risk:</span>
                      <span className={`risk-badge risk-${result.risk_level}`}>
                        {result.risk_level}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Example Prompts with Copy Buttons */}
              {result.example_prompts && result.example_prompts.length > 0 && (
                <div className="result-prompts">
                  <button
                    className="expand-button"
                    onClick={() => toggleExpand(result.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`prompts-${result.id}`}
                  >
                    {isExpanded ? 'Hide' : 'Show'} Example Prompts
                    <svg
                      className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 6l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div id={`prompts-${result.id}`} className="prompts-list">
                      <div className="prompts-actions">
                        <button
                          className="copy-all-button"
                          onClick={() => {
                            const allText = (result.example_prompts || []).join('\n\n')
                            copyToClipboard(allText)
                          }}
                          aria-label="Copy all prompts"
                        >
                          Copy all
                        </button>
                      </div>
                      {result.example_prompts.map((prompt, idx) => {
                        const promptId = `${result.id}-prompt-${idx}`
                        const isCopied = copiedPromptId === promptId

                        return (
                          <div key={idx} className="prompt-item">
                            <span className="prompt-number">{idx + 1}.</span>
                            <div className="prompt-content">
                              <code className="prompt-text">{prompt}</code>
                              <button
                                className={`copy-prompt-button ${isCopied ? 'copied' : ''}`}
                                onClick={() => handleCopyPrompt(prompt, promptId)}
                                aria-label={isCopied ? 'Copied!' : 'Copy prompt'}
                                title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                              >
                                {isCopied ? (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M13.5 4.5l-7 7-3.5-3.5"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M11 1H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M5 13h8a2 2 0 0 0 2-2V5"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {viewMode === 'expanded' && result.tags && result.tags.length > 0 && (
                <div className="result-tags">
                  {result.tags.slice(0, 8).map((tag, idx) => (
                    <span key={idx} className="tag">
                      {tag}
                    </span>
                  ))}
                  {result.tags.length > 8 && (
                    <span className="tag more-tags">+{result.tags.length - 8} more</span>
                  )}
                </div>
              )}

              {/* Related Use Cases */}
              {viewMode === 'expanded' && relatedUseCases.length > 0 && (
                <div className="related-use-cases">
                  <h3 className="related-title">Related Use Cases</h3>
                  <div className="related-list">
                    {relatedUseCases.map((related) => (
                      <div
                        key={related.id}
                        className="related-item"
                        onClick={() => handleRelatedClick(related)}
                        role="link"
                        tabIndex={0}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleRelatedClick(related)
                          }
                        }}
                      >
                        <div className="related-header">
                          {related.category && (
                            <span className="related-category">{related.category}</span>
                          )}
                        </div>
                        <div className="related-title-text">{related.title}</div>
                        {related.copilot_surface && related.copilot_surface.length > 0 && (
                          <div className="related-surfaces">
                            {related.copilot_surface.slice(0, 2).map((surface, idx) => (
                              <span key={idx} className="tag surface-tag small">
                                {surface}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
      {results.length > visibleCount && (
        <div className="load-more-container">
          <button className="load-more-button" onClick={() => setVisibleCount(prev => prev + 50)}>
            Load more ({results.length - visibleCount} more)
          </button>
        </div>
      )}
    </div>
  )
}

export default SearchResults
