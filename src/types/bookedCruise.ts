export interface BookedCruiseEntry {
  id: string
  cruiseId: string
  itineraryName: string
  itineraryMap: string
  shipName: string
  startDate: string
  endDate: string
  nights: number
  adults: number
  children: number
  totalPrice: number
  pricePerStateroom: number
  pricePerPerson: number
  bookedAt: string
}