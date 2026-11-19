import type { CountryData } from '../types';
import { indiaStates } from './indiaStates';

export const locationData: CountryData[] = [
  {
    name: 'India',
    code: 'IN',
    states: indiaStates
  },
  {
    name: 'United States',
    code: 'US',
    states: [
      {
        name: 'California',
        districts: [
          'Los Angeles County',
          'San Diego County',
          'Orange County',
          'Santa Clara County',
          'San Francisco County',
          'Alameda County',
          'Sacramento County'
        ]
      },
      {
        name: 'New York',
        districts: [
          'New York County (Manhattan)',
          'Kings County (Brooklyn)',
          'Queens County',
          'Bronx County',
          'Richmond County (Staten Island)',
          'Nassau County',
          'Suffolk County'
        ]
      },
      {
        name: 'Texas',
        districts: [
          'Harris County (Houston)',
          'Dallas County',
          'Tarrant County (Fort Worth)',
          'Bexar County (San Antonio)',
          'Travis County (Austin)'
        ]
      },
      {
        name: 'Florida',
        districts: [
          'Miami-Dade County',
          'Broward County (Fort Lauderdale)',
          'Palm Beach County',
          'Hillsborough County (Tampa)',
          'Orange County (Orlando)'
        ]
      }
    ]
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    states: [
      {
        name: 'England',
        districts: [
          'Greater London',
          'Greater Manchester',
          'West Midlands',
          'West Yorkshire',
          'Merseyside',
          'Tyne and Wear'
        ]
      },
      {
        name: 'Scotland',
        districts: [
          'Glasgow City',
          'City of Edinburgh',
          'Fife',
          'North Lanarkshire',
          'South Lanarkshire'
        ]
      }
    ]
  },
  {
    name: 'Canada',
    code: 'CA',
    states: [
      {
        name: 'Ontario',
        districts: [
          'Toronto Region',
          'Ottawa Region',
          'Peel Region',
          'York Region',
          'Hamilton Region'
        ]
      },
      {
        name: 'Quebec',
        districts: [
          'Montreal Region',
          'Quebec City Region',
          'Laval Region',
          'Gatineau Region'
        ]
      }
    ]
  }
];

export default locationData;
