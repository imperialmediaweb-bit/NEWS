/**
 * Decide whether an article belongs on a given state's site.
 *
 * The state feeds are per state, but their contents are not. The nonprofit
 * newsrooms — Alaska Beacon, Georgia Recorder, Florida Phoenix and the rest —
 * are themselves a network and republish each other, so an Alaska feed carries
 * Georgia stories. The first run after switching to these feeds published
 * "Three Arrested for Child Cruelty in Georgia Apartment" on alaska-express.
 *
 * That is wrong twice over. A reader in Anchorage has no use for a Georgia
 * crime story, and fifty "local" sites all carrying the same national wire
 * pieces is the pattern this network is trying not to look like.
 *
 * So an article has to mention the state, or somewhere in it, to run there.
 */

/**
 * Cities and well-known places per state. Not exhaustive — enough that a story
 * genuinely about the state almost always names one of them, which is all this
 * needs to do. Add to it freely.
 */
const PLACES: Record<string, string[]> = {
  Alabama: ["birmingham", "montgomery", "mobile", "huntsville", "tuscaloosa", "auburn", "dothan", "decatur", "hoover", "florence"],
  Alaska: ["anchorage", "fairbanks", "juneau", "wasilla", "sitka", "ketchikan", "kenai", "bethel", "kodiak", "nome"],
  Arizona: ["phoenix", "tucson", "mesa", "scottsdale", "chandler", "glendale", "gilbert", "tempe", "flagstaff", "yuma"],
  Arkansas: ["little rock", "fayetteville", "fort smith", "springdale", "jonesboro", "conway", "rogers", "bentonville", "pine bluff"],
  California: ["los angeles", "san francisco", "san diego", "sacramento", "san jose", "fresno", "oakland", "long beach", "bakersfield", "anaheim", "riverside", "stockton"],
  Colorado: ["denver", "colorado springs", "aurora", "fort collins", "lakewood", "boulder", "pueblo", "greeley", "longmont", "loveland"],
  Connecticut: ["hartford", "new haven", "bridgeport", "stamford", "waterbury", "norwalk", "danbury", "new britain", "greenwich"],
  Delaware: ["wilmington", "dover", "newark", "middletown", "smyrna", "milford", "rehoboth", "georgetown"],
  Florida: ["miami", "orlando", "tampa", "jacksonville", "tallahassee", "st. petersburg", "fort lauderdale", "naples", "sarasota", "gainesville", "pensacola", "panama city"],
  Georgia: ["atlanta", "savannah", "augusta", "columbus", "macon", "athens", "albany", "marietta", "valdosta", "warner robins"],
  Hawaii: ["honolulu", "hilo", "kailua", "kapolei", "maui", "oahu", "kauai", "lahaina", "waikiki"],
  Idaho: ["boise", "meridian", "nampa", "idaho falls", "pocatello", "caldwell", "coeur d'alene", "twin falls", "moscow"],
  Illinois: ["chicago", "springfield", "aurora", "rockford", "joliet", "naperville", "peoria", "elgin", "champaign", "evanston"],
  Indiana: ["indianapolis", "fort wayne", "evansville", "south bend", "bloomington", "carmel", "fishers", "hammond", "gary", "lafayette"],
  Iowa: ["des moines", "cedar rapids", "davenport", "sioux city", "iowa city", "waterloo", "ames", "council bluffs", "dubuque"],
  Kansas: ["wichita", "overland park", "kansas city", "topeka", "olathe", "lawrence", "manhattan", "salina", "hutchinson"],
  Kentucky: ["louisville", "lexington", "bowling green", "owensboro", "covington", "richmond", "frankfort", "paducah", "hopkinsville"],
  Louisiana: ["new orleans", "baton rouge", "shreveport", "lafayette", "lake charles", "kenner", "monroe", "alexandria", "houma"],
  Maine: ["portland", "lewiston", "bangor", "augusta", "biddeford", "auburn", "brunswick", "scarborough", "saco"],
  Maryland: ["baltimore", "annapolis", "frederick", "rockville", "gaithersburg", "bowie", "hagerstown", "salisbury", "columbia"],
  Massachusetts: ["boston", "worcester", "springfield", "cambridge", "lowell", "brockton", "quincy", "lynn", "new bedford", "somerville"],
  Michigan: ["detroit", "grand rapids", "lansing", "ann arbor", "flint", "dearborn", "warren", "sterling heights", "kalamazoo", "traverse city"],
  Minnesota: ["minneapolis", "st. paul", "rochester", "duluth", "bloomington", "brooklyn park", "st. cloud", "mankato", "moorhead"],
  Mississippi: ["jackson", "gulfport", "southaven", "biloxi", "hattiesburg", "meridian", "tupelo", "olive branch", "greenville"],
  Missouri: ["kansas city", "st. louis", "springfield", "columbia", "independence", "jefferson city", "joplin", "st. charles", "cape girardeau"],
  Montana: ["billings", "missoula", "great falls", "bozeman", "butte", "helena", "kalispell", "havre", "whitefish"],
  Nebraska: ["omaha", "lincoln", "bellevue", "grand island", "kearney", "fremont", "hastings", "north platte", "norfolk"],
  Nevada: ["las vegas", "reno", "henderson", "north las vegas", "sparks", "carson city", "elko", "mesquite", "pahrump"],
  "New Hampshire": ["manchester", "nashua", "concord", "derry", "dover", "rochester", "keene", "portsmouth", "laconia"],
  "New Jersey": ["newark", "jersey city", "paterson", "trenton", "camden", "atlantic city", "edison", "hoboken", "princeton"],
  "New Mexico": ["albuquerque", "santa fe", "las cruces", "rio rancho", "roswell", "farmington", "gallup", "carlsbad", "taos"],
  "New York": ["new york city", "buffalo", "rochester", "yonkers", "syracuse", "albany", "brooklyn", "queens", "bronx", "manhattan", "long island"],
  "North Carolina": ["charlotte", "raleigh", "greensboro", "durham", "winston-salem", "fayetteville", "asheville", "wilmington", "cary", "chapel hill"],
  "North Dakota": ["fargo", "bismarck", "grand forks", "minot", "west fargo", "williston", "dickinson", "mandan", "jamestown"],
  Ohio: ["columbus", "cleveland", "cincinnati", "toledo", "akron", "dayton", "youngstown", "canton", "parma", "lorain"],
  Oklahoma: ["oklahoma city", "tulsa", "norman", "broken arrow", "lawton", "edmond", "moore", "stillwater", "enid"],
  Oregon: ["portland", "salem", "eugene", "gresham", "hillsboro", "bend", "beaverton", "medford", "corvallis", "astoria"],
  Pennsylvania: ["philadelphia", "pittsburgh", "allentown", "erie", "reading", "scranton", "bethlehem", "lancaster", "harrisburg", "altoona"],
  "Rhode Island": ["providence", "warwick", "cranston", "pawtucket", "newport", "woonsocket", "east providence", "narragansett"],
  "South Carolina": ["charleston", "columbia", "greenville", "myrtle beach", "spartanburg", "rock hill", "florence", "summerville", "hilton head"],
  "South Dakota": ["sioux falls", "rapid city", "aberdeen", "brookings", "watertown", "mitchell", "pierre", "yankton", "deadwood"],
  Tennessee: ["nashville", "memphis", "knoxville", "chattanooga", "clarksville", "murfreesboro", "franklin", "jackson", "johnson city"],
  Texas: ["houston", "dallas", "austin", "san antonio", "fort worth", "el paso", "arlington", "corpus christi", "plano", "lubbock", "laredo", "amarillo"],
  Utah: ["salt lake city", "provo", "west valley city", "ogden", "st. george", "orem", "sandy", "layton", "park city", "logan"],
  Vermont: ["burlington", "rutland", "montpelier", "barre", "brattleboro", "bennington", "st. albans", "stowe", "middlebury"],
  Virginia: ["virginia beach", "richmond", "norfolk", "chesapeake", "arlington", "alexandria", "roanoke", "charlottesville", "lynchburg", "harrisonburg"],
  Washington: ["seattle", "spokane", "tacoma", "vancouver", "bellevue", "everett", "olympia", "yakima", "bellingham", "kennewick"],
  "West Virginia": ["charleston", "huntington", "morgantown", "parkersburg", "wheeling", "martinsburg", "fairmont", "beckley", "clarksburg"],
  Wisconsin: ["milwaukee", "madison", "green bay", "kenosha", "racine", "appleton", "waukesha", "oshkosh", "eau claire", "la crosse"],
  Wyoming: ["cheyenne", "casper", "laramie", "gillette", "rock springs", "sheridan", "jackson hole", "cody", "riverton"],
};

