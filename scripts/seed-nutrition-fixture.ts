import 'dotenv/config';
import { createHash } from 'node:crypto';
import { CatalogReleaseState, PrismaClient } from '@prisma/client';

const foods: Array<[string, string]> = [
  ['نان سنگک', 'Sangak bread'],
  ['نان بربری', 'Barbari bread'],
  ['نان لواش', 'Lavash bread'],
  ['نان تافتون', 'Taftoon bread'],
  ['برنج پخته', 'Cooked rice'],
  ['برنج قهوه‌ای پخته', 'Cooked brown rice'],
  ['عدس‌پلو', 'Lentil rice'],
  ['لوبیاپلو', 'Green bean rice'],
  ['زرشک‌پلو', 'Barberry rice'],
  ['سبزی‌پلو', 'Herb rice'],
  ['ماکارونی پخته', 'Cooked pasta'],
  ['جو دوسر', 'Oats'],
  ['بلغور گندم', 'Bulgur'],
  ['سیب‌زمینی آب‌پز', 'Boiled potato'],
  ['سیب‌زمینی تنوری', 'Baked potato'],
  ['تخم‌مرغ آب‌پز', 'Boiled egg'],
  ['تخم‌مرغ نیمرو', 'Fried egg'],
  ['مرغ کبابی', 'Grilled chicken'],
  ['مرغ آب‌پز', 'Boiled chicken'],
  ['ماهی کبابی', 'Grilled fish'],
  ['تن ماهی', 'Canned tuna'],
  ['گوشت گوساله پخته', 'Cooked beef'],
  ['گوشت گوسفند پخته', 'Cooked lamb'],
  ['کباب کوبیده', 'Koobideh kebab'],
  ['جوجه‌کباب', 'Chicken kebab'],
  ['خورش قورمه‌سبزی', 'Ghormeh sabzi stew'],
  ['خورش قیمه', 'Gheymeh stew'],
  ['خورش فسنجان', 'Fesenjan stew'],
  ['خوراک لوبیا', 'Bean stew'],
  ['عدسی', 'Lentil soup'],
  ['آش رشته', 'Ash reshteh'],
  ['سوپ جو', 'Barley soup'],
  ['نخود پخته', 'Cooked chickpeas'],
  ['لوبیا قرمز پخته', 'Cooked kidney beans'],
  ['لوبیا سفید پخته', 'Cooked white beans'],
  ['عدس پخته', 'Cooked lentils'],
  ['ماست ساده', 'Plain yogurt'],
  ['ماست چکیده', 'Strained yogurt'],
  ['شیر', 'Milk'],
  ['دوغ', 'Doogh'],
  ['پنیر سفید', 'White cheese'],
  ['پنیر فتا', 'Feta cheese'],
  ['کره', 'Butter'],
  ['روغن زیتون', 'Olive oil'],
  ['روغن مایع', 'Vegetable oil'],
  ['گردو', 'Walnuts'],
  ['بادام', 'Almonds'],
  ['پسته', 'Pistachios'],
  ['فندق', 'Hazelnuts'],
  ['بادام‌زمینی', 'Peanuts'],
  ['کنجد', 'Sesame seeds'],
  ['تخمه آفتابگردان', 'Sunflower seeds'],
  ['سیب', 'Apple'],
  ['موز', 'Banana'],
  ['پرتقال', 'Orange'],
  ['نارنگی', 'Tangerine'],
  ['انگور', 'Grapes'],
  ['هندوانه', 'Watermelon'],
  ['خربزه', 'Melon'],
  ['هلو', 'Peach'],
  ['شلیل', 'Nectarine'],
  ['گلابی', 'Pear'],
  ['کیوی', 'Kiwi'],
  ['انار', 'Pomegranate'],
  ['خرما', 'Dates'],
  ['کشمش', 'Raisins'],
  ['توت‌فرنگی', 'Strawberries'],
  ['گیلاس', 'Cherries'],
  ['آلبالو', 'Sour cherries'],
  ['زردآلو', 'Apricot'],
  ['خیار', 'Cucumber'],
  ['گوجه‌فرنگی', 'Tomato'],
  ['کاهو', 'Lettuce'],
  ['کلم سفید', 'Cabbage'],
  ['کلم بروکلی', 'Broccoli'],
  ['هویج', 'Carrot'],
  ['فلفل دلمه‌ای', 'Bell pepper'],
  ['پیاز', 'Onion'],
  ['سیر', 'Garlic'],
  ['اسفناج', 'Spinach'],
  ['سبزی خوردن', 'Fresh herb mix'],
  ['قارچ', 'Mushrooms'],
  ['بادمجان', 'Eggplant'],
  ['کدو سبز', 'Zucchini'],
  ['ذرت پخته', 'Cooked corn'],
  ['نخودفرنگی', 'Green peas'],
  ['سالاد شیرازی', 'Shirazi salad'],
  ['سالاد فصل', 'Mixed salad'],
  ['مست‌وخیار', 'Yogurt and cucumber'],
  ['حمص', 'Hummus'],
  ['ارده', 'Tahini'],
  ['عسل', 'Honey'],
  ['مربا', 'Jam'],
  ['شکر', 'Sugar'],
  ['شکلات تلخ', 'Dark chocolate'],
  ['بیسکویت ساده', 'Plain biscuits'],
  ['کیک ساده', 'Plain cake'],
  ['چای بدون شکر', 'Unsweetened tea'],
  ['قهوه بدون شکر', 'Unsweetened coffee'],
  ['آب', 'Water'],
];

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fa-IR');
}

function assertLocalDatabase() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is required.');
  const url = new URL(raw);
  if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw new Error('Development nutrition fixtures may only target a local database host.');
  }
}

async function main() {
  assertLocalDatabase();
  const prisma = new PrismaClient();
  const checksum = createHash('sha256').update(JSON.stringify(foods)).digest('hex');
  const versionName = 'dietyaar-development-name-only-v1';
  try {
    const version = await prisma.catalogVersion.upsert({
      where: { version: versionName },
      create: {
        version: versionName,
        sourceDocument: 'docs/engineering/nutrition-development-fixtures.md',
        licenseNote: `Development-only bilingual names; all nutrients NULL; sha256:${checksum}`,
        releaseState: CatalogReleaseState.DEVELOPMENT_FIXTURE,
      },
      update: {
        sourceDocument: 'docs/engineering/nutrition-development-fixtures.md',
        licenseNote: `Development-only bilingual names; all nutrients NULL; sha256:${checksum}`,
        releaseState: CatalogReleaseState.DEVELOPMENT_FIXTURE,
      },
    });
    await prisma.$transaction(async (tx) => {
      await tx.catalogFood.deleteMany({ where: { versionId: version.id } });
      await tx.catalogFood.createMany({
        data: foods.map(([fa, en]) => ({
          versionId: version.id,
          canonicalNameFa: fa,
          canonicalNameEn: en,
          normalizedNameFa: normalize(fa),
          normalizedNameEn: normalize(en),
          confidenceLabel: 'UNVERIFIED_DEVELOPMENT_NAME_ONLY',
          sourceCitation: 'docs/engineering/nutrition-development-fixtures.md',
        })),
      });
    });
    console.log(`Seeded ${foods.length} development-only name records (${checksum.slice(0, 12)}).`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
