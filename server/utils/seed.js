import mongoose from "mongoose";
import { Types } from "mongoose";

import User from "../models/user.js";
import Profile from "../models/profile.js";
import Post from "../models/post.js";
import Follow from "../models/follow.js";

import { client } from "../services/elasticsearch.js";

// Configuration (defaults can be overridden via CLI flags)
let TOTAL_USERS = 10; // Reduce to 10 for testing, increase for production seed
let MAX_POSTS_PER_USER = 20; // Reduced from 100 to 20 to minimize API calls
let MAX_FOLLOWERS = 100;
let PASSWORD = "password";

// Simple CLI argument parser to override defaults
function printUsage() {
  console.log(`Usage: node utils/seed.js [options]

Options:
  -u, --users <number>          Number of users to create (default: ${TOTAL_USERS})
  -p, --max-posts <number>      Max posts per user (default: ${MAX_POSTS_PER_USER})
  -f, --max-followers <number>  Max followers per user (default: ${MAX_FOLLOWERS})
  --password <password>         Password used for created users (default: ${PASSWORD})
  -h, --help                    Show this help message
`);
}

function parseArgs() {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-u" || a === "--users") {
      TOTAL_USERS = Number(argv[++i]) || TOTAL_USERS;
      continue;
    }
    if (a === "-p" || a === "--max-posts") {
      MAX_POSTS_PER_USER = Number(argv[++i]) || MAX_POSTS_PER_USER;
      continue;
    }
    if (a === "-f" || a === "--max-followers") {
      MAX_FOLLOWERS = Number(argv[++i]) || MAX_FOLLOWERS;
      continue;
    }
    if (a === "--password") {
      PASSWORD = argv[++i] || PASSWORD;
      continue;
    }
    if (a === "-h" || a === "--help") {
      printUsage();
      process.exit(0);
    }
  }
}

// Apply CLI overrides immediately
parseArgs();

const FIRST_NAMES = [
  "Emma",
  "Liam",
  "Olivia",
  "Noah",
  "Ava",
  "William",
  "Sophia",
  "James",
  "Isabella",
  "Oliver",
  "Charlotte",
  "Elijah",
  "Amelia",
  "Benjamin",
  "Mia",
  "Lucas",
  "Harper",
  "Mason",
  "Evelyn",
  "Logan",
  "Abigail",
  "Alexander",
  "Emily",
  "Ethan",
  "Elizabeth",
  "Jacob",
  "Mila",
  "Michael",
  "Ella",
  "Daniel",
  "Avery",
  "Henry",
  "Sofia",
  "Jackson",
  "Camila",
  "Sebastian",
  "Aria",
  "Aiden",
  "Scarlett",
  "Matthew",
  "Victoria",
  "Samuel",
  "Madison",
  "David",
  "Luna",
  "Joseph",
  "Grace",
  "Carter",
  "Chloe",
  "Owen",
  "Penelope",
  "Wyatt",
  "Layla",
  "John",
  "Riley",
  "Jack",
  "Zoey",
  "Luke",
  "Nora",
  "Jayden",
  "Lily",
  "Dylan",
  "Eleanor",
  "Grayson",
  "Hannah",
  "Levi",
  "Lillian",
  "Isaac",
  "Addison",
  "Gabriel",
  "Aubrey",
  "Julian",
  "Ellie",
  "Mateo",
  "Stella",
  "Anthony",
  "Natalie",
  "Jaxon",
  "Zoe",
  "Lincoln",
  "Leah",
  "Joshua",
  "Hazel",
  "Christopher",
  "Violet",
  "Andrew",
  "Aurora",
  "Theodore",
  "Savannah",
  "Caleb",
  "Audrey",
  "Ryan",
  "Brooklyn",
  "Asher",
  "Bella",
  "Nathan",
  "Claire",
  "Thomas",
  "Skylar",
  "Leo",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
  "Phillips",
  "Evans",
  "Turner",
  "Parker",
  "Collins",
  "Edwards",
  "Stewart",
  "Morris",
  "Murphy",
  "Cook",
  "Rogers",
  "Morgan",
  "Peterson",
  "Cooper",
  "Reed",
  "Bailey",
  "Bell",
  "Gomez",
  "Kelly",
  "Howard",
  "Ward",
  "Cox",
  "Diaz",
  "Richardson",
  "Wood",
  "Watson",
  "Brooks",
  "Bennett",
  "Gray",
  "James",
  "Reyes",
  "Cruz",
  "Hughes",
  "Price",
  "Myers",
  "Long",
  "Foster",
  "Sanders",
  "Ross",
  "Morales",
  "Powell",
  "Sullivan",
  "Russell",
  "Ortiz",
  "Jenkins",
  "Gutierrez",
  "Perry",
  "Butler",
  "Barnes",
  "Fisher",
];

