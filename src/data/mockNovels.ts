export interface Novel {
  id: string;
  title: string;
  titleCn?: string;
  status: "Ongoing" | "Completed" | "Hiatus" | "Dropped";
  views: number;
  readers: number;
  chapters: number;
  rating: number;
  reviews: number;
  genres: string[];
  synopsis: string;
  cover?: string;
  addedDate: string;
  author: string;
}

export const mockNovels: Novel[] = [
  {
    id: "1",
    title: "Cultivation Chat Group",
    titleCn: "修真聊天群",
    status: "Ongoing",
    views: 2450000,
    readers: 180000,
    chapters: 3200,
    rating: 4.5,
    reviews: 12500,
    genres: ["Comedy", "Cultivation", "Modern Day", "Slice of Life", "Supernatural"],
    synopsis: "On a certain day, Song Shuhang accidentally joined a deeply afflicted Xianxia chuunibyou (8th grader syndrome) chat group, the group members inside all address each other as 'fellow daoist'. Their contact cards are all either Sect Master, Cave Master, Spiritual Master or Heavenly Expert. Even the group master's missing pet dog named Great Devil Dog abandoned his home. They chat all day about things like concocting pills, intruding mysterious territories, martial arts experiences and more.",
    addedDate: "2024-01-15",
    author: "Legend of the Paladin",
  },
  {
    id: "2", 
    title: "I'm Really a Superstar",
    titleCn: "我真是大明星",
    status: "Completed",
    views: 1890000,
    readers: 145000,
    chapters: 1696,
    rating: 4.3,
    reviews: 8900,
    genres: ["Comedy", "Entertainment", "Modern Day", "Showbiz"],
    synopsis: "Zhang Ye was originally a mundane college graduate with aspiring dreams to become a star, but unfortunately has below average looks and height. However one day, he woke up and suddenly found himself in a parallel world! It's like the same world, but wait a minute…many brands, celebrities and even famous works from his world changed and are gone in this new world! Armed with the profound literary knowledge of his previous world and a heaven-defying Game Ring that gives him magical items, stats and skills, Zhang Ye embarks on a journey to pursue his life-long dream of becoming famous!",
    addedDate: "2024-02-03",
    author: "Nine Lightyears Per Second",
  },
  {
    id: "3",
    title: "Reverend Insanity", 
    titleCn: "蛊真人",
    status: "Hiatus",
    views: 3200000,
    readers: 220000,
    chapters: 2334,
    rating: 4.7,
    reviews: 15600,
    genres: ["Dark", "Xianxia", "Cultivation", "Anti-Hero", "Reincarnation"],
    synopsis: "Humans are clever in tens of thousands of ways, Gu are the true refined essences of Heaven and Earth. The Three Temples are unrighteous, the demon is reborn. Former days are but an old dream, an identical name is made anew. A story of a time traveler who keeps on being reborn. A unique world that grows, cultivates, and uses Gu. The Spring and Autumn Cicada, Moonlight Gu, Liquor worm, Comprehensive Golden Light Worm, Fine Black Hair Gu, Hope Gu… And a peerless great demon that freely acts to his heart's content. But wait, he is not the MC?",
    addedDate: "2024-01-08",
    author: "Gu Zhen Ren",
  },
  {
    id: "4",
    title: "Library of Heaven's Path",
    titleCn: "天道图书馆", 
    status: "Completed",
    views: 2100000,
    readers: 165000,
    chapters: 2297,
    rating: 4.2,
    reviews: 9800,
    genres: ["Comedy", "Fantasy", "Xuanhuan", "Teacher", "System"],
    synopsis: "Traversing into another world, Zhang Xuan finds himself becoming an honorable teacher. Along with his transcension, a mysterious library appears in his mind. As long as it is something he has seen, regardless of whether it is a human or an object, a book on their weaknesses will be automatically compiled in the library. Thus, he becomes formidable. 'Monarch Zhuoyang, why do you detest wearing your underwear so much? As an emperor, can't you pay a little more attention to your image?' 'Fairy Linglong, you can always look beautiful, even without cosmetics. But you really shouldn't be teaching others to apply makeup, it will only cause them to become more unsightly...'",
    addedDate: "2024-01-22",
    author: "Heng Sao Tian Ya",
  },
  {
    id: "5",
    title: "The King's Avatar",
    titleCn: "全职高手",
    status: "Completed", 
    views: 2800000,
    readers: 195000,
    chapters: 1729,
    rating: 4.6,
    reviews: 13200,
    genres: ["Action", "Comedy", "E-Sports", "MMORPG", "Virtual Reality"],
    synopsis: "In the online game Glory, Ye Xiu is regarded as a textbook and a top-tier pro-player. However, due to a myriad of reasons, he is kicked from the team. After leaving the pro scene, he finds work in an Internet Cafe as a manager. When Glory launches its tenth server, he throws himself in to the game once more. Possessing ten years of experience, the memories of his past, and an incomplete, self-made weapon, his return along the road to the summit begins! After fighting and scheming, who snatched away my glory? Under the tossing of the wind and rain, my dreams shall still appear as though they had never been shattered. In all its splendor, the path shall never be lost. Before the hope of tomorrow, the reigning Glory Champion is back!",
    addedDate: "2024-02-10",
    author: "Butterfly Blue",
  },
  {
    id: "6",
    title: "Against the Gods",
    titleCn: "逆天邪神",
    status: "Ongoing",
    views: 4100000,
    readers: 285000,
    chapters: 1962,
    rating: 4.1,
    reviews: 18700,
    genres: ["Action", "Drama", "Harem", "Martial Arts", "Romance", "Xuanhuan"],
    synopsis: "Mythical Abode Mountain, Cloud's End Cliff, the most dangerous of Azure Cloud Continent's four deadly areas. Cloud's End Cliff's base is known as the Grim Reaper's Cemetery. Over countless years, the number of people that have fallen off this cliff is too high to count. None of them, even three stronger than god masters, whose power could pierce the heavens, have been able to return alive. However, a boy that's being chased by various people because he alone holds a peerless treasure jumps off the cliff, but instead of dying he wakes up in the body of a boy with the same name in another world!",
    addedDate: "2023-12-28",
    author: "Mars Gravity",
  },
  {
    id: "7",
    title: "Coiling Dragon",
    titleCn: "盘龙",
    status: "Completed",
    views: 3500000,
    readers: 245000,
    chapters: 805,
    rating: 4.8,
    reviews: 16800,
    genres: ["Action", "Adventure", "Fantasy", "Martial Arts", "Xuanhuan"],
    synopsis: "Empires rise and fall on the Yulan Continent. Saints, immortal beings of unimaginable power, battle using spells and sword techniques never seen before. Magical beasts rule the mountains, where the brave – or the foolish – go to test their strength. Even the mighty can fall, feasted on by those stronger. The strong live like royalty; the weak strive to survive another day. This is the world which Linley is born into. Raised in the small town of Wushan, Linley is a scion of the Baruch clan, the clan of the once-legendary Dragonblood Warriors. Their fame once shook the world, but the clan is now so decrepit that even the heirlooms of the clan have been sold off.",
    addedDate: "2023-11-15",
    author: "I Eat Tomatoes",
  },
  {
    id: "8",
    title: "Tales of Demons and Gods",
    titleCn: "妖神记",
    status: "Ongoing",
    views: 2900000,
    readers: 210000,
    chapters: 498,
    rating: 4.0,
    reviews: 11400,
    genres: ["Action", "Adventure", "Martial Arts", "Reincarnation", "School Life"],
    synopsis: "Killed by a Sage Emperor and reborn as his 13 year old self, Nie Li was given a second chance at life. A second chance to change everything and save his loved ones and his beloved city. He shall once again battle with the Sage Emperor to avenge his death and those of his beloved. With the vast knowledge of hundred years of life he accumulated in his previous life, wielding the strongest demon spirits, he shall reach the pinnacle of Martial Arts.",
    addedDate: "2024-01-05",
    author: "Mad Snail",
  }
];

export const getNovelById = (id: string): Novel | undefined => {
  return mockNovels.find(novel => novel.id === id);
};

export const getNovelsByGenre = (genre: string): Novel[] => {
  return mockNovels.filter(novel => novel.genres.includes(genre));
};

export const searchNovels = (query: string): Novel[] => {
  const lowercaseQuery = query.toLowerCase();
  return mockNovels.filter(novel => 
    novel.title.toLowerCase().includes(lowercaseQuery) ||
    novel.titleCn?.toLowerCase().includes(lowercaseQuery) ||
    novel.author.toLowerCase().includes(lowercaseQuery) ||
    novel.genres.some(genre => genre.toLowerCase().includes(lowercaseQuery))
  );
};

export const getTopRatedNovels = (limit?: number): Novel[] => {
  return [...mockNovels]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};

export const getMostViewedNovels = (limit?: number): Novel[] => {
  return [...mockNovels]
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
};

export const getRecentNovels = (limit?: number): Novel[] => {
  return [...mockNovels]
    .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
    .slice(0, limit);
};