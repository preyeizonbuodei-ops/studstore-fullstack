const mongoose = require("mongoose");
const Exam = require("../../modules/CourseModuels/Exam");
const ExamQuestion = require("../../modules/CourseModuels/ExamQuestion");
const ExamAttempt = require("../../modules/CourseModuels/ExamAtempts");
const Course = require("../../modules/CourseModuels/Courses");
const Topic = require("../../modules/CourseModuels/TopicSchema");

// List published exams available to students
exports.GetPublishedExams = async (req, res) => {
  try {
    const { courseId, topicId, examMode } = req.query;

    const filter = { status: "published" };

    if (courseId) {
      if (!mongoose.isValidObjectId(courseId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID."
        });
      }

      filter.courseId = courseId;
    }

    if (topicId) {
      if (!mongoose.isValidObjectId(topicId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid topic ID."
        });
      }

      filter.topicId = topicId;
    }

    if (examMode) {
      if (!["practice", "cbt"].includes(examMode)) {
        return res.status(400).json({
          success: false,
          message: "Exam mode must be practice or cbt."
        });
      }

      filter.examMode = examMode;
    }

    const exams = await Exam.find(filter)
      .select("-createdBy")
      .populate("courseId", "courseCode courseTitle")
      .populate("topicId", "title TopicNumber")
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    // Only show exams that contain usable questions.
    const examIds = exams.map((exam) => exam._id);

    const questionCounts = await ExamQuestion.aggregate([
      {
        $match: {
          examId: { $in: examIds },
          $or: [
            { questionSource: "manual" },
            { questionSource: "past_question" },
            { questionSource: "ai", reviewStatus: "approved" }
          ]
        }
      },
      {
        $group: {
          _id: "$examId",
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = new Map(
      questionCounts.map((item) => [item._id.toString(), item.count])
    );

    const availableExams = exams
      .map((exam) => ({
        ...exam,
        questionCount: countMap.get(exam._id.toString()) || 0
      }))
      .filter((exam) => exam.questionCount > 0);

    return res.status(200).json({
      success: true,
      count: availableExams.length,
      exams: availableExams
    });
  } catch (error) {
    console.error("GET PUBLISHED EXAMS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve published exams."
    });
  }
};

// Start an exam attempt
exports.StartExamAttempt = async (req, res) => {
  try {
    const { examId } = req.params;
    const { selectedMode } = req.body;

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID."
      });
    }

    if (!["cbt", "handwritten"].includes(selectedMode)) {
      return res.status(400).json({
        success: false,
        message: "Select either cbt or handwritten mode."
      });
    }

    if (!req.user || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: "Student authentication is invalid."
      });
    }

    const exam = await Exam.findOne({
      _id: examId,
      status: "published"
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Published exam not found."
      });
    }

    const usableQuestionFilter = {
      examId: exam._id,
      $or: [
        { questionSource: "manual" },
        { questionSource: "past_question" },
        { questionSource: "ai", reviewStatus: "approved" }
      ]
    };

    const questionCount = await ExamQuestion.countDocuments(
      usableQuestionFilter
    );

    if (questionCount === 0) {
      return res.status(400).json({
        success: false,
        message: "This exam has no available questions."
      });
    }

    const startedAt = new Date();

    // Only exams configured as timed CBT exams have a deadline.
    const deadline =
      exam.examMode === "cbt"
        ? new Date(startedAt.getTime() + exam.duration * 60 * 1000)
        : null;

    const answers = await ExamQuestion.find(usableQuestionFilter)
      .select("_id")
      .sort({ createdAt: 1 })
      .lean();

    const attempt = await ExamAttempt.create({
      examId: exam._id,
      studentId: req.user.id,
      selectedMode,
      startedAt,
      deadline,
      status: "in-progress",
      answers: answers.map((question) => ({
        questionId: question._id,
        selectedOptionIndex: null,
        writtenAnswer: "",
        awardedMarks: null,
        markingStatus: "pending",
        feedback: ""
      })),
      totalMarks: 0,
      score: null,
      percentage: null,
      resultsReleased: false
    });

    return res.status(201).json({
      success: true,
      message: "Exam attempt started successfully.",
      attempt: {
        _id: attempt._id,
        examId: attempt.examId,
        selectedMode: attempt.selectedMode,
        startedAt: attempt.startedAt,
        deadline: attempt.deadline,
        status: attempt.status
      }
    });
  } catch (error) {
    console.error("START EXAM ATTEMPT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to start exam attempt."
    });
  }
};

 
// Retrieve questions for an active exam attempt
exports.GetAttemptQuestions = async (req, res) => {
  try {
    const { attemptId } = req.params;

    if (!mongoose.isValidObjectId(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID."
      });
    }

    if (!req.user || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: "Student authentication is invalid."
      });
    }

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      studentId: req.user.id
    }).populate("examId", "title description examMode duration instructions status");

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found."
      });
    }

    if (attempt.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "This exam attempt is no longer active."
      });
    }

    if (attempt.examId.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "This exam is no longer available."
      });
    }

    // Expire timed attempts on the server.
    if (attempt.deadline && Date.now() >= attempt.deadline.getTime()) {
      attempt.status = "expired";
      attempt.submittedAt = new Date();
      await attempt.save();

      return res.status(410).json({
        success: false,
        message: "Your exam time has expired. Your answers have been saved."
      });
    }

    const questionIds = attempt.answers.map((answer) => answer.questionId);

    const questions = await ExamQuestion.find({
      _id: { $in: questionIds },
      examId: attempt.examId._id,
      $or: [
  { questionSource: "manual" },
  { questionSource: "past_question" },
  { questionSource: "ai", reviewStatus: "approved" }
]
    })
      .select("_id questionText questionType options marks")
      .lean();

    const questionMap = new Map(
      questions.map((question) => [question._id.toString(), question])
    );

    // Preserve the order stored in the attempt.
    const orderedQuestions = attempt.answers
      .map((answer) => questionMap.get(answer.questionId.toString()))
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      exam: attempt.examId,
      attempt: {
        _id: attempt._id,
        selectedMode: attempt.selectedMode,
        startedAt: attempt.startedAt,
        deadline: attempt.deadline,
        status: attempt.status
      },
      questions: orderedQuestions,
      savedAnswers: attempt.answers.map((answer) => ({
        questionId: answer.questionId,
        selectedOptionIndex: answer.selectedOptionIndex,
        writtenAnswer: answer.writtenAnswer
      }))
    });
  } catch (error) {
    console.error("GET ATTEMPT QUESTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve exam questions."
    });
  }
};

