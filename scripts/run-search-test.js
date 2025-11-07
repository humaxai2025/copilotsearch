import { performSearch, performFuzzySearch, clearSearchCache } from '../src/utils/searchUtils.js'

const useCases = [
  { id: '1', title: 'Code generation', description: 'Generate code', category: 'development', tags: ['code','generation'], example_prompts: ['Write a function to add two numbers'] },
  { id: '2', title: 'Testing', description: 'Create tests', category: 'quality', tags: ['test','unit'], example_prompts: ['Generate unit tests for this function'] },
  { id: '3', title: 'Documentation', description: 'Write docs', category: 'docs', tags: ['docs','documentation'], example_prompts: ['Write README for project'] }
]

console.log('Running search tests...')

// Basic search
let r = performSearch(useCases, 'code', {}, 'relevance')
console.log('Search for "code" results:', r.map(x => x.id))

// Cached search
clearSearchCache()
r = performSearch(useCases, 'code', {}, 'relevance')
console.log('After clearing cache, search for "code":', r.map(x => x.id))

// Fuzzy search
const f = performFuzzySearch(useCases, 'doc')
console.log('Fuzzy search for "doc":', f.map(x => x.id))

console.log('All tests finished.')