// Sample data pools
const TOPICS = [
  "technology",
  "travel",
  "food",
  "sports",
  "music",
  "art",
  "fashion",
  "science",
  "nature",
  "business",
  "health",
  "education",
  "entertainment",
  "lifestyle",
  "photography",
  "cooking",
  "fitness",
  "books",
  "movies",
  "gaming",
];

const POST_TEMPLATES = [
  {
    text: "Just finished reading '{book}' by {author}. What an incredible journey! 📚✨",
    context: "books",
    images: ["books", "reading", "library"],
  },
  {
    text: "Made this delicious {dish} today! Recipe in the comments 👩‍🍳 #homemade #cooking",
    context: "food",
    images: ["food", "cooking", "kitchen"],
  },
  {
    text: "Morning workout complete! {exercise} is my new favorite 💪 #fitness #motivation",
    context: "fitness",
    images: ["gym", "workout", "fitness"],
  },
  {
    text: "Exploring {location} today! The views are absolutely breathtaking 🌄 #travel #adventure",
    context: "travel",
    images: ["travel", "landscape", "nature"],
  },
  {
    text: "Working on a new {project} project. Can't wait to share the results! 🚀 #coding #development",
    context: "technology",
    images: ["technology", "coding", "computer"],
  },
  {
    text: "Just discovered this amazing {artist} song. Been on repeat all day! 🎵 #music #newfavorite",
    context: "music",
    images: ["music", "concert", "headphones"],
  },
  {
    text: "Finished my latest {artwork} piece. Art therapy at its finest 🎨 #creative #art",
    context: "art",
    images: ["art", "painting", "creative"],
  },
  {
    text: "Coffee and {activity} - the perfect combination ☕ #morningvibes #productivity",
    context: "lifestyle",
    images: ["coffee", "morning", "lifestyle"],
  },
  {
    text: "Watching {movie} tonight. Anyone else seen it? 🍿 #movie #entertainment",
    context: "entertainment",
    images: ["movie", "cinema", "entertainment"],
  },
  {
    text: "Beautiful sunset at {place}. Nature never fails to amaze me 🌅 #photography #nature",
    context: "photography",
    images: ["sunset", "nature", "photography"],
  },
  {
    text: "New {item} arrived! Unboxing time 📦 #shopping #excited",
    context: "lifestyle",
    images: ["shopping", "unboxing", "lifestyle"],
  },
  {
    text: "Learning {skill} has been such a rewarding experience 📖 #education #growth",
    context: "education",
    images: ["learning", "education", "books"],
  },
  {
    text: "Game night with friends! {game} is always a hit 🎲 #gaming #friends",
    context: "gaming",
    images: ["gaming", "friends", "entertainment"],
  },
  {
    text: "Just finished {workout} session. Endorphins are flowing! 💪 #fitness #health",
    context: "fitness",
    images: ["workout", "fitness", "health"],
  },
  {
    text: "Weekend vibes at {venue}. Live music is everything! 🎤 #music #weekend",
    context: "music",
    images: ["concert", "music", "weekend"],
  },
];

