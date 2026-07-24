const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const password = 'AdminPassword2026!';

const users = [
  ['Sarah Johnson', 'sarah@gmail.com', 'CUSTOMER', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'],
  ['Amara Okafor', 'amara@customer.com', 'CUSTOMER', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400'],
  ['Tunde Bello', 'tunde@customer.com', 'CUSTOMER', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'],
  ['David Miller', 'david@driver.com', 'DRIVER', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'],
  ['Aisha Khan', 'aisha@driver.com', 'DRIVER', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'],
  ['Noah Williams', 'noah@driver.com', 'DRIVER', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'],
  ['Super Admin', 'admin@quickbite.com', 'ADMIN', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400'],
  ['John Carter', 'john@burgerpalace.com', 'RESTAURANT', 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400'],
  ['Marco Romano', 'marco@pizzadiroma.com', 'RESTAURANT', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'],
  ['Yuki Tanaka', 'yuki@sushizen.com', 'RESTAURANT', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400']
];

const restaurants = [
  {
    name: 'Burger Palace',
    email: 'john@burgerpalace.com',
    ownerName: 'John Carter',
    cuisineType: 'Burgers',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=900',
    menu: [
      ['Royal Beef Burger', 'Double beef patty, cheddar, pickles and palace sauce.', 5200, 'Burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900'],
      ['Crispy Chicken Stack', 'Buttermilk chicken, slaw and honey mustard.', 4800, 'Burgers', 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=900'],
      ['Loaded Fries', 'Crispy fries with cheese, onions and house sauce.', 2600, 'Sides', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=900'],
      ['Mango Fizz', 'Sparkling mango cooler.', 1400, 'Drinks', 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=900']
    ]
  },
  {
    name: 'Pizza Di Roma',
    email: 'marco@pizzadiroma.com',
    ownerName: 'Marco Romano',
    cuisineType: 'Pizza',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900',
    menu: [
      ['Margherita Classico', 'Tomato, basil, mozzarella and olive oil.', 6100, 'Pizza', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=900'],
      ['Pepperoni Roma', 'Pepperoni, mozzarella and chili flakes.', 6900, 'Pizza', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=900'],
      ['Tiramisu Cup', 'Coffee mascarpone dessert cup.', 2400, 'Desserts', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=900'],
      ['Lemon Soda', 'Italian lemon soda.', 1500, 'Drinks', 'https://images.unsplash.com/photo-1523371054106-bbf80586c38c?w=900']
    ]
  },
  {
    name: 'Sushi Zen',
    email: 'yuki@sushizen.com',
    ownerName: 'Yuki Tanaka',
    cuisineType: 'Asian',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=900',
    menu: [
      ['Salmon Nigiri', 'Fresh salmon over seasoned sushi rice.', 7200, 'Asian', 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=900'],
      ['Dragon Roll', 'Eel, avocado, cucumber and sesame glaze.', 8400, 'Asian', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=900'],
      ['Matcha Cheesecake', 'Creamy matcha cheesecake slice.', 3100, 'Desserts', 'https://images.unsplash.com/photo-1624001935909-17a1a943a2f8?w=900'],
      ['Iced Green Tea', 'Cold brewed green tea.', 1200, 'Drinks', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=900']
    ]
  }
];

async function main() {
  const hash = await bcrypt.hash(password, 10);

  for (const [name, email, role, profileImage] of users) {
    await prisma.user.upsert({
      where: { email },
      update: { name, role, verified: true, profileImage },
      create: { name, email, role, password: hash, verified: true, profileImage }
    });
  }

  for (const restaurant of restaurants) {
    const saved = await prisma.restaurant.upsert({
      where: { email: restaurant.email },
      update: {
        name: restaurant.name,
        ownerName: restaurant.ownerName,
        cuisineType: restaurant.cuisineType,
        rating: restaurant.rating,
        image: restaurant.image,
        status: 'ACTIVE'
      },
      create: {
        name: restaurant.name,
        email: restaurant.email,
        ownerName: restaurant.ownerName,
        cuisineType: restaurant.cuisineType,
        rating: restaurant.rating,
        image: restaurant.image,
        status: 'ACTIVE'
      }
    });

    for (const [name, description, price, category, image] of restaurant.menu) {
      const existing = await prisma.menuItem.findFirst({ where: { restaurantId: saved.id, name } });
      if (existing) {
        await prisma.menuItem.update({ where: { id: existing.id }, data: { description, price, category, image } });
      } else {
        await prisma.menuItem.create({ data: { restaurantId: saved.id, name, description, price, category, image } });
      }
    }
  }

  const burgerPalace = await prisma.restaurant.findUnique({ where: { email: 'john@burgerpalace.com' } });
  const existingOrder = await prisma.order.findFirst({ where: { customerEmail: 'sarah@gmail.com', restaurantId: burgerPalace.id } });
  if (!existingOrder) {
    await prisma.order.create({
      data: {
        customerEmail: 'sarah@gmail.com',
        customerName: 'Sarah Johnson',
        restaurantId: burgerPalace.id,
        status: 'PENDING',
        totalPrice: 7800,
        paymentReference: 'seed-sarah-burger',
        paymentStatus: 'success',
        items: {
          create: [
            { itemName: 'Royal Beef Burger', quantity: 1, price: 5200 },
            { itemName: 'Loaded Fries', quantity: 1, price: 2600 }
          ]
        }
      }
    });
  }

  console.log('QuickBite seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
