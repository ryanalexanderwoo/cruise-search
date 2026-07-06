function destinationImageFromName(destination: string): string {
  const value = destination.toLowerCase()

  if (value.includes('barcelona') || value.includes('marseille') || value.includes('mediterranean')) {
    return '/images/mediterranean.jpg'
  }

  if (value.includes('miami') || value.includes('nassau') || value.includes('cozumel') || value.includes('caribbean')) {
    return '/images/caribbean.jpg'
  }

  if (value.includes('juneau') || value.includes('skagway') || value.includes('ketchikan') || value.includes('alaska')) {
    return '/images/alaska.jpg'
  }

  if (value.includes('bergen') || value.includes('geiranger') || value.includes('oslo') || value.includes('nordic')) {
    return '/images/nordic.jpg'
  }

  if (value.includes('vancouver') || value.includes('san francisco') || value.includes('los angeles') || value.includes('pacific')) {
    return '/images/pacific.jpg'
  }

  if (value.includes('lisbon') || value.includes('azores') || value.includes('bermuda') || value.includes('new york') || value.includes('transatlantic')) {
    return '/images/transatlantic.jpg'
  }

  return '/images/default.jpg'
}

export function destinationImageFromItineraryMap(itineraryMap: string, fallbackName: string): string {
  const destination = itineraryMap.split('->')[1]?.trim() ?? fallbackName
  return destinationImageFromName(destination)
}