export interface RelevanceResult {
  relevant: boolean;
  /** What matched, for the rejection message. */
  matched?: string;
  reason?: string;
}

/**
 * Is this article about the given state?
 *
 * State abbreviations are deliberately not matched. "OR", "IN", "OK", "ME",
 * "HI" and "DE" are ordinary English words, and matching them would let almost
 * anything through — which is the failure this exists to prevent.
 */
export function isRelevantToState(
  title: string,
  body: string,
  state: string,
  city?: string
): RelevanceResult {
  // The lede carries the local angle when there is one; the tail of a long
  // article is often boilerplate mentioning other states.
  const haystack = `${title} ${body.slice(0, 4000)}`.toLowerCase();

  const stateName = state.toLowerCase();
  if (haystack.includes(stateName)) {
    return { relevant: true, matched: state };
  }

  if (city && haystack.includes(city.toLowerCase())) {
    return { relevant: true, matched: city };
  }

  for (const place of PLACES[state] || []) {
    if (haystack.includes(place)) {
      return { relevant: true, matched: place };
    }
  }

  return {
    relevant: false,
    reason: `No mention of ${state} or any of its towns — the state newsrooms republish each other, so their feeds carry other states' stories`,
  };
}

/**
 * States other than this one that the article names. A story naming three
 * other states and not this one is national wire copy, not local news.
 */
export function otherStatesMentioned(text: string, exclude: string): string[] {
  const lower = text.toLowerCase();
  return Object.keys(PLACES).filter(
    (s) => s !== exclude && lower.includes(s.toLowerCase())
  );
}
