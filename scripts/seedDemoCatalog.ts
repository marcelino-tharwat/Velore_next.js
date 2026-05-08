/**
 * Seeds demo categories, products, and optional demo accounts (same password).
 *
 * Usage:
 *   npm run seed:demo
 *
 * Environment:
 *   - MONGODB_URI (required)
 *
 * Demo logins (password for all: Test@5050):
 *   - test20262@gmail.com — customer
 *   - test20263@gmail.com — seller
 * Admin account: run `npm run seed:admin` with ADMIN_EMAIL=test20261@gmail.com
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/db/mongoose";
import { Category } from "../src/models/Category";
import { Product } from "../src/models/Product";
import { User } from "../src/models/User";
import { Cart } from "../src/models/Cart";

const LOG = "[seed:demo]";
const BCRYPT_ROUNDS = 12;
/** Shared password for all demo users created by this script */
const SEED_DEMO_PASSWORD = "Test@5050";

type SeedCategory = {
  name: string;
  slug: string;
  description: string;
};

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  categorySlug: string;
  images: string[];
};

const CATEGORIES: SeedCategory[] = [
  {
    name: "Classic & dress",
    slug: "classic-dress",
    description: "Minimal and formal timepieces for everyday elegance.",
  },
  {
    name: "Sport & dive",
    slug: "sport-dive",
    description: "Water-resistant builds, chronographs, and rugged straps.",
  },
  {
    name: "Smart & connected",
    slug: "smart-connected",
    description: "Fitness tracking, notifications, and hybrid designs.",
  },
];

const PRODUCTS: SeedProduct[] = [
  {
    name: "Heritage Leather Quartz",
    slug: "heritage-leather-quartz",
    description:
      "Slim case, domed crystal, and a soft calf-leather strap — ideal for office wear.",
    price: 189.99,
    stock: 32,
    categorySlug: "classic-dress",
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=60",
    ],
  },
  {
    name: "Silver Milanese Mesh",
    slug: "silver-milanese-mesh",
    description: "Brushed silver-tone case with an adjustable mesh bracelet.",
    price: 159.5,
    stock: 44,
    categorySlug: "classic-dress",
    images: [
      "https://images.unsplash.com/photo-1523170335258-f5ed11863971?auto=format&fit=crop&w=800&q=60",
    ],
  },
  {
    name: "Chrono Pilot Steel",
    slug: "chrono-pilot-steel",
    description: "Three-register chronograph, luminous hands, 100m water resistance.",
    price: 279,
    stock: 22,
    categorySlug: "sport-dive",
    images: [
      "https://images.unsplash.com/photo-1495856458515-0637185db551?auto=format&fit=crop&w=800&q=60",
    ],
  },
  {
    name: "Midnight Diver Automatic",
    slug: "midnight-diver-automatic",
    description: "Ceramic bezel insert, sapphire glass, and rubber strap with quick release.",
    price: 349.99,
    stock: 18,
    categorySlug: "sport-dive",
    images: [
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=60",
    ],
  },
  {
    name: "Pulse Track Hybrid",
    slug: "pulse-track-hybrid",
    description: "Analog hands plus hidden display for steps, heart rate, and sleep.",
    price: 199,
    stock: 55,
    categorySlug: "smart-connected",
    images: [
      "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=800&q=60",
    ],
  },
  {
    name: "Apex GPS Sport Watch",
    slug: "apex-gps-sport-watch",
    description: "Built-in GPS routes, pace alerts, and 14-day battery in smart mode.",
    price: 329,
    stock: 27,
    categorySlug: "smart-connected",
    images: [
      "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=800&q=60",
    ],
  },
];

/** Extra accounts: test20261 is reserved for admin via seed:admin */
const DEMO_USERS: {
  email: string;
  name: string;
  role: "customer" | "seller";
  sellerStoreName?: string;
  sellerBio?: string;
  sellerProfileCompleted?: boolean;
}[] = [
  {
    email: "test20262@gmail.com",
    name: "Demo Customer",
    role: "customer",
  },
  {
    email: "test20263@gmail.com",
    name: "Demo Seller",
    role: "seller",
    sellerStoreName: "Horizon Timepieces",
    sellerBio: "Curated watches and straps for every wrist.",
    sellerProfileCompleted: true,
  },
];

