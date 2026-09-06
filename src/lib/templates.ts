import type { ColumnSeed, TemplateName } from './types'

interface TemplateDefinition {
  name: TemplateName
  label: string
  columns: ColumnSeed[]
}

const TEMPLATES: TemplateDefinition[] = [
  {
    name: 'positive-negative',
    label: 'Positive / Negative',
    columns: [
      { title: 'Positive', color: 'green' },
      { title: 'Negative', color: 'red' },
    ],
  },
  {
    name: 'start-stop-continue',
    label: 'Start / Stop / Continue',
    columns: [
      { title: 'Start', color: 'green' },
      { title: 'Stop', color: 'red' },
      { title: 'Continue', color: 'blue' },
    ],
  },
  {
    name: 'blank',
    label: 'Blank',
    columns: [],
  },
]

export interface TemplateChoice {
  name: TemplateName
  label: string
}

export const TEMPLATE_CHOICES: TemplateChoice[] = TEMPLATES.map(({ name, label }) => ({
  name,
  label,
}))

/**
 * The ordered columns a new Board starts with for a given Template. Returns fresh
 * objects each call so a caller mutating the result cannot corrupt the template.
 */
export function templateColumns(name: TemplateName): ColumnSeed[] {
  const template = TEMPLATES.find((candidate) => candidate.name === name)
  if (!template) {
    throw new Error(`Unknown template: ${name}`)
  }
  return template.columns.map((column) => ({ ...column }))
}