// Save an answer during an active attempt
exports.SaveAttemptAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOptionIndex, writtenAnswer } = req.body;

    if (
      !mongoose.isValidObjectId(attemptId) ||
      !mongoose.isValidObjectId(questionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID or question ID."
      });
    }

    if (!req.user || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: "Student authentication is invalid."
      });
    }

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      studentId: req.user.id
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found."
      });
    }

    if (attempt.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "This exam attempt is no longer active."
      });
    }

    if (attempt.deadline && Date.now() >= attempt.deadline.getTime()) {
      attempt.status = "expired";
      attempt.submittedAt = new Date();
      await attempt.save();

      return res.status(410).json({
        success: false,
        message: "Your exam time has expired."
      });
    }

    const savedAnswer = attempt.answers.find(
      (answer) => answer.questionId.toString() === questionId
    );

    if (!savedAnswer) {
      return res.status(400).json({
        success: false,
        message: "This question does not belong to your exam attempt."
      });
    }

    const question = await ExamQuestion.findOne({
      _id: questionId,
      examId: attempt.examId,
      $or: [
  { questionSource: "manual" },
  { questionSource: "past_question" },
  { questionSource: "ai", reviewStatus: "approved" }
]
    }).select("_id questionType options");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found."
      });
    }

    if (question.questionType === "mcq") {
      if (
        !Number.isInteger(selectedOptionIndex) ||
        selectedOptionIndex < 0 ||
        selectedOptionIndex >= question.options.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Select a valid answer option."
        });
      }

      savedAnswer.selectedOptionIndex = selectedOptionIndex;
      savedAnswer.writtenAnswer = "";
    } else if (question.questionType === "written") {
      if (typeof writtenAnswer !== "string") {
        return res.status(400).json({
          success: false,
          message: "A written answer must be provided as text."
        });
      }

      if (writtenAnswer.length > 20000) {
        return res.status(400).json({
          success: false,
          message: "Your answer cannot exceed 20,000 characters."
        });
      }

      savedAnswer.writtenAnswer = writtenAnswer;
      savedAnswer.selectedOptionIndex = null;
    }

    await attempt.save();

    return res.status(200).json({
      success: true,
      message: "Answer saved successfully."
    });
  } catch (error) {
    console.error("SAVE ATTEMPT ANSWER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save your answer."
    });
  }
};

 
// Submit an exam attempt and calculate its score

