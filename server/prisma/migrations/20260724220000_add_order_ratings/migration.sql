ALTER TABLE "Order"
ADD COLUMN "restaurantRating" INTEGER,
ADD COLUMN "driverRating" INTEGER,
ADD COLUMN "appRating" INTEGER,
ADD COLUMN "ratingComment" TEXT,
ADD COLUMN "ratedAt" TIMESTAMP(3);
