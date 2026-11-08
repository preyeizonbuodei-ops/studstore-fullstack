
const mongoose = require("mongoose");

const PastQuestionPaper = require("./PastQuestionPapar");
const PastQuestion = require("./PastQuestions");

// Check authenticated admin.
const isValidAdmin = (req) => {
    return (
        req.admin &&
        mongoose.isValidObjectId(req.admin.id)
    );
};


// Validate question data before saving.
const validateQuestionData = (data) => {
    if (
        typeof data.questionText !== "string" ||
        !data.questionText.trim()
    ) {
        return "Question text is required.";
    }

    if (!["mcq", "written"].includes(data.questionType)) {
        return "Question type must be mcq or written.";
    }

    if (
        !Number.isInteger(data.questionNumber) ||
        data.questionNumber < 1
    ) {
        return "Question number must be a positive integer.";
    }

    if (
        typeof data.marks !== "number" ||
        !Number.isFinite(data.marks) ||
        data.marks < 1
    ) {
        return "Question marks must be at least 1.";
    }

    if (!Array.isArray(data.options)) {
        return "Options must be an array.";
    }

    if (data.questionType === "mcq") {
        if (data.options.some(
            option =>
                typeof option !== "string" ||
                !option.trim()
        )) {
            return "All MCQ options must contain valid text.";
        }

        if (data.options.length > 0 && data.options.length < 2) {
            return "An MCQ must have at least two options.";
        }

        if (
            data.correctOptionIndex !== null &&
            data.correctOptionIndex !== undefined &&
            (
                !Number.isInteger(data.correctOptionIndex) ||
                data.correctOptionIndex < 0 ||
                data.correctOptionIndex >= data.options.length
            )
        ) {
            return "Correct option index is invalid.";
        }
    }

    if (
        data.questionType === "written" &&
        data.options.length > 0
    ) {
        return "Written questions should not contain MCQ options.";
    }

    return null;
};


// Check that the paper exists and is still editable.
const getEditablePaper = async (paperId) => {
    if (!mongoose.isValidObjectId(paperId)) {
        return {
            error: "Invalid paper ID.",
            status: 400,
        };
    }

    const paper = await PastQuestionPaper.findById(paperId);

    if (!paper) {
        return {
            error: "Past-question paper not found.",
            status: 404,
        };
    }

    if (paper.status !== "draft") {
        return {
            error: "Questions can only be modified while the paper is in draft status.",
            status: 400,
        };
    }

    return { paper };
};


// CREATE A QUESTION
exports.CreatePastQuestion = async (req, res) => {
    try {
        if (!isValidAdmin(req)) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication is invalid.",
            });
        }

        const { paperId } = req.params;

        const paperResult = await getEditablePaper(paperId);

        if (paperResult.error) {
            return res.status(paperResult.status).json({
                success: false,
                message: paperResult.error,
            });
        }

        const {
            questionNumber,
            questionText,
            questionType = "written",
            options = [],
            correctOptionIndex = null,
            correctAnswer = "",
            explanation = "",
            marks = 1,
        } = req.body;

        const questionData = {
            questionNumber: Number(questionNumber),
            questionText,
            questionType,
            options,
            correctOptionIndex:
                correctOptionIndex === null ||
                correctOptionIndex === undefined ||
                correctOptionIndex === ""
                    ? null
                    : Number(correctOptionIndex),
            correctAnswer,
            marks: Number(marks),
        };

        const validationError = validateQuestionData(questionData);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        if (
            typeof correctAnswer !== "string" ||
            typeof explanation !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Correct answer and explanation must be text.",
            });
        }

        const question = await PastQuestion.create({
            paperId: paperResult.paper._id,
            questionNumber: questionData.questionNumber,
            questionText: questionText.trim(),
            questionType,
            options: options.map(option => option.trim()),
            correctOptionIndex: questionData.correctOptionIndex,
            correctAnswer: correctAnswer.trim(),
            explanation: explanation.trim(),
            marks: questionData.marks,
            isVerified: false,
            createdBy: req.admin.id,
        });

        return res.status(201).json({
            success: true,
            message: "Past question created successfully. It is awaiting verification.",
            question,
        });

    } catch (error) {
        console.error("CREATE PAST QUESTION ERROR:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This question number already exists in the selected paper.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create past question.",
        });
    }
};


// GET ALL QUESTIONS IN A PAPER
exports.GetPastQuestionsByPaper = async (req, res) => {
    try {
        const { paperId } = req.params;

        if (!mongoose.isValidObjectId(paperId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paper ID.",
            });
        }

        const paper = await PastQuestionPaper.findById(paperId);

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Past-question paper not found.",
            });
        }

        const page = Math.max(
            1,
            parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit, 10) || 50)
        );

        const filter = { paperId };

        if (req.query.isVerified !== undefined) {
            if (!["true", "false"].includes(req.query.isVerified)) {
                return res.status(400).json({
                    success: false,
                    message: "isVerified must be true or false.",
                });
            }

            filter.isVerified = req.query.isVerified === "true";
        }

        const [questions, total] = await Promise.all([
            PastQuestion.find(filter)
                .populate("createdBy", "username email")
                .sort({ questionNumber: 1 })
                .skip((page - 1) * limit)
                .limit(limit),

            PastQuestion.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            message: "Past questions retrieved successfully.",
            paper: {
                _id: paper._id,
                title: paper.title,
                academicYear: paper.academicYear,
                semester: paper.semester,
                status: paper.status,
            },
            questions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error("GET PAST QUESTIONS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve past questions.",
        });
    }
};