exports.SubmitExamAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    if (!mongoose.isValidObjectId(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID.",
      });
    }

    if (!req.user || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: "Student authentication is invalid.",
      });
    }

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      studentId: req.user.id,
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found.",
      });
    }

    if (attempt.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "This exam attempt has already been submitted or expired.",
      });
    }

    const now = new Date();
    const timeExpired =
      attempt.deadline && now.getTime() >= attempt.deadline.getTime();

    const questionIds = attempt.answers.map((answer) => answer.questionId);

    const questions = await ExamQuestion.find({
      _id: { $in: questionIds },
      examId: attempt.examId,
      $or: [
  { questionSource: "manual" },
  { questionSource: "past_question" },
  { questionSource: "ai", reviewStatus: "approved" }
],
    }).lean();

    const questionMap = new Map(
      questions.map((question) => [
        question._id.toString(),
        question,
      ])
    );

    // Never calculate or save a result if an attempt question is missing.
    if (
      questions.length !== attempt.answers.length ||
      attempt.answers.some(
        (answer) => !questionMap.has(answer.questionId.toString())
      )
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Some exam questions could not be verified. Please contact the administrator.",
      });
    }

    let totalMarks = 0;
    let score = 0;
    let hasPendingWrittenAnswers = false;

    for (const answer of attempt.answers) {
      const question = questionMap.get(answer.questionId.toString());

      totalMarks += question.marks;

      if (question.questionType === "mcq") {
        const isCorrect =
          Number.isInteger(answer.selectedOptionIndex) &&
          answer.selectedOptionIndex === question.correctOptionIndex;

        answer.awardedMarks = isCorrect ? question.marks : 0;
        answer.markingStatus = "marked";
        answer.feedback = isCorrect
          ? "Correct answer."
          : "Incorrect answer.";

        score += answer.awardedMarks;
      } else if (question.questionType === "written") {
        // Written answers must be marked by an administrator.
        answer.awardedMarks = null;
        answer.markingStatus = "pending";
        answer.feedback = "";

        hasPendingWrittenAnswers = true;
      } else {
        return res.status(409).json({
          success: false,
          message: "An exam question has an unsupported question type.",
        });
      }
    }

    attempt.totalMarks = totalMarks;
    attempt.score = score;
    attempt.percentage =
      totalMarks > 0 && !hasPendingWrittenAnswers
        ? Number(((score / totalMarks) * 100).toFixed(2))
        : null;

    attempt.status = timeExpired ? "expired" : "submitted";
    attempt.submittedAt = now;

    // Results remain hidden until all written answers are marked.
    attempt.resultsReleased = !hasPendingWrittenAnswers;

    await attempt.save();

    return res.status(200).json({
      success: true,
      message: timeExpired
        ? "The exam time expired. Your saved answers have been submitted."
        : hasPendingWrittenAnswers
          ? "Exam submitted. Your written answers are awaiting manual marking."
          : "Exam submitted and scored successfully.",
      result: {
        attemptId: attempt._id,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        totalMarks: attempt.totalMarks,
        score: hasPendingWrittenAnswers ? null : attempt.score,
        percentage: attempt.percentage,
        resultsReleased: attempt.resultsReleased,
        writtenAnswersPending: hasPendingWrittenAnswers,
      },
    });
  } catch (error) {
    console.error("SUBMIT EXAM ATTEMPT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit exam attempt.",
    });
  }
};


 
// Get a student's exam history

exports.GetExamHistory = async (req, res) => {
  try {
    if (!req.user || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: "Student authentication is invalid.",
      });
    }

    const attempts = await ExamAttempt.find({
      studentId: req.user.id,
    })
      .select(
        "examId selectedMode startedAt deadline submittedAt status totalMarks score percentage resultsReleased createdAt"
      )
      .populate("examId", "title examMode duration courseId topicId")
      .sort({ createdAt: -1 })
      .lean();

    const safeAttempts = attempts.map((attempt) => {
      const isResultAvailable =
        attempt.resultsReleased === true &&
        ["submitted", "expired"].includes(attempt.status) &&
        attempt.totalMarks > 0 &&
        Number.isFinite(attempt.score) &&
        Number.isFinite(attempt.percentage);

      return {
        ...attempt,
        resultsReleased: isResultAvailable,
        score: isResultAvailable ? attempt.score : null,
        percentage: isResultAvailable ? attempt.percentage : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: safeAttempts.length,
      attempts: safeAttempts,
    });
  } catch (error) {
    console.error("GET EXAM HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve exam history.",
    });
  }
};