// Additional simple templates for more variety
const SIMPLE_POSTS = [
  "Just had an amazing experience! ✨",
  "Check out this cool thing I found 🔍",
  "Working on something exciting... 🛠️",
  "Anyone else love this as much as I do? ❤️",
  "Weekend vibes 🌟",
  "New project alert 🚨",
  "Throwback to this amazing moment 📸",
  "Can't wait to share what's coming next! 👀",
  "Daily dose of inspiration 💡",
  "Behind the scenes of... 🎬",
  "Living my best life 🌈",
  "When in doubt, coffee it out ☕",
  "Good vibes only ✌️",
  "Sunshine and good times ☀️",
  "Another day, another adventure 🗺️",
  "Food coma achieved 🍴",
  "Just because I can 🌸",
  "Making memories every day 📅",
  "Do what makes your soul shine ✨",
  "Self-care isn't selfish 💆‍♀️",
  "Friday feels 🎉",
  "Morning motivation 💪",
  "Little things make big days 🌼",
  "Currently obsessed with this 🥰",
  "Sweat now, shine later 🏋️‍♀️",
  "Sunday funday 🎈",
  "Views and brews 🍺",
  "Bookworm life 📚",
  "Tech enthusiast in the wild 💻",
  "Art is where the heart is 🎨",
  "Music feeds my soul 🎵",
  "Fitness journey continues 🏃‍♂️",
  "Recipe testing in progress 👩‍🍳",
  "Wanderlust activated ✈️",
  "Pet love is the best love 🐾",
  "Game night success 🎲",
  "DIY mode activated 🔨",
  "Plant parent proud 🌱",
  "Beach please 🏖️",
  "Mountain high ⛰️",
  "City lights, city nights 🌃",
  "Country roads take me home 🚜",
  "Snow day magic ❄️",
  "Autumn leaves and cozy sleeves 🍂",
  "Spring has sprung 🌷",
  "Summer state of mind 🏄‍♀️",
  "Winter is coming... ☃️",
  "Festival ready 🎪",
  "Concert vibes 🎤",
  "Movie night essentials 🍿",
  "Binge-watching like a pro 📺",
  "Pajama party 🛌",
  "Lazy Sunday approved 🛋️",
  "Productivity level: expert 📊",
  "Work hard, play harder 🏆",
  "Hustle with heart 💼",
  "Creative juices flowing 🧠",
  "Ideas worth spreading 💭",
  "Dream big, work hard 💫",
  "Goals on goals on goals 🎯",
  "Progress over perfection 📈",
  "Small steps, big dreams 👣",
  "Challenge accepted 🥋",
  "Pushing my limits 🚀",
  "Out of comfort zone ➡️ growth",
  "New skill unlocked 🔓",
  "Learning never stops 🧠",
  "Knowledge is power 📖",
  "Thoughts become things 💭➡️✨",
  "Manifesting greatness 🌠",
  "Positive vibes only 🌞",
  "Gratitude attitude 🙏",
  "Counting my blessings 💝",
  "Kindness is free 💗",
  "Spread love everywhere 🌍",
  "Be the change 🌱",
  "Community matters 👥",
  "Support local 🛍️",
  "Small business love 💕",
  "Sustainable living 🌎",
  "Eco-friendly choices ♻️",
  "Minimalist mindset 🧘‍♀️",
  "Less is more ✂️",
  "Decluttering my life 🗑️",
  "Organized and thriving 🗂️",
  "Clean space, clear mind 🧹",
  "Home sweet home 🏡",
  "Interior design obsessed 🛋️",
  "DIY home improvements 🔧",
  "Garden therapy 🌻",
  "Fresh cut flowers 💐",
  "Sunrise chaser 🌅",
  "Sunset admirer 🌇",
  "Stargazing tonight 🌠",
  "Moonchild vibes 🌙",
  "Rainy day thoughts ☔",
  "Storm watching ⚡",
  "Ocean soul 🌊",
  "Desert dreams 🏜️",
  "Forest bathing 🌲",
  "Nature heals 🍃",
  "Outdoor enthusiast 🏕️",
  "Campfire stories 🔥",
  "Road trip ready 🚗",
  "Wanderer at heart 🧭",
  "Travel bug bitten ✈️",
  "Passport full of stories 🛂",
  "Cultural immersion 🌏",
  "Foodie adventures 🍽️",
  "Culinary experiments 👩‍🍳",
  "Baking therapy 🧁",
  "Coffee connoisseur ☕",
  "Wine not? 🍷",
  "Cocktail hour 🍹",
  "Brunch life 🥑",
  "Dessert first 🍰",
];

