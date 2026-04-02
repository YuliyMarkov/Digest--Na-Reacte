export function getLocalizedValue(value, language = 'ru', fallback = 'ru') {
  if (value == null) return ''

  if (typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value
  }

  const localized = value[language]

  if (
    localized !== undefined &&
    localized !== null &&
    !(Array.isArray(localized) && localized.length === 0) &&
    localized !== ''
  ) {
    return localized
  }

  const fallbackValue = value[fallback]

  if (fallbackValue !== undefined && fallbackValue !== null) {
    return fallbackValue
  }

  return ''
}