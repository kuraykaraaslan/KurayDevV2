-- AlterTable: Add deletedAt to Category
ALTER TABLE "Category" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Add deletedAt to Comment
ALTER TABLE "Comment" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Add deletedAt to ContactForm
ALTER TABLE "ContactForm" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Add deletedAt to Campaign
ALTER TABLE "Campaign" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Add deletedAt to Project
ALTER TABLE "Project" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Add deletedAt to Testimonial
ALTER TABLE "Testimonial" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Add deletedAt to PostSeries
ALTER TABLE "PostSeries" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Add deletedAt to ShortLink
ALTER TABLE "ShortLink" ADD COLUMN "deletedAt" TIMESTAMP(3);
