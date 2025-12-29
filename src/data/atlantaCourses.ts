// ============================================
// City of Atlanta Golf Courses - Official Data
// Source: cityofatlantagolf.com + BlueGolf scorecards
// ============================================

export interface CourseHole {
  number: number;
  par: number;
  handicap: number;
  yardage: {
    blue?: number;
    white?: number;
    red?: number;
  };
}

export interface CourseTee {
  name: string;
  color: string;
  totalYards: number;
  rating: number;
  slope: number;
  par: number;
}

export interface AtlantaMunicipalCourse {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  holes: 9 | 18;
  par: number;
  description: string;
  history: string;
  yearBuilt?: number;
  architect?: string;
  website: string;
  teeTimeUrl: string;
  emoji: string;
  tees: CourseTee[];
  holeData: CourseHole[];
}

export const ATLANTA_MUNICIPAL_COURSES: AtlantaMunicipalCourse[] = [
  {
    id: 'browns-mill',
    name: 'Browns Mill Golf Course',
    address: '480 Cleveland Ave SE, Atlanta, GA 30354',
    phone: '(404) 366-3573',
    lat: 33.6809,
    lng: -84.3757,
    holes: 18,
    par: 72,
    description: 'Tremendous views and challenging play for golfers at every skill level.',
    history: 'Only 5 miles from Hartsfield-Jackson International Airport. Newly remodeled clubhouse with food prep station and meeting rooms.',
    yearBuilt: 1970,
    architect: 'George Cobb',
    website: 'https://www.cityofatlantagolf.com/browns-mill-golf-course/',
    teeTimeUrl: 'https://browns-mill-golf-course.book.teeitup.com/',
    emoji: '⛳',
    tees: [
      { name: 'Blue', color: '#1E40AF', totalYards: 6539, rating: 70.9, slope: 123, par: 72 },
      { name: 'White', color: '#FFFFFF', totalYards: 6260, rating: 69.6, slope: 120, par: 72 },
      { name: 'Red', color: '#DC2626', totalYards: 5545, rating: 71.5, slope: 119, par: 72 },
    ],
    holeData: [
      { number: 1, par: 5, handicap: 5, yardage: { blue: 516, white: 498, red: 450 } },
      { number: 2, par: 3, handicap: 17, yardage: { blue: 176, white: 160, red: 140 } },
      { number: 3, par: 4, handicap: 1, yardage: { blue: 435, white: 415, red: 380 } },
      { number: 4, par: 4, handicap: 9, yardage: { blue: 384, white: 365, red: 340 } },
      { number: 5, par: 4, handicap: 15, yardage: { blue: 345, white: 330, red: 305 } },
      { number: 6, par: 3, handicap: 13, yardage: { blue: 173, white: 160, red: 140 } },
      { number: 7, par: 4, handicap: 7, yardage: { blue: 364, white: 350, red: 320 } },
      { number: 8, par: 5, handicap: 3, yardage: { blue: 520, white: 500, red: 460 } },
      { number: 9, par: 4, handicap: 11, yardage: { blue: 345, white: 330, red: 310 } },
      { number: 10, par: 5, handicap: 18, yardage: { blue: 467, white: 445, red: 420 } },
      { number: 11, par: 4, handicap: 4, yardage: { blue: 394, white: 375, red: 350 } },
      { number: 12, par: 4, handicap: 14, yardage: { blue: 354, white: 340, red: 315 } },
      { number: 13, par: 4, handicap: 16, yardage: { blue: 324, white: 310, red: 285 } },
      { number: 14, par: 3, handicap: 2, yardage: { blue: 213, white: 195, red: 170 } },
      { number: 15, par: 4, handicap: 6, yardage: { blue: 441, white: 420, red: 390 } },
      { number: 16, par: 4, handicap: 8, yardage: { blue: 416, white: 395, red: 365 } },
      { number: 17, par: 3, handicap: 12, yardage: { blue: 180, white: 165, red: 145 } },
      { number: 18, par: 5, handicap: 10, yardage: { blue: 492, white: 470, red: 440 } },
    ],
  },
  {
    id: 'chastain-park',
    name: 'Chastain Park Golf Course',
    address: '216 West Wieuca Rd, Atlanta, GA 30342',
    phone: '(404) 255-0723',
    lat: 33.8743,
    lng: -84.3935,
    holes: 18,
    par: 71,
    description: "Atlanta's top-rated public course with scenic Buckhead skyline views.",
    history: 'Located in the Buckhead neighborhood. Features rolling hills and scenic views. Originally known as North Fulton Golf Course.',
    yearBuilt: 1937,
    architect: 'H. Chandler Egan, Bobby Jones, Walter Hagen',
    website: 'https://www.cityofatlantagolf.com/chastain-park-golf-course/',
    teeTimeUrl: 'https://chastain-park.book.teeitup.com/',
    emoji: '🏆',
    tees: [
      { name: 'Blue', color: '#1E40AF', totalYards: 6570, rating: 71.8, slope: 129, par: 71 },
      { name: 'White', color: '#FFFFFF', totalYards: 6301, rating: 70.5, slope: 124, par: 71 },
      { name: 'Silver', color: '#9CA3AF', totalYards: 5120, rating: 69.5, slope: 117, par: 71 },
    ],
    holeData: [
      { number: 1, par: 4, handicap: 5, yardage: { blue: 417, white: 395 } },
      { number: 2, par: 5, handicap: 7, yardage: { blue: 487, white: 465 } },
      { number: 3, par: 3, handicap: 15, yardage: { blue: 183, white: 169 } },
      { number: 4, par: 4, handicap: 3, yardage: { blue: 429, white: 373 } },
      { number: 5, par: 3, handicap: 17, yardage: { blue: 159, white: 156 } },
      { number: 6, par: 4, handicap: 1, yardage: { blue: 388, white: 375 } },
      { number: 7, par: 4, handicap: 9, yardage: { blue: 433, white: 427 } },
      { number: 8, par: 4, handicap: 13, yardage: { blue: 365, white: 360 } },
      { number: 9, par: 4, handicap: 11, yardage: { blue: 371, white: 377 } },
      { number: 10, par: 5, handicap: 8, yardage: { blue: 488, white: 487 } },
      { number: 11, par: 3, handicap: 18, yardage: { blue: 141, white: 144 } },
      { number: 12, par: 4, handicap: 12, yardage: { blue: 393, white: 393 } },
      { number: 13, par: 4, handicap: 6, yardage: { blue: 395, white: 387 } },
      { number: 14, par: 3, handicap: 16, yardage: { blue: 190, white: 190 } },
      { number: 15, par: 4, handicap: 4, yardage: { blue: 443, white: 450 } },
      { number: 16, par: 4, handicap: 14, yardage: { blue: 351, white: 327 } },
      { number: 17, par: 5, handicap: 10, yardage: { blue: 491, white: 463 } },
      { number: 18, par: 4, handicap: 2, yardage: { blue: 446, white: 438 } },
    ],
  },
  {
    id: 'candler-park',
    name: 'Candler Park Golf Course',
    address: '585 Candler Park Dr NE, Atlanta, GA 30307',
    phone: '(404) 371-1260',
    lat: 33.7662,
    lng: -84.3386,
    holes: 9,
    par: 31,
    description: 'Fun and fast 9-hole executive course with 3 sets of tees.',
    history: 'Opened in 1927. Donated to the City of Atlanta by Coca-Cola founder Asa Candler. Walking only course.',
    yearBuilt: 1927,
    website: 'https://www.cityofatlantagolf.com/candler-park-golf-course/',
    teeTimeUrl: 'https://candler-park-golf-course.book.teeitup.com/',
    emoji: '🏌️',
    tees: [
      { name: 'Blue', color: '#1E40AF', totalYards: 1973, rating: 30.4, slope: 100, par: 31 },
      { name: 'White', color: '#FFFFFF', totalYards: 1868, rating: 29.8, slope: 97, par: 31 },
      { name: 'Red', color: '#DC2626', totalYards: 1742, rating: 29.4, slope: 95, par: 31 },
    ],
    holeData: [
      { number: 1, par: 4, handicap: 11, yardage: { blue: 283, white: 273, red: 263 } },
      { number: 2, par: 3, handicap: 1, yardage: { blue: 169, white: 148, red: 140 } },
      { number: 3, par: 3, handicap: 3, yardage: { blue: 127, white: 119, red: 111 } },
      { number: 4, par: 3, handicap: 17, yardage: { blue: 141, white: 129, red: 123 } },
      { number: 5, par: 3, handicap: 9, yardage: { blue: 168, white: 148, red: 131 } },
      { number: 6, par: 4, handicap: 13, yardage: { blue: 339, white: 329, red: 288 } },
      { number: 7, par: 4, handicap: 7, yardage: { blue: 323, white: 314, red: 305 } },
      { number: 8, par: 4, handicap: 15, yardage: { blue: 256, white: 253, red: 247 } },
      { number: 9, par: 3, handicap: 5, yardage: { blue: 167, white: 155, red: 134 } },
    ],
  },
  {
    id: 'tup-holmes',
    name: "Alfred 'Tup' Holmes Golf Course",
    address: '2300 Wilson Dr SW, Atlanta, GA 30314',
    phone: '(404) 753-6158',
    lat: 33.7340,
    lng: -84.4350,
    holes: 18,
    par: 72,
    description: 'Historic 18-hole course with challenging design and beautiful rolling hills.',
    history: 'Named after Alfred "Tup" Holmes, who led the desegregation of Atlanta golf courses in 1955. Designed by Garrett Gill and George B. Williams.',
    architect: 'Garrett Gill, George B. Williams',
    website: 'https://www.cityofatlantagolf.com/alfred-tup-holmes-golf-course/',
    teeTimeUrl: 'https://alfred-tup-holmes.book.teeitup.com/',
    emoji: '🌟',
    tees: [
      { name: 'Blue', color: '#1E40AF', totalYards: 5971, rating: 70.0, slope: 125, par: 72 },
      { name: 'White', color: '#FFFFFF', totalYards: 5734, rating: 69.0, slope: 122, par: 72 },
      { name: 'Silver', color: '#9CA3AF', totalYards: 4787, rating: 64.8, slope: 114, par: 72 },
    ],
    holeData: [
      { number: 1, par: 4, handicap: 1, yardage: { blue: 382, white: 358 } },
      { number: 2, par: 4, handicap: 5, yardage: { blue: 392, white: 386 } },
      { number: 3, par: 4, handicap: 17, yardage: { blue: 321, white: 314 } },
      { number: 4, par: 3, handicap: 9, yardage: { blue: 135, white: 125 } },
      { number: 5, par: 5, handicap: 11, yardage: { blue: 471, white: 465 } },
      { number: 6, par: 5, handicap: 13, yardage: { blue: 442, white: 417 } },
      { number: 7, par: 4, handicap: 15, yardage: { blue: 357, white: 345 } },
      { number: 8, par: 4, handicap: 7, yardage: { blue: 420, white: 416 } },
      { number: 9, par: 3, handicap: 3, yardage: { blue: 213, white: 207 } },
      { number: 10, par: 3, handicap: 12, yardage: { blue: 160, white: 157 } },
      { number: 11, par: 4, handicap: 4, yardage: { blue: 378, white: 371 } },
      { number: 12, par: 4, handicap: 2, yardage: { blue: 363, white: 305 } },
      { number: 13, par: 4, handicap: 14, yardage: { blue: 301, white: 295 } },
      { number: 14, par: 3, handicap: 6, yardage: { blue: 161, white: 154 } },
      { number: 15, par: 5, handicap: 8, yardage: { blue: 437, white: 426 } },
      { number: 16, par: 5, handicap: 10, yardage: { blue: 467, white: 439 } },
      { number: 17, par: 4, handicap: 16, yardage: { blue: 253, white: 243 } },
      { number: 18, par: 4, handicap: 18, yardage: { blue: 318, white: 311 } },
    ],
  },
];

export function getCourseById(id: string): AtlantaMunicipalCourse | undefined {
  return ATLANTA_MUNICIPAL_COURSES.find(c => c.id === id);
}

export function getTotalPar(course: AtlantaMunicipalCourse): number {
  return course.holeData.reduce((sum, hole) => sum + hole.par, 0);
}

export function getCourseSummary(course: AtlantaMunicipalCourse, teeName?: string) {
  const tee = teeName 
    ? course.tees.find(t => t.name === teeName) 
    : course.tees[0];
  
  return {
    name: course.name,
    holes: course.holes,
    par: course.par,
    yards: tee?.totalYards || 0,
    rating: tee?.rating || 0,
    slope: tee?.slope || 0,
  };
}
