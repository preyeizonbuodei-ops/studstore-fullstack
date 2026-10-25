const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  process.env.MONGODB_URL ||
  process.env.DATABASE_URL;

const APPLY_CHANGES = process.argv.includes("--apply");

const positiveNumber = (value, fallback = 1) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0
    ? number
    : fallback;
};

const asText = (value) =>
  value == null ? "" : String(value);

async function migrate() {
  if (!MONGO_URI) {
    throw new Error(
      "MongoDB URI not found. Check the variable used by BACKEND/ConnectDB/ConnectDB.js."
    );
  }

  await mongoose.connect(MONGO_URI);

  const database = mongoose.connection.db;
  const lessons = database.collection("lessons");
  const topics = database.collection("topics");

  // Original course-level lessons have courseId but no TopicId.
  const legacyLessons = await lessons.find({
    courseId: { $exists: true, $ne: null },
    TopicId: null,
  }).toArray();

  // Original topics belong to lessons through lessonId.
  const legacyTopics = await topics.find({
    lessonId: { $exists: true, $ne: null },
    courseId: null,
  }).toArray();

  console.log("Legacy course-level lessons:", legacyLessons.length);
  console.log("Legacy topics attached to lessons:", legacyTopics.length);

  if (!APPLY_CHANGES) {
    console.log("\nDRY RUN ONLY. No database records were changed.");
    console.log(
      "After reviewing the counts and confirming a database backup, run with --apply to perform the migration."
    );
    return;
  }

  const oldLessonById = new Map(
    legacyLessons.map((lesson) => [
      String(lesson._id),
      lesson,
    ])
  );

  const newTopicByOldLessonId = new Map();

  let topicsCreated = 0;
  let lessonsCreated = 0;
  let orphanedTopics = 0;

  // Convert each old course-level lesson into a new course topic.
  for (const oldLesson of legacyLessons) {
    const topicNumber = positiveNumber(
      oldLesson.lessonNumber ?? oldLesson.LessonNumber
    );

    let newTopic = await topics.findOne({
      legacyLessonId: oldLesson._id,
    });

    if (!newTopic) {
      // Reuse an already-created matching topic where possible.
      newTopic = await topics.findOne({
        courseId: oldLesson.courseId,
        title: oldLesson.title,
        TopicNumber: topicNumber,
      });
    }

    if (!newTopic) {
      const now = new Date();

      newTopic = {
        _id: new mongoose.Types.ObjectId(),
        courseId: oldLesson.courseId,
        title: oldLesson.title || "Untitled topic",
        TopicNumber: topicNumber,
        legacyLessonId: oldLesson._id,
        legacyHierarchyMigration: "course-topic-lesson-v1",
        createdAt: oldLesson.createdAt || now,
        updatedAt: now,
      };

      await topics.insertOne(newTopic);
      topicsCreated += 1;
    } else {
      // Mark the relationship so rerunning the script is safe.
      await topics.updateOne(
        { _id: newTopic._id },
        {
          $set: {
            legacyLessonId: oldLesson._id,
            legacyHierarchyMigration: "course-topic-lesson-v1",
          },
        }
      );
    }

    newTopicByOldLessonId.set(
      String(oldLesson._id),
      newTopic
    );
  }

  // Convert each old topic into a lesson under its new parent topic.
  for (const oldTopic of legacyTopics) {
    let oldParentLesson = oldLessonById.get(
      String(oldTopic.lessonId)
    );

    if (!oldParentLesson) {
      oldParentLesson = await lessons.findOne({
        _id: oldTopic.lessonId,
        courseId: { $exists: true, $ne: null },
        TopicId: null,
      });
    }

    if (!oldParentLesson) {
      orphanedTopics += 1;
      console.warn(
        "Skipping topic with no matching legacy lesson:",
        String(oldTopic._id)
      );
      continue;
    }

    const parentTopic = newTopicByOldLessonId.get(
      String(oldParentLesson._id)
    );

    if (!parentTopic) {
      orphanedTopics += 1;
      console.warn(
        "Skipping topic because its new parent could not be found:",
        String(oldTopic._id)
      );
      continue;
    }

    const lessonNumber = positiveNumber(
      oldTopic.topicNumber ?? oldTopic.TopicNumber
    );

    let newLesson = await lessons.findOne({
      legacyTopicId: oldTopic._id,
    });

    if (!newLesson) {
      // Avoid duplicating a lesson already created under this topic.
      newLesson = await lessons.findOne({
        TopicId: parentTopic._id,
        LessonNumber: lessonNumber,
        title: oldTopic.title,
      });
    }

    if (newLesson) {
      await lessons.updateOne(
        { _id: newLesson._id },
        {
          $set: {
            legacyTopicId: oldTopic._id,
            legacyHierarchyMigration: "course-topic-lesson-v1",
          },
        }
      );
      continue;
    }

    const now = new Date();

    await lessons.insertOne({
      _id: new mongoose.Types.ObjectId(),
      TopicId: parentTopic._id,
      LessonNumber: lessonNumber,
      title: oldTopic.title || "Untitled lesson",
      content: asText(oldTopic.content),
      examples: asText(oldTopic.examples),
      videos: Array.isArray(oldTopic.videos)
        ? oldTopic.videos
        : [],
      materials: Array.isArray(oldTopic.materials)
        ? oldTopic.materials
        : [],
      resources: Array.isArray(oldTopic.resources)
        ? oldTopic.resources
        : [],
      legacyTopicId: oldTopic._id,
      legacyHierarchyMigration: "course-topic-lesson-v1",
      createdAt: oldTopic.createdAt || now,
      updatedAt: now,
    });

    lessonsCreated += 1;
  }

  console.log("\nMigration completed.");
  console.log("New topics created:", topicsCreated);
  console.log("New lessons created:", lessonsCreated);
  console.log("Legacy topics skipped due to missing parents:", orphanedTopics);
  console.log("Original records were not deleted.");
}

migrate()
  .catch((error) => {
    console.error("MIGRATION FAILED:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });