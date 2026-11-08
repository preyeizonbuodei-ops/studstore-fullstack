const mongoose = require("mongoose");
const Exam = require("../../modules/CourseModuels/Exam");
const ExamQuestion = require("../../modules/CourseModuels/ExamQuestion");
const PastQuestion = require("../../modules/CourseModuels/QuestionBank/PastQuestions");

// Validate question data
const validateQuestionData = (data) => {
  const {
    questionText,
    questionType,
    options,
    correctOptionIndex,
    correctAnswer,
    marks
  } = data;

  if (
    typeof questionText !== "string" ||
    !questionText.trim() ||
    questionText.trim().length > 10000
  ) {
    return "Question text is required and must not exceed 10,000 characters.";
  }

  if (!["mcq", "written"].includes(questionType)) {
    return "Question type must be mcq or written.";
  }

  if (
    !Number.isInteger(Number(marks)) ||
    Number(marks) < 1 ||
    Number(marks) > 1000
  ) {
    return "Marks must be a whole number between 1 and 1000.";
  }

  if (questionType === "mcq") {
    if (!Array.isArray(options) || options.length < 2) {
      return "MCQs must have at least two options.";
    }

    if (
      options.some(
        (option) =>
          typeof option !== "string" ||
          !option.trim() ||
          option.trim().length > 2000
      )
    ) {
      return "Every option must be non-empty and not exceed 2,000 characters.";
    }

    const normalizedOptions = options.map((option) =>
      option.trim().toLowerCase()
    );

    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      return "MCQ options must be unique.";
    }

    if (
      !Number.isInteger(correctOptionIndex) ||
      correctOptionIndex < 0 ||
      correctOptionIndex >= options.length
    ) {
      return "Select a valid correct option.";
    }

    if (correctAnswer) {
      return "Use correctOptionIndex for MCQs, not correctAnswer.";
    }
  }

  if (questionType === "written") {
    if (Array.isArray(options) && options.length > 0) {
      return "Written questions cannot have MCQ options.";
    }

    if (
      typeof correctAnswer !== "string" ||
      !correctAnswer.trim()
    ) {
      return "A model answer is required for written questions.";
    }

    if (correctAnswer.trim().length > 10000) {
      return "The model answer must not exceed 10,000 characters.";
    }

    if (correctOptionIndex !== undefined && correctOptionIndex !== null) {
      return "Written questions cannot have a correct option index.";
    }
  }

  return null;
};

// Create a manual question
exports.CreateExamQuestion = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID."
      });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found."
      });
    }

    if (exam.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Questions can only be added to draft exams."
      });
    }

    if (!req.admin || !mongoose.isValidObjectId(req.admin.id)) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication is invalid."
      });
    }

    const validationError = validateQuestionData(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const {
      questionText,
      questionType,
      options = [],
      correctOptionIndex,
      correctAnswer,
      explanation = "",
      marks
    } = req.body;

    if (
      typeof explanation !== "string" ||
      explanation.length > 10000
    ) {
      return res.status(400).json({
        success: false,
        message: "Explanation must be text and cannot exceed 10,000 characters."
      });
    }

    const question = await ExamQuestion.create({
      examId: exam._id,
      questionText: questionText.trim(),
      questionType,
      options:
        questionType === "mcq"
          ? options.map((option) => option.trim())
          : [],
      correctOptionIndex:
        questionType === "mcq" ? correctOptionIndex : null,
      correctAnswer:
        questionType === "written" ? correctAnswer.trim() : null,
      explanation: explanation.trim(),
      marks: Number(marks),
      questionSource: "manual",
      reviewStatus: "not_required",
      createdBy: req.admin.id
    });

    return res.status(201).json({
      success: true,
      message: "Question created successfully.",
      question
    });
  } catch (error) {
    console.error("CREATE EXAM QUESTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create exam question."
    });
  }
};

// List questions for admin review
exports.GetExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID."
      });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found."
      });
    }

    const questions = await ExamQuestion.find({ examId })
      .populate("createdBy", "username email")
      .populate("reviewedBy", "username email")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (error) {
    console.error("GET EXAM QUESTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve exam questions."
    });
  }
};

