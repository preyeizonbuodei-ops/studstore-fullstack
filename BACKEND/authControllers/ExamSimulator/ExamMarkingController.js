
const mongoose = require("mongoose");
const Exam = require("../../modules/CourseModuels/Exam");
const ExamQuestion = require("../../modules/CourseModuels/ExamQuestion");
const ExamAttempt = require("../../modules/CourseModuels/ExamAtempts");

// Get submitted attempts that contain written answers awaiting marking
exports.GetPendingWrittenAttempts = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    const attempts = await ExamAttempt.find({
      examId,
      status: { $in: ["submitted", "expired"] },
      "answers.markingStatus": "pending",
    })
      .populate("studentId", "username email matricNumber")
      .sort({ submittedAt: -1, createdAt: -1 });

    const results = [];

    for (const attempt of attempts) {
      const pendingAnswers = attempt.answers.filter(
        (answer) => answer.markingStatus === "pending"
      );

      if (!pendingAnswers.length) continue;

      const questionIds = pendingAnswers.map(
        (answer) => answer.questionId
      );

      const questions = await ExamQuestion.find({
        _id: { $in: questionIds },
        examId: exam._id,
        questionType: "written",
      }).select("_id questionText correctAnswer explanation marks");

      const questionMap = new Map(
        questions.map((question) => [
          question._id.toString(),
          question,
        ])
      );

      const writtenAnswers = [];

      for (const answer of pendingAnswers) {
        const question = questionMap.get(
          answer.questionId.toString()
        );

        if (!question) continue;

        writtenAnswers.push({
          questionId: question._id,
          questionText: question.questionText,
          studentAnswer: answer.writtenAnswer || "",
          modelAnswer: question.correctAnswer || "",
          explanation: question.explanation || "",
          maxMarks: question.marks,
          markingStatus: answer.markingStatus,
        });
      }

      if (writtenAnswers.length) {
        results.push({
          attemptId: attempt._id,
          student: attempt.studentId
            ? {
                id: attempt.studentId._id,
                username: attempt.studentId.username,
                email: attempt.studentId.email,
                matricNumber: attempt.studentId.matricNumber,
              }
            : null,
          examTitle: exam.title,
          submittedAt: attempt.submittedAt,
          status: attempt.status,
          writtenAnswers,
        });
      }
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      attempts: results,
    });
  } catch (error) {
    console.error("Get pending written attempts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve written answers for marking.",
    });
  }
};


// Mark one written answer and recalculate the attempt result
exports.MarkWrittenAnswer = async (req, res) => {
  try {
    const { attemptId, questionId } = req.params;
    const { awardedMarks, feedback = "" } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(attemptId) ||
      !mongoose.Types.ObjectId.isValid(questionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid attempt ID or question ID.",
      });
    }

    if (
      typeof awardedMarks !== "number" ||
      !Number.isFinite(awardedMarks) ||
      awardedMarks < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Awarded marks must be a valid non-negative number.",
      });
    }

    if (
      typeof feedback !== "string" ||
      feedback.length > 10000
    ) {
      return res.status(400).json({
        success: false,
        message: "Feedback must be text with a maximum of 10000 characters.",
      });
    }

    const attempt = await ExamAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found.",
      });
    }

    if (!["submitted", "expired"].includes(attempt.status)) {
      return res.status(400).json({
        success: false,
        message: "Only submitted or expired attempts can be marked.",
      });
    }

    const answer = attempt.answers.find(
      (item) => item.questionId.toString() === questionId
    );

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "This question does not belong to the attempt.",
      });
    }

    if (answer.markingStatus === "marked") {
      return res.status(409).json({
        success: false,
        message: "This written answer has already been marked.",
      });
    }

    const question = await ExamQuestion.findOne({
      _id: questionId,
      examId: attempt.examId,
      questionType: "written",
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Written question not found for this exam.",
      });
    }

    if (awardedMarks > question.marks) {
      return res.status(400).json({
        success: false,
        message: `Awarded marks cannot exceed ${question.marks}.`,
      });
    }

    answer.awardedMarks = awardedMarks;
    answer.markingStatus = "marked";
    answer.feedback = feedback.trim();

    // Recalculate the result using the exam's actual questions.
    const allAnswers = attempt.answers;
    const allQuestionIds = allAnswers.map((item) => item.questionId);

    const questions = await ExamQuestion.find({
      _id: { $in: allQuestionIds },
      examId: attempt.examId,
    }).select("_id marks questionType");

    if (questions.length !== allAnswers.length) {
      return res.status(409).json({
        success: false,
        message:
          "Some exam questions could not be found. The result was not recalculated.",
      });
    }

    const questionMap = new Map(
      questions.map((item) => [item._id.toString(), item])
    );

    let totalMarks = 0;
    let score = 0;
    let hasPendingWrittenAnswers = false;

    for (const item of allAnswers) {
      const relatedQuestion = questionMap.get(
        item.questionId.toString()
      );

      if (!relatedQuestion) {
        return res.status(409).json({
          success: false,
          message: "An exam question is missing. The result was not released.",
        });
      }

      totalMarks += relatedQuestion.marks;

      if (relatedQuestion.questionType === "written") {
        if (item.markingStatus !== "marked" || item.awardedMarks === null) {
          hasPendingWrittenAnswers = true;
        } else {
          score += item.awardedMarks;
        }
      } else {
        // MCQ marks are calculated automatically when the student submits.
        score += item.awardedMarks === null ? 0 : item.awardedMarks;
      }
    }

    attempt.totalMarks = totalMarks;
    attempt.score = score;

    if (hasPendingWrittenAnswers) {
      attempt.percentage = null;
      attempt.resultsReleased = false;
    } else {
      attempt.percentage =
        totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(2)) : 0;
      attempt.resultsReleased = true;
    }

    await attempt.save();

    return res.status(200).json({
      success: true,
      message: attempt.resultsReleased
        ? "Written answer marked. The final result has been released."
        : "Written answer marked. Other written answers are still awaiting marking.",
      resultsReleased: attempt.resultsReleased,
      pendingWrittenAnswers: attempt.answers.filter(
        (item) => item.markingStatus === "pending"
      ).length,
      ...(attempt.resultsReleased
        ? {
            score: attempt.score,
            totalMarks: attempt.totalMarks,
            percentage: attempt.percentage,
          }
        : {}),
    });
  } catch (error) {
    console.error("Mark written answer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark the written answer.",
    });
  }
};