const CONTEXT_DATA = {
  books: {
    items: [
      "The Great Gatsby",
      "1984",
      "Pride and Prejudice",
      "To Kill a Mockingbird",
      "The Hobbit",
      "Dune",
      "The Alchemist",
      "Sapiens",
    ],
    authors: [
      "F. Scott Fitzgerald",
      "George Orwell",
      "Jane Austen",
      "Harper Lee",
      "J.R.R. Tolkien",
      "Frank Herbert",
      "Paulo Coelho",
      "Yuval Noah Harari",
    ],
  },
  food: {
    items: [
      "pasta carbonara",
      "chicken curry",
      "beef stir-fry",
      "salmon teriyaki",
      "vegetable lasagna",
      "shrimp tacos",
      "beef burger",
      "chicken salad",
    ],
  },
  fitness: {
    items: [
      "yoga",
      "HIIT training",
      "weight lifting",
      "running",
      "cycling",
      "swimming",
      "pilates",
      "boxing",
    ],
  },
  travel: {
    items: [
      "Paris",
      "Tokyo",
      "New York",
      "Barcelona",
      "Sydney",
      "Rome",
      "Bangkok",
      "Cape Town",
      "Istanbul",
      "Rio de Janeiro",
    ],
  },
  technology: {
    items: [
      "web app",
      "mobile app",
      "AI",
      "blockchain",
      "machine learning",
      "data analysis",
      "cybersecurity",
      "cloud computing",
    ],
  },
  music: {
    items: [
      "indie rock",
      "jazz fusion",
      "electronic",
      "classical",
      "hip hop",
      "country",
      "blues",
      "reggae",
    ],
    artists: [
      "The Beatles",
      "Queen",
      "Pink Floyd",
      "Led Zeppelin",
      "Bob Dylan",
      "David Bowie",
      "Prince",
      "Michael Jackson",
    ],
  },
  art: {
    items: [
      "watercolor painting",
      "digital illustration",
      "sculpture",
      "photography",
      "oil painting",
      "sketch",
      "mixed media",
      "ceramics",
    ],
  },
  lifestyle: {
    items: [
      "meditation",
      "reading",
      "journaling",
      "gardening",
      "cooking",
      "cleaning",
      "planning",
      "exercising",
    ],
  },
  entertainment: {
    items: [
      "Inception",
      "The Dark Knight",
      "Interstellar",
      "Pulp Fiction",
      "Fight Club",
      "The Matrix",
      "Forrest Gump",
      "Goodfellas",
    ],
  },
  photography: {
    items: [
      "Central Park",
      "Golden Gate Bridge",
      "Eiffel Tower",
      "Mount Fuji",
      "Santorini",
      "Machu Picchu",
      "Petra",
      "Angkor Wat",
    ],
  },
  shopping: {
    items: [
      "laptop",
      "headphones",
      "camera",
      "watch",
      "shoes",
      "backpack",
      "phone",
      "tablet",
    ],
  },
  education: {
    items: [
      "Spanish",
      "coding",
      "photography",
      "cooking",
      "guitar",
      "painting",
      "dancing",
      "public speaking",
    ],
  },
  gaming: {
    items: [
      "Monopoly",
      "Catan",
      "Poker",
      "Chess",
      "Scrabble",
      "Risk",
      "Ticket to Ride",
      "Codenames",
    ],
  },
  workout: {
    items: [
      "cardio",
      "strength training",
      "yoga",
      "pilates",
      "HIIT",
      "crossfit",
      "running",
      "cycling",
    ],
  },
  venue: {
    items: [
      "local pub",
      "jazz club",
      "concert hall",
      "outdoor festival",
      "rooftop bar",
      "underground venue",
      "amphitheater",
      "music cafe",
    ],
  },
};