function loadEnv(): void {
  const root = process.cwd();
  const envFile = path.join(root, ".env");
  const envLocal = path.join(root, ".env.local");
  if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: true });
  if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal, override: true });
}

async function seedCategories(): Promise<Map<string, string>> {
  console.log(`${LOG} Seeding categories...`);
  const map = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: cat.slug },
      {
        $set: {
          name: cat.name,
          description: cat.description,
        },
        $setOnInsert: {
          slug: cat.slug,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).select("_id slug");
    if (doc?._id) {
      map.set(cat.slug, doc._id.toString());
      console.log(`${LOG}   category ready: ${cat.slug}`);
    }
  }
  return map;
}

async function seedProducts(categoryIds: Map<string, string>): Promise<void> {
  console.log(`${LOG} Seeding products...`);
  for (const item of PRODUCTS) {
    const categoryId = categoryIds.get(item.categorySlug);
    if (!categoryId) {
      console.warn(`${LOG}   skipped product ${item.slug} (missing category link)`);
      continue;
    }
    await Product.findOneAndUpdate(
      { slug: item.slug },
      {
        $set: {
          name: item.name,
          description: item.description,
          price: item.price,
          stock: item.stock,
          categoryId,
          sellerId: null,
          images: item.images,
          imageUrl: item.images[0] ?? "",
          isActive: true,
        },
        $setOnInsert: {
          slug: item.slug,
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.log(`${LOG}   product ready: ${item.slug}`);
  }
}

async function seedDemoUsers(): Promise<void> {
  console.log(`${LOG} Seeding demo users (password: ${SEED_DEMO_PASSWORD})...`);
  const passwordHash = await bcrypt.hash(SEED_DEMO_PASSWORD, BCRYPT_ROUNDS);
  for (const u of DEMO_USERS) {
    const emailNorm = u.email.trim().toLowerCase();
    const existing = await User.findOne({ email: emailNorm }).select("+passwordHash");
    if (existing) {
      existing.passwordHash = passwordHash;
      existing.name = u.name;
      existing.role = u.role;
      existing.emailVerified = new Date();
      existing.verificationToken = undefined;
      existing.verificationTokenExpires = undefined;
      if (u.role === "seller") {
        existing.sellerStoreName = u.sellerStoreName ?? "";
        existing.sellerBio = u.sellerBio ?? "";
        existing.sellerProfileCompleted = u.sellerProfileCompleted ?? false;
      }
      await existing.save();
      console.log(`${LOG}   user updated: ${emailNorm} (${u.role})`);
    } else {
      await User.create({
        email: emailNorm,
        passwordHash,
        name: u.name,
        role: u.role,
        emailVerified: new Date(),
        ...(u.role === "seller"
          ? {
              sellerStoreName: u.sellerStoreName ?? "",
              sellerBio: u.sellerBio ?? "",
              sellerProfileCompleted: u.sellerProfileCompleted ?? false,
            }
          : {}),
      });
      console.log(`${LOG}   user created: ${emailNorm} (${u.role})`);
    }
    const userDoc = await User.findOne({ email: emailNorm }).select("_id");
    if (userDoc?._id) {
      try {
        await Cart.create({ userId: userDoc._id, items: [] });
      } catch (e: unknown) {
        const code = (e as { code?: number })?.code;
        if (code !== 11000) console.warn(`${LOG}   cart note for ${emailNorm}:`, e);
      }
    }
  }
}

async function main(): Promise<void> {
  loadEnv();
  if (!process.env.MONGODB_URI?.trim()) {
    throw new Error("MONGODB_URI is required in .env or .env.local");
  }
  await connectDB();
  const categoryIds = await seedCategories();
  await seedProducts(categoryIds);
  await seedDemoUsers();
  console.log(`${LOG} Done.`);
}

let exitCode = 0;
main()
  .catch((error) => {
    exitCode = 1;
    console.error(`${LOG} Failed:`, error);
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
    process.exit(exitCode);
  });