// Get a student's result and corrections for one attempt
exports.GetExamResult = async (req, res) => {
  try {
    const { attemptId } = req.params;

    if (!mongoose.isValidObjectId(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID.",
      });
    }

    if (!req.user || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: "Student authentication is invalid.",
      });
    }

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      studentId: req.user.id,
    }).populate("examId", "title description examMode duration");

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found.",
      });
    }

    if (!["submitted", "expired"].includes(attempt.status)) {
      return res.status(400).json({
        success: false,
        message: "Submit the exam before viewing results.",
      });
    }

    // Never return answers, model answers, or corrections before release.
    if (!attempt.resultsReleased) {
      return res.status(200).json({
        success: true,
        resultsReleased: false,
        message:
          "Your written answers are awaiting marking. Results will be available when marking is complete.",
        attempt: {
          _id: attempt._id,
          status: attempt.status,
          submittedAt: attempt.submittedAt,
          totalMarks: attempt.totalMarks,
        },
      });
    }

    if (!attempt.examId) {
      return res.status(409).json({
        success: false,
        resultsReleased: false,
        message: "The associated exam could not be found.",
      });
    }

    const questionIds = attempt.answers.map(
      (answer) => answer.questionId
    );

    const questions = await ExamQuestion.find({
      _id: { $in: questionIds },
      examId: attempt.examId._id,
      $or: [
  { questionSource: "manual" },
  { questionSource: "past_question" },
  { questionSource: "ai", reviewStatus: "approved" }
],
    })
      .select(
        "_id questionText questionType options correctOptionIndex correctAnswer explanation marks"
      )
      .lean();

    const questionMap = new Map(
      questions.map((question) => [
        question._id.toString(),
        question,
      ])
    );

    // Verify every question before exposing corrections.
    if (
      questions.length !== attempt.answers.length ||
      attempt.answers.some(
        (answer) => !questionMap.has(answer.questionId.toString())
      )
    ) {
      return res.status(409).json({
        success: false,
        resultsReleased: false,
        message:
          "The exam questions could not all be verified. Please contact the administrator.",
      });
    }

    // Confirm all written answers have actually been marked.
    for (const answer of attempt.answers) {
      const question = questionMap.get(
        answer.questionId.toString()
      );

      if (
        question.questionType === "written" &&
        (
          answer.markingStatus !== "marked" ||
          answer.awardedMarks === null ||
          answer.awardedMarks === undefined
        )
      ) {
        return res.status(200).json({
          success: true,
          resultsReleased: false,
          message: "Your written answers are still awaiting marking.",
          attempt: {
            _id: attempt._id,
            status: attempt.status,
            submittedAt: attempt.submittedAt,
            totalMarks: attempt.totalMarks,
          },
        });
      }
    }

    // Recalculate the result from verified question and answer records.
    let totalMarks = 0;
    let score = 0;

    const corrections = attempt.answers.map((answer) => {
      const question = questionMap.get(
        answer.questionId.toString()
      );

      totalMarks += question.marks;

      if (question.questionType === "mcq") {
        const isCorrect =
          Number.isInteger(answer.selectedOptionIndex) &&
          answer.selectedOptionIndex === question.correctOptionIndex;

        score += isCorrect ? question.marks : 0;
      } else {
        if (
          !Number.isFinite(answer.awardedMarks) ||
          answer.awardedMarks < 0 ||
          answer.awardedMarks > question.marks
        ) {
          throw new Error(
            "A written answer contains invalid awarded marks."
          );
        }

        score += answer.awardedMarks;
      }

      return {
        questionId: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options,
        correctOptionIndex: question.correctOptionIndex,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        marks: question.marks,
        selectedOptionIndex: answer.selectedOptionIndex,
        writtenAnswer: answer.writtenAnswer,
        awardedMarks: answer.awardedMarks,
        feedback: answer.feedback,
      };
    });

    if (totalMarks <= 0) {
      return res.status(409).json({
        success: false,
        resultsReleased: false,
        message: "A valid exam total could not be calculated.",
      });
    }

    const percentage = Number(
      ((score / totalMarks) * 100).toFixed(2)
    );

    // Keep the stored result consistent with the verified calculation.
    attempt.totalMarks = totalMarks;
    attempt.score = score;
    attempt.percentage = percentage;

    await attempt.save();

    return res.status(200).json({
      success: true,
      resultsReleased: true,
      exam: attempt.examId,
      result: {
        attemptId: attempt._id,
        selectedMode: attempt.selectedMode,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
        totalMarks,
        score,
        percentage,
      },
      corrections,
    });
  } catch (error) {
    console.error("GET EXAM RESULT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve exam results.",
    });
  }
};