// Update a manual question
exports.UpdateExamQuestion = async (req, res) => {
  try {
    const { examId, questionId } = req.params;

    if (
      !mongoose.isValidObjectId(examId) ||
      !mongoose.isValidObjectId(questionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam or question ID."
      });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found."
      });
    }

    if (exam.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Questions can only be edited while the exam is a draft."
      });
    }

    const question = await ExamQuestion.findOne({
      _id: questionId,
      examId
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found in this exam."
      });
    }

    if (question.questionSource !== "manual") {
      return res.status(400).json({
        success: false,
        message: "This endpoint only updates manually created questions."
      });
    }

    const allowedFields = [
      "questionText",
      "questionType",
      "options",
      "correctOptionIndex",
      "correctAnswer",
      "explanation",
      "marks"
    ];

    const unknownFields = Object.keys(req.body).filter(
      (key) => !allowedFields.includes(key)
    );

    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unsupported fields: ${unknownFields.join(", ")}`
      });
    }

    const updatedData = {
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options,
      correctOptionIndex: question.correctOptionIndex,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      marks: question.marks,
      ...req.body
    };

    const validationError = validateQuestionData(updatedData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    if (
      updatedData.explanation !== undefined &&
      (typeof updatedData.explanation !== "string" ||
        updatedData.explanation.length > 10000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Explanation must be text and cannot exceed 10,000 characters."
      });
    }

    question.questionText = updatedData.questionText.trim();
    question.questionType = updatedData.questionType;
    question.options =
      updatedData.questionType === "mcq"
        ? updatedData.options.map((option) => option.trim())
        : [];
    question.correctOptionIndex =
      updatedData.questionType === "mcq"
        ? updatedData.correctOptionIndex
        : null;
    question.correctAnswer =
      updatedData.questionType === "written"
        ? updatedData.correctAnswer.trim()
        : null;
    question.explanation = updatedData.explanation.trim();
    question.marks = Number(updatedData.marks);

    await question.save();

    return res.status(200).json({
      success: true,
      message: "Question updated successfully.",
      question
    });
  } catch (error) {
    console.error("UPDATE EXAM QUESTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update exam question."
    });
  }
};

// Delete a question
exports.DeleteExamQuestion = async (req, res) => {
  try {
    const { examId, questionId } = req.params;

    if (
      !mongoose.isValidObjectId(examId) ||
      !mongoose.isValidObjectId(questionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam or question ID."
      });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found."
      });
    }

    if (exam.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Questions can only be deleted while the exam is a draft."
      });
    }

    const question = await ExamQuestion.findOneAndDelete({
      _id: questionId,
      examId
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found in this exam."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully."
    });
  } catch (error) {
    console.error("DELETE EXAM QUESTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete exam question."
    });
  }
};



// Add verified Question Bank questions to an exam
exports.AddQuestionBankQuestionsToExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const { questionIds } = req.body;

        if (!mongoose.isValidObjectId(examId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID."
            });
        }

        if (
            !Array.isArray(questionIds) ||
            questionIds.length === 0 ||
            questionIds.length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide between 1 and 100 question IDs."
            });
        }

        if (!questionIds.every(id => mongoose.isValidObjectId(id))) {
            return res.status(400).json({
                success: false,
                message: "One or more question IDs are invalid."
            });
        }

        const normalizedIds = questionIds.map(id => id.toString());

        if (new Set(normalizedIds).size !== normalizedIds.length) {
            return res.status(400).json({
                success: false,
                message: "Duplicate question IDs are not allowed."
            });
        }

        if (!req.admin || !mongoose.isValidObjectId(req.admin.id)) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication is invalid."
            });
        }

        const exam = await Exam.findById(examId);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found."
            });
        }

        if (exam.status !== "draft") {
            return res.status(400).json({
                success: false,
                message: "Questions can only be added to draft exams."
            });
        }

        // Retrieve verified questions and their parent papers.
        const questions = await PastQuestion.find({
            _id: { $in: normalizedIds },
            isVerified: true
        }).populate("paperId", "courseId status");

        if (questions.length !== normalizedIds.length) {
            return res.status(400).json({
                success: false,
                message: "Some questions do not exist or have not been verified."
            });
        }

        const questionsById = new Map(
            questions.map(question => [
                question._id.toString(),
                question
            ])
        );

        // Preserve the order selected by the admin.
        const orderedQuestions = normalizedIds.map(id =>
            questionsById.get(id)
        );

        // Confirm every question belongs to a published paper
        // for the same course as the exam.
        for (const question of orderedQuestions) {
            const paper = question.paperId;

            if (
                !paper ||
                paper.status !== "published" ||
                paper.courseId.toString() !== exam.courseId.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "All selected questions must belong to published past papers for this exam's course."
                });
            }
        }

        // Prevent adding the same bank question twice.
        const existingQuestions = await ExamQuestion.find({
            examId: exam._id,
            questionBankQuestionId: {
                $in: normalizedIds
            }
        }).select("questionBankQuestionId");

        if (existingQuestions.length > 0) {
            return res.status(409).json({
                success: false,
                message: "One or more selected questions have already been added to this exam."
            });
        }

        const examQuestions = orderedQuestions.map(question => ({
            examId: exam._id,
            questionBankQuestionId: question._id,
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.questionType === "mcq"
                ? question.options
                : [],
            correctOptionIndex: question.questionType === "mcq"
                ? question.correctOptionIndex
                : null,
            correctAnswer: question.questionType === "written"
                ? question.correctAnswer
                : null,
            explanation: question.explanation || "",
            marks: question.marks,
            questionSource: "past_question",
            reviewStatus: "not_required",
            createdBy: req.admin.id
        }));

        const addedQuestions = await ExamQuestion.insertMany(
            examQuestions
        );

        return res.status(201).json({
            success: true,
            message: "Past questions added to the exam successfully.",
            count: addedQuestions.length,
            questions: addedQuestions
        });

    } catch (error) {
        console.error("ADD QUESTION BANK QUESTIONS TO EXAM ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add past questions to the exam."
        });
    }
};
