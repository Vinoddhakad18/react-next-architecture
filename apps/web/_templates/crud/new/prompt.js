const startCase = (value) =>
  value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim()

const toPascal = (value) => startCase(value).replace(/\s+/g, '')
const toCamel = (value) => {
  const pascal = toPascal(value)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

const pluralize = (value) => {
  if (!value) return value
  if (value.endsWith('s')) {
    return value
  }
  if (/[aeiou]y$/i.test(value)) {
    return `${value}s`
  }
  if (value.endsWith('y')) {
    return `${value.slice(0, -1)}ies`
  }
  return `${value}s`
}

const parseOptions = (raw) =>
  raw
    .split('|')
    .map((option) => option.trim())
    .filter(Boolean)
    .map((option) => {
      const [value, label] = option.split('=')
      return {
        value: value.trim(),
        label: label ? label.trim() : startCase(value.trim()),
      }
    })

const mapInputType = (type) => {
  switch (type) {
    case 'email':
    case 'url':
    case 'password':
    case 'date':
    case 'number':
      return type
    case 'boolean':
    case 'checkbox':
      return 'checkbox'
    case 'textarea':
      return 'textarea'
    case 'select':
      return 'select'
    default:
      return 'text'
  }
}

const mapTsType = (type) => {
  switch (type) {
    case 'number':
      return 'number'
    case 'boolean':
    case 'checkbox':
      return 'boolean'
    case 'date':
    case 'email':
    case 'url':
    case 'textarea':
    case 'select':
    default:
      return 'string'
  }
}

const defaultValueForType = (type) => {
  switch (type) {
    case 'number':
      return 0
    case 'boolean':
    case 'checkbox':
      return false
    default:
      return "''"
  }
}

const parseField = (rawField) => {
  const [name, ...rest] = rawField.split(':').map((item) => item.trim())
  let type = 'string'
  let optionsString = ''

  if (rest.length) {
    type = rest[0].toLowerCase()
    optionsString = rest.slice(1).join(':')
  }

  if (type.startsWith('select(') && type.endsWith(')')) {
    optionsString = type.slice(7, -1)
    type = 'select'
  }

  const inputType = mapInputType(type)
  const tsType = mapTsType(type)
  const options = inputType === 'select' ? parseOptions(optionsString) : []

  return {
    name,
    label: startCase(name),
    type,
    inputType,
    tsType,
    options,
    defaultValue: defaultValueForType(inputType),
  }
}

module.exports = {
  prompt: async ({ prompter, args }) => {
    const name = args.name || ''
    const fields = args.fields || ''
    const plural = args.plural || pluralize(name)

    const answers = await prompter.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Entity name (singular, e.g. product)',
        initial: name,
        validate: (value) => (value.trim() ? true : 'Please enter a singular entity name.'),
      },
      {
        type: 'input',
        name: 'plural',
        message: 'Plural route/folder name (optional, defaults to adding s)',
        initial: plural,
      },
      {
        type: 'input',
        name: 'fields',
        message:
          'Fields (comma-separated, format name:type or status:select:active|inactive)',
        initial:
          fields || 'name:string,email:email,status:select:active|inactive',
        validate: (value) => (value.trim() ? true : 'Please enter at least one field.'),
      },
    ])

    const entityName = answers.name.trim().toLowerCase()
    const entityPlural = answers.plural && answers.plural.trim() ? answers.plural.trim().toLowerCase() : pluralize(entityName)
    const parsedFields = answers.fields
      .split(',')
      .map((field) => field.trim())
      .filter(Boolean)
      .map(parseField)

    return {
      name: entityName,
      singular: entityName,
      plural: entityPlural,
      entityPascal: toPascal(entityName),
      entityCamel: toCamel(entityName),
      pluralPascal: toPascal(entityPlural),
      pluralCamel: toCamel(entityPlural),
      fields: parsedFields,
    }
  },
}