// GET ONE QUESTION
exports.GetPastQuestionById = async (req, res) => {
    try {
        const { questionId } = req.params;

        if (!mongoose.isValidObjectId(questionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid question ID.",
            });
        }

        const question = await PastQuestion.findById(questionId)
            .populate("paperId")
            .populate("createdBy", "username email");

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Past question not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Past question retrieved successfully.",
            question,
        });

    } catch (error) {
        console.error("GET PAST QUESTION ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve past question.",
        });
    }
};


// UPDATE A QUESTION
exports.UpdatePastQuestion = async (req, res) => {
    try {
        if (!isValidAdmin(req)) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication is invalid.",
            });
        }

        const { questionId } = req.params;

        if (!mongoose.isValidObjectId(questionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid question ID.",
            });
        }

        const question = await PastQuestion.findById(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Past question not found.",
            });
        }

        const paperResult = await getEditablePaper(question.paperId);

        if (paperResult.error) {
            return res.status(paperResult.status).json({
                success: false,
                message: paperResult.error,
            });
        }

        const allowedFields = [
            "questionNumber",
            "questionText",
            "questionType",
            "options",
            "correctOptionIndex",
            "correctAnswer",
            "explanation",
            "marks",
        ];

        const updateData = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid question fields were provided.",
            });
        }

        const mergedData = {
            questionNumber:
                updateData.questionNumber !== undefined
                    ? Number(updateData.questionNumber)
                    : question.questionNumber,

            questionText:
                updateData.questionText !== undefined
                    ? updateData.questionText
                    : question.questionText,

            questionType:
                updateData.questionType !== undefined
                    ? updateData.questionType
                    : question.questionType,

            options:
                updateData.options !== undefined
                    ? updateData.options
                    : question.options,

            correctOptionIndex:
                updateData.correctOptionIndex !== undefined
                    ? (
                        updateData.correctOptionIndex === null ||
                        updateData.correctOptionIndex === ""
                            ? null
                            : Number(updateData.correctOptionIndex)
                    )
                    : question.correctOptionIndex,

            marks:
                updateData.marks !== undefined
                    ? Number(updateData.marks)
                    : question.marks,
        };

        const validationError = validateQuestionData(mergedData);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError,
            });
        }

        if (
            updateData.correctAnswer !== undefined &&
            typeof updateData.correctAnswer !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Correct answer must be text.",
            });
        }

        if (
            updateData.explanation !== undefined &&
            typeof updateData.explanation !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Explanation must be text.",
            });
        }

        Object.assign(question, {
            ...updateData,
            questionNumber: mergedData.questionNumber,
            questionText: mergedData.questionText.trim(),
            questionType: mergedData.questionType,
            options: mergedData.options.map(option => option.trim()),
            correctOptionIndex: mergedData.correctOptionIndex,
            marks: mergedData.marks,
        });

        if (updateData.correctAnswer !== undefined) {
            question.correctAnswer = updateData.correctAnswer.trim();
        }

        if (updateData.explanation !== undefined) {
            question.explanation = updateData.explanation.trim();
        }

        // Any edit requires the question to be verified again.
        question.isVerified = false;

        await question.save();

        return res.status(200).json({
            success: true,
            message: "Past question updated. It must be verified again.",
            question,
        });

    } catch (error) {
        console.error("UPDATE PAST QUESTION ERROR:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This question number already exists in the selected paper.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update past question.",
        });
    }
};


// VERIFY A QUESTION
exports.VerifyPastQuestion = async (req, res) => {
    try {
        if (!isValidAdmin(req)) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication is invalid.",
            });
        }

        const { questionId } = req.params;

        if (!mongoose.isValidObjectId(questionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid question ID.",
            });
        }

        const question = await PastQuestion.findById(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Past question not found.",
            });
        }

        const paperResult = await getEditablePaper(question.paperId);

        if (paperResult.error) {
            return res.status(paperResult.status).json({
                success: false,
                message: paperResult.error,
            });
        }

        if (!question.questionText.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question text is required before verification.",
            });
        }

        if (question.questionType === "mcq") {
            if (
                !Array.isArray(question.options) ||
                question.options.length < 2
            ) {
                return res.status(400).json({
                    success: false,
                    message: "An MCQ must have at least two options.",
                });
            }

            if (
                !Number.isInteger(question.correctOptionIndex) ||
                question.correctOptionIndex < 0 ||
                question.correctOptionIndex >= question.options.length
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Select a valid correct option before verification.",
                });
            }
        }

        if (question.questionType === "written") {
            if (
                typeof question.correctAnswer !== "string" ||
                !question.correctAnswer.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "A model answer is required before verifying a written question.",
                });
            }
        }

        if (question.marks < 1) {
            return res.status(400).json({
                success: false,
                message: "Question marks must be at least 1.",
            });
        }

        question.isVerified = true;

        await question.save();

        return res.status(200).json({
            success: true,
            message: "Past question verified successfully.",
            question,
        });

    } catch (error) {
        console.error("VERIFY PAST QUESTION ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify past question.",
        });
    }
};


// DELETE A QUESTION
exports.DeletePastQuestion = async (req, res) => {
    try {
        if (!isValidAdmin(req)) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication is invalid.",
            });
        }

        const { questionId } = req.params;

        if (!mongoose.isValidObjectId(questionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid question ID.",
            });
        }

        const question = await PastQuestion.findById(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Past question not found.",
            });
        }

        const paperResult = await getEditablePaper(question.paperId);

        if (paperResult.error) {
            return res.status(paperResult.status).json({
                success: false,
                message: paperResult.error,
            });
        }

        await question.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Past question deleted successfully.",
        });

    } catch (error) {
        console.error("DELETE PAST QUESTION ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete past question.",
        });
    }
};
