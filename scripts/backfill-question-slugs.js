/**
 * Script to backfill slugs for existing MCQ questions
 * This improves lookup performance by enabling fast slug-based queries
 * 
 * Usage: node scripts/backfill-question-slugs.js
 */

import mongoose from 'mongoose';
import connectToDatabase from '../lib/mongodb.js';
import MCQ from '../lib/models/MCQ.js';
import Category from '../lib/models/Category.js';
import { generateUniqueQuestionSlug } from '../lib/utils/slugGenerator.js';

async function backfillSlugs() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Get all MCQs without slugs, grouped by category for batch processing
    console.log('\n📊 Analyzing questions...');
    const categoriesWithQuestions = await MCQ.aggregate([
      {
        $match: {
          $or: [
            { slug: { $exists: false } },
            { slug: null },
            { slug: '' }
          ]
        }
      },
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(`Found ${categoriesWithQuestions.length} categories with questions missing slugs`);

    let totalUpdated = 0;
    let totalErrors = 0;

    for (const catGroup of categoriesWithQuestions) {
      const categoryId = catGroup._id;
      const count = catGroup.count;

      // Get category name for logging
      const category = await Category.findById(categoryId);
      const categoryName = category ? category.name : 'unknown';

      console.log(`\n📝 Processing category: ${categoryName} (${count} questions)`);

      // Get all questions without slugs for this category
      const questions = await MCQ.find({
        categoryId: categoryId,
        $or: [
          { slug: { $exists: false } },
          { slug: null },
          { slug: '' }
        ]
      }).select('_id question');

      let categoryUpdated = 0;
      let categoryErrors = 0;

      // Process in batches of 100 to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        
        console.log(`  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questions.length / batchSize)}...`);

        // Process batch in parallel
        await Promise.all(
          batch.map(async (question) => {
            try {
              // Generate unique slug
              const slug = await generateUniqueQuestionSlug(
                question.question,
                question._id.toString(),
                categoryId,
                MCQ
              );

              // Update question with slug
              await MCQ.findByIdAndUpdate(question._id, { slug });

              categoryUpdated++;
              totalUpdated++;

              // Log progress every 10 questions
              if (categoryUpdated % 10 === 0) {
                process.stdout.write(`  Updated ${categoryUpdated}/${questions.length}\r`);
              }
            } catch (error) {
              console.error(`\n  ❌ Error updating question ${question._id}:`, error.message);
              categoryErrors++;
              totalErrors++;
            }
          })
        );
      }

      console.log(`\n  ✅ Category complete: ${categoryUpdated} updated, ${categoryErrors} errors`);
    }

    console.log(`\n\n🎉 Backfill complete!`);
    console.log(`   Total questions updated: ${totalUpdated}`);
    console.log(`   Total errors: ${totalErrors}`);

    // Verify results
    console.log('\n🔍 Verifying results...');
    const stillMissing = await MCQ.countDocuments({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });
    
    const withSlugs = await MCQ.countDocuments({
      slug: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`   Questions with slugs: ${withSlugs}`);
    console.log(`   Questions still missing slugs: ${stillMissing}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
backfillSlugs();