const FIRST_WORDS = [
  "Enjoying",
  "Learning",
  "Exploring",
  "Adoring",
  "Mastering",
  "Creating",
];
const NOUNS = ["life", "code", "nature", "art", "music", "food", "travel"];
const POST_TEXTS = [
  "Just had an amazing experience! ✨",
  "Check out this cool thing I found 🔍",
  "Working on something exciting... 🛠️",
  "Anyone else love this as much as I do? ❤️",
  "Weekend vibes 🌟",
  "New project alert 🚨",
  "Throwback to this amazing moment 📸",
  "Can't wait to share what's coming next! 👀",
  "Daily dose of inspiration 💡",
  "Behind the scenes of... 🎬",
  "Living my best life 🌈",
  "When in doubt, coffee it out ☕",
  "Good vibes only ✌️",
  "Sunshine and good times ☀️",
  "Another day, another adventure 🗺️",
  "Food coma achieved 🍴",
  "Just because I can 🌸",
  "Making memories every day 📅",
  "Do what makes your soul shine ✨",
  "Self-care isn't selfish 💆‍♀️",
  "Friday feels 🎉",
  "Morning motivation 💪",
  "Little things make big days 🌼",
  "Currently obsessed with this 🥰",
  "Sweat now, shine later 🏋️‍♀️",
  "Sunday funday 🎈",
  "Views and brews 🍺",
  "Bookworm life 📚",
  "Tech enthusiast in the wild 💻",
  "Art is where the heart is 🎨",
  "Music feeds my soul 🎵",
  "Fitness journey continues 🏃‍♂️",
  "Recipe testing in progress 👩‍🍳",
  "Wanderlust activated ✈️",
  "Pet love is the best love 🐾",
  "Game night success 🎲",
  "DIY mode activated 🔨",
  "Plant parent proud 🌱",
  "Beach please 🏖️",
  "Mountain high ⛰️",
  "City lights, city nights 🌃",
  "Country roads take me home 🚜",
  "Snow day magic ❄️",
  "Autumn leaves and cozy sleeves 🍂",
  "Spring has sprung 🌷",
  "Summer state of mind 🏄‍♀️",
  "Winter is coming... ☃️",
  "Festival ready 🎪",
  "Concert vibes 🎤",
  "Movie night essentials 🍿",
  "Binge-watching like a pro 📺",
  "Pajama party 🛌",
  "Lazy Sunday approved 🛋️",
  "Productivity level: expert 📊",
  "Work hard, play harder 🏆",
  "Hustle with heart 💼",
  "Creative juices flowing 🧠",
  "Ideas worth spreading 💭",
  "Dream big, work hard 💫",
  "Goals on goals on goals 🎯",
  "Progress over perfection 📈",
  "Small steps, big dreams 👣",
  "Challenge accepted 🥋",
  "Pushing my limits 🚀",
  "Out of comfort zone ➡️ growth",
  "New skill unlocked 🔓",
  "Learning never stops 🧠",
  "Knowledge is power 📖",
  "Thoughts become things 💭➡️✨",
  "Manifesting greatness 🌠",
  "Positive vibes only 🌞",
  "Gratitude attitude 🙏",
  "Counting my blessings 💝",
  "Kindness is free 💗",
  "Spread love everywhere 🌍",
  "Be the change 🌱",
  "Community matters 👥",
  "Support local 🛍️",
  "Small business love 💕",
  "Sustainable living 🌎",
  "Eco-friendly choices ♻️",
  "Minimalist mindset 🧘‍♀️",
  "Less is more ✂️",
  "Decluttering my life 🗑️",
  "Organized and thriving 🗂️",
  "Clean space, clear mind 🧹",
  "Home sweet home 🏡",
  "Interior design obsessed 🛋️",
  "DIY home improvements 🔧",
  "Garden therapy 🌻",
  "Fresh cut flowers 💐",
  "Sunrise chaser 🌅",
  "Sunset admirer 🌇",
  "Stargazing tonight 🌠",
  "Moonchild vibes 🌙",
  "Rainy day thoughts ☔",
  "Storm watching ⚡",
  "Ocean soul 🌊",
  "Desert dreams 🏜️",
  "Forest bathing 🌲",
  "Nature heals 🍃",
  "Outdoor enthusiast 🏕️",
  "Campfire stories 🔥",
  "Road trip ready 🚗",
  "Wanderer at heart 🧭",
  "Travel bug bitten ✈️",
  "Passport full of stories 🛂",
  "Cultural immersion 🌏",
  "Foodie adventures 🍽️",
  "Culinary experiments 👩‍🍳",
  "Baking therapy 🧁",
  "Coffee connoisseur ☕",
  "Wine not? 🍷",
  "Cocktail hour 🍹",
  "Brunch life 🥑",
  "Dessert first 🍰",
];

await mongoose.connect(process.env.MONGO_URI);

// Generate unique username
async function generateUniqueUsername(firstName, lastName) {
  let username = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
  let counter = 1;

  // Check if username exists and keep trying until we find a unique one
  while (true) {
    const existingProfile = await Profile.findOne({ username });
    if (!existingProfile) {
      return username;
    }
    username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${counter}`;
    counter++;
  }
}

// User creation function
async function createMockUser(index) {
  const userId = new Types.ObjectId();
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];

  // Create User
  const user = await User.create({
    _id: userId,
    email: `user${index}@email.com`,
    password: PASSWORD,
    verificationStatus: {
      isVerified: true,
      verificationToken: null,
    },
    favoriteTopics: generateFavoriteTopics(),
  });

  // Generate unique username
  const username = await generateUniqueUsername(firstName, lastName);

  // Create Profile with static profile picture
  const profile = await Profile.create({
    _id: userId,
    firstName,
    lastName,
    username,
    profilePicPath: getStaticProfilePicture(index),
    followers: [],
    following: [],
  });

  return { user, profile };
}

// Get static profile picture based on user index
function getStaticProfilePicture(index) {
  // Using DiceBear API for consistent, static avatars
  const styles = [
    "adventurer",
    "avataaars",
    "big-ears",
    "bottts",
    "croodles",
    "fun-emoji",
    "micah",
    "miniavs",
    "personas",
  ];
  const style = styles[index % styles.length];
  const seed = `user${index}`;
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

// Generate random favorite topics
function generateFavoriteTopics() {
  const topics = new Map();
  const numTopics = Math.floor(Math.random() * 4) + 2; // 2-5 topics

  Array.from({ length: numTopics }).forEach(() => {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    topics.set(topic, { count: Math.floor(Math.random() * 10) + 1 });
  });

  return topics;
}

// Generate posts for a user
async function createUserPosts(userId, allUserIds) {
  const numPosts = Math.floor(Math.random() * MAX_POSTS_PER_USER) + 1;
  const posts = [];

  console.log(`  Creating ${numPosts} posts...`);

  for (let i = 0; i < numPosts; i++) {
    // 70% chance to use template-based posts, 30% chance to use simple posts
    const useTemplate = Math.random() < 0.7;

    let postText, images;

    if (useTemplate) {
      const template =
        POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)];
      const context = template.context;
      const contextData = CONTEXT_DATA[context];

      // Generate dynamic text based on template
      postText = template.text;
      if (contextData.items) {
        const item =
          contextData.items[
            Math.floor(Math.random() * contextData.items.length)
          ];
        postText = postText.replace("{item}", item);
        postText = postText.replace("{book}", item);
        postText = postText.replace("{dish}", item);
        postText = postText.replace("{exercise}", item);
        postText = postText.replace("{location}", item);
        postText = postText.replace("{project}", item);
        postText = postText.replace("{artist}", item);
        postText = postText.replace("{artwork}", item);
        postText = postText.replace("{activity}", item);
        postText = postText.replace("{movie}", item);
        postText = postText.replace("{place}", item);
        postText = postText.replace("{skill}", item);
        postText = postText.replace("{game}", item);
        postText = postText.replace("{workout}", item);
        postText = postText.replace("{venue}", item);
      }
      if (contextData.authors) {
        const author =
          contextData.authors[
            Math.floor(Math.random() * contextData.authors.length)
          ];
        postText = postText.replace("{author}", author);
      }

      // Generate relevant images based on context
      const imageCount = Math.floor(Math.random() * 3) + 1; // 1-3 images
      images = [];
      console.log(
        `    Post ${
          i + 1
        }/${numPosts}: Fetching ${imageCount} contextual images...`,
      );
      for (let j = 0; j < imageCount; j++) {
        images.push({
          path: await getContextualImageUrl(template.images, context),
          fileType: "photo",
        });
      }
    } else {
      // Use simple post
      postText = SIMPLE_POSTS[Math.floor(Math.random() * SIMPLE_POSTS.length)];

      // Generate generic images for simple posts
      const imageCount = Math.floor(Math.random() * 2) + 1; // 1-2 images
      const genericImageTypes = [
        "lifestyle",
        "nature",
        "city",
        "people",
        "food",
        "technology",
        "art",
        "travel",
      ];
      images = [];
      console.log(
        `    Post ${
          i + 1
        }/${numPosts}: Fetching ${imageCount} generic images...`,
      );
      for (let j = 0; j < imageCount; j++) {
        const imageType =
          genericImageTypes[
            Math.floor(Math.random() * genericImageTypes.length)
          ];
        images.push({
          path: await getContextualImageUrl([imageType], "lifestyle"),
          fileType: "photo",
        });
      }
    }

    const post = await Post.create({
      creatorId: userId.toString(),
      text: postText,
      keywords: Array.from(
        { length: 3 },
        () => TOPICS[Math.floor(Math.random() * TOPICS.length)],
      ),
      likes: Array.from({ length: Math.floor(Math.random() * 1000) }, () => ({
        _id: allUserIds[Math.floor(Math.random() * allUserIds.length)],
        notificationId: new Types.ObjectId().toString(),
      })),
      files: images,
      createdAt:
        Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30), // Random time within last 30 days
    });

    posts.push(post);
  }

  return posts;
}

// Helper function to add delay between API calls
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Rate limiting state
let lastApiCall = 0;
const MIN_DELAY_BETWEEN_CALLS = 200; // 200ms minimum between calls
let rateLimitRemaining = 20000; // Default, will be updated from headers
let rateLimitReset = 0; // Will be updated from headers

// Helper function to fetch image from Pexels API
async function getPexelsImage(searchTerm, width = 800, height = 600) {
  try {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      throw new Error("PEXELS_API_KEY not found in environment variables");
    }

    // Check if we're approaching rate limits
    if (rateLimitRemaining <= 5) {
      const now = Date.now();
      const timeUntilReset = Math.max(0, rateLimitReset * 1000 - now);
      if (timeUntilReset > 0) {
        console.warn(
          `Rate limit low (${rateLimitRemaining} remaining). Waiting ${Math.ceil(
            timeUntilReset / 1000,
          )} seconds until reset...`,
        );
        await delay(timeUntilReset + 1000); // Add 1 second buffer
      }
    }

    // Rate limiting: ensure minimum delay between API calls
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < MIN_DELAY_BETWEEN_CALLS) {
      await delay(MIN_DELAY_BETWEEN_CALLS - timeSinceLastCall);
    }
    lastApiCall = Date.now();

    // Get multiple results to add variety
    const perPage = Math.min(5, Math.floor(Math.random() * 5) + 1); // Reduced from 10 to 5

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        searchTerm,
      )}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
      },
    );

    // Update rate limit info from headers
    const rateLimitHeader = response.headers.get("X-Ratelimit-Limit");
    const rateLimitRemainingHeader = response.headers.get(
      "X-Ratelimit-Remaining",
    );
    const rateLimitResetHeader = response.headers.get("X-Ratelimit-Reset");

    if (rateLimitRemainingHeader) {
      rateLimitRemaining = parseInt(rateLimitRemainingHeader);
    }
    if (rateLimitResetHeader) {
      rateLimitReset = parseInt(rateLimitResetHeader);
    }

    // Log rate limit status occasionally
    if (rateLimitRemaining % 100 === 0) {
      console.log(
        `Rate limit status: ${rateLimitRemaining} requests remaining`,
      );
    }

    if (response.status === 429) {
      // Rate limited - wait until reset time
      const now = Date.now();
      const timeUntilReset = Math.max(0, rateLimitReset * 1000 - now);
      console.warn(
        `Rate limited for "${searchTerm}". Waiting ${Math.ceil(
          timeUntilReset / 1000,
        )} seconds until reset...`,
      );
      await delay(timeUntilReset + 1000); // Add 1 second buffer

      // Retry once after waiting
      const retryResponse = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
          searchTerm,
        )}&per_page=${perPage}&orientation=landscape`,
        {
          headers: {
            Authorization: apiKey,
          },
        },
      );

      // Update rate limit info from retry response
      const retryRateLimitRemaining = retryResponse.headers.get(
        "X-Ratelimit-Remaining",
      );
      const retryRateLimitReset =
        retryResponse.headers.get("X-Ratelimit-Reset");

      if (retryRateLimitRemaining) {
        rateLimitRemaining = parseInt(retryRateLimitRemaining);
      }
      if (retryRateLimitReset) {
        rateLimitReset = parseInt(retryRateLimitReset);
      }

      if (!retryResponse.ok) {
        throw new Error(
          `Pexels API error after retry: ${retryResponse.status} ${retryResponse.statusText}`,
        );
      }

      const data = await retryResponse.json();
      if (data.photos && data.photos.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.photos.length);
        const photo = data.photos[randomIndex];
        return photo.src.medium;
      } else {
        throw new Error("No images found for the search term after retry");
      }
    }

    if (!response.ok) {
      throw new Error(
        `Pexels API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      // Randomly select one of the photos for variety
      const randomIndex = Math.floor(Math.random() * data.photos.length);
      const photo = data.photos[randomIndex];

      // Return the medium size image URL
      return photo.src.medium;
    } else {
      throw new Error("No images found for the search term");
    }
  } catch (error) {
    console.warn(`Pexels API error for "${searchTerm}":`, error.message);
    // Fallback to Picsum Photos if Pexels fails
    return `https://picsum.photos/${width}/${height}?random=${Math.floor(
      Math.random() * 1000,
    )}`;
  }
}

// Helper function to generate contextual image URLs
async function getContextualImageUrl(imageTypes, context) {
  const imageType = imageTypes[Math.floor(Math.random() * imageTypes.length)];
  const width = 800 + Math.floor(Math.random() * 400); // 800-1200px width
  const height = 600 + Math.floor(Math.random() * 400); // 600-1000px height

  // Map image types to better search terms for Pexels
  const imageTypeMap = {
    books: "books,library,reading",
    reading: "books,library,reading",
    library: "books,library,reading",
    food: "food,cooking,cuisine",
    cooking: "food,cooking,kitchen",
    kitchen: "food,cooking,kitchen",
    gym: "gym,fitness,workout",
    workout: "fitness,exercise,gym",
    fitness: "fitness,exercise,gym",
    travel: "travel,landscape,nature",
    landscape: "nature,landscape,scenery",
    nature: "nature,landscape,outdoors",
    technology: "technology,computer,digital",
    coding: "coding,computer,technology",
    computer: "computer,technology,digital",
    music: "music,concert,instrument",
    concert: "music,concert,performance",
    headphones: "music,headphones,audio",
    art: "art,painting,creative",
    painting: "art,painting,creative",
    creative: "art,creative,design",
    coffee: "coffee,cafe,drink",
    morning: "morning,sunrise,breakfast",
    lifestyle: "lifestyle,people,life",
    movie: "movie,cinema,film",
    cinema: "movie,cinema,film",
    entertainment: "entertainment,fun,leisure",
    sunset: "sunset,evening,sky",
    photography: "photography,camera,photo",
    shopping: "shopping,retail,store",
    unboxing: "unboxing,package,new",
    learning: "learning,education,study",
    education: "education,learning,school",
    gaming: "gaming,game,entertainment",
    friends: "friends,people,social",
    health: "health,wellness,medical",
    venue: "venue,concert,performance",
    weekend: "weekend,leisure,fun",
  };

  const searchTerm = imageTypeMap[imageType] || imageType;

  // Use Pexels API to get contextual images
  return await getPexelsImage(searchTerm, width, height);
}

// Main seeding function
async function seedDatabase() {
  try {
    // Create Elasticsearch index once at the beginning
    try {
      await client.indices.create({
        index: "profiles",
        body: {
          mappings: {
            properties: {
              username: { type: "keyword" },
              firstName: { type: "text" },
              lastName: { type: "text" },
              suggest: {
                type: "completion",
              },
            },
          },
        },
      });
      console.log("Elasticsearch index 'profiles' created successfully");
    } catch (error) {
      if (error.message.includes("resource_already_exists_exception")) {
        console.log(
          "Elasticsearch index 'profiles' already exists, skipping creation",
        );
      } else {
        throw error;
      }
    }

    // Create users and profiles
    const users = [];
    for (let i = 0; i < TOTAL_USERS; i++) {
      const user = await User.findOne({ email: `user${i}@email.com` });
      if (!user) {
        const { user, profile } = await createMockUser(i);
        users.push({ user, profile });
        console.log(`Created user ${i + 1}/${TOTAL_USERS}`);
      } else {
        const profile = await Profile.findById(user._id);
        users.push({ user, profile });
        console.log(`User ${i + 1}/${TOTAL_USERS} already exists`);
      }
    }

    // Create follow relationships
    const allUserIds = users.map((u) => u.user._id.toString());
    for (const currentUser of users) {
      const followersCount = Math.floor(Math.random() * MAX_FOLLOWERS);
      const followers = [];

      // Get random followers (excluding self)
      const potentialFollowers = allUserIds.filter(
        (id) => id !== currentUser.user._id.toString(),
      );
      const selectedFollowers = potentialFollowers
        .sort(() => 0.5 - Math.random())
        .slice(0, followersCount);

      // Update follower relationships using Follow model and profile counts
      for (const followerId of selectedFollowers) {
        // Skip if follow already exists
        const exists = await Follow.findOne({
          followedId: currentUser.user._id,
          followerId,
        });
        if (exists) continue;

        await Follow.create({
          followedId: currentUser.user._id,
          followerId,
          notificationId: new Types.ObjectId(),
        });

        // Increment counts on both profiles (ensure fields exist)
        currentUser.profile.followersCount =
          (currentUser.profile.followersCount || 0) + 1;

        const followerProfile = await Profile.findById(followerId);
        followerProfile.followingCount =
          (followerProfile.followingCount || 0) + 1;
        await followerProfile.save();
      }

      // Save current user's profile to persist updated followersCount
      await currentUser.profile.save();
    }

    // Create posts for all users
    for (const user of users) {
      console.log(`Creating posts for user ${user.profile.username}...`);
      await createUserPosts(user.user._id, allUserIds);
      console.log(`✅ Created posts for user ${user.profile.username}`);
    }

    console.log("Database seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
