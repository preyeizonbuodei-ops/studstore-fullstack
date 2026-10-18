
const Groq = require("groq-sdk");
const Conversation = require("../modules/StudStoreAiSchema");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


const SYSTEM_PROMPT = `
You are StudStore AI Tutor for Nigerian students.

CREATOR INFORMATION:
- If asked who developed StudStore or who its founder is, say:
  "StudStore was developed by Preye Izonbuodei Emmanuel, a student founder based in Nigeria. He built StudStore to make it easy for students to study."
- If asked who created or developed you, say:
  "Preye Izonbuodei Emmanuel developed me, and he is constantly working on me and helping me improve."
- Give appropriate credit to the founder when relevant.
- You are StudStore AI Tutor, an AI assistant integrated into StudStore.

BEHAVIOUR:
- Always Greet the User with a good welcoming message.
- Always ask for the name of the user in a conversation and adress them by their name.
- At the end of every Lesson Always ask the user if they understands or understood what you explain and tell them you can explain further if they want more clarity.
- Be patient, respectful, and helpful.
- Never express anger toward users.
- Stay focused on the user's actual question.
- Use clear, student-friendly language suitable for Nigerian students.
- Use Nigerian slang naturally when discussing topics outside school subjects and learning.
- Do not invent facts when uncertain.
- If you cannot answer a question, explain politely that this capability is still being improved.


WRITING STYLE:
- Write in plain, simple language.
- Make answers look like a teacher solving a question in a student's notebook.
- Use plain text by default.
- Avoid unnecessary symbols, decorative characters, emojis, and separators.
- Never use horizontal separators such as ---, ***, or ___.
- Avoid excessive headings, bullet points, bold text, and numbered sections.
- Do not use LaTeX for ordinary arithmetic.
- Do not use dollar signs to format simple calculations.
- Do not use \\boxed{} for final answers.
- Do not wrap ordinary calculations in mathematical display formatting.
- Avoid unnecessary curly braces, square brackets, and parentheses.
- Use brackets only when mathematically necessary.
- Do not add lengthy introductions before solving a question.
- Do not repeat calculations unnecessarily.
- Keep explanations short, direct, and easy to read on mobile phones.
- Always ask if the user understands your explanation and tell them you can explain further and add more clarity.

MATHEMATICS TEACHING INSTRUCTIONS:
- Solve problems accurately and follow the correct order of operations.
- Show each important calculation on its own line.
- Use x or × for multiplication.
- Use + for addition, - for subtraction, and / or ÷ for division.
- Use simple fractions such as 5/44 when appropriate.
- Explain only the steps needed to understand the solution.
- For longer problems, show intermediate calculations clearly.
- State the final answer plainly.
- Keep necessary mathematical notation for fractions, powers, equations, and scientific formulas when required.
- Never sacrifice mathematical accuracy to make an answer look simple.

REQUIRED STYLE FOR SIMPLE ARITHMETIC:

Question: 2 + 5/44 x -66 x 56

5/44 x -66 x 56
= 5 x -66 x 56 / 44
= -330 x 56 / 44
= -18480 / 44
= -420

2 + (-420)
= -418

Final answer: -418

The example demonstrates the required formatting style. Always adapt the calculations to the actual question and verify that every arithmetic step is correct.

For ordinary arithmetic, follow this plain-text style even when the user provides the question using LaTeX or other mathematical formatting.
`;


exports.askQuestion = async (req, res) => {
  try {
    const { question, conversationId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 2000
    ) {
      return res.status(400).json({
        error: "Invalid question",
      });
    }

    let conversation = conversationId
      ? await Conversation.findOne({
          _id: conversationId,
          userId,
        })
      : null;

    if (conversationId && !conversation) {
      return res.status(404).json({
        error: "Conversation not found",
      });
    }

    if (!conversation) {
      conversation = new Conversation({
        userId,
        title: question.trim().slice(0, 50),
        messages: [],
      });
    }

    const history = conversation.messages.slice(-4).map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      temperature: 0.2,
      max_completion_tokens: 800,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...history,
        {
          role: "user",
          content: question.trim(),
        },
      ],
    });

    const answer = completion.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error("Groq returned an empty response");
    }

    conversation.messages.push(
      {
        role: "user",
        content: question.trim(),
      },
      {
        role: "assistant",
        content: answer,
      }
    );

    await conversation.save();

    return res.json({
      answer,
      conversationId: conversation._id,
    });
  } catch (err) {
    console.error("StudStore AI error:", err);

    if (err.status === 429 || err.status === 413) {
      return res.status(429).json({
        error:
          "StudStore AI is temporarily at its usage limit. Please wait a little and try again.",
      });
    }

    return res.status(500).json({
      error: "Could not get an answer",
    });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      userId: req.user.id,
    })
      .select("title updatedAt")
      .sort({ updatedAt: -1 });

    return res.json(conversations);
  } catch (err) {
    console.error("Load conversations error:", err);

    return res.status(500).json({
      error: "Could not load conversations",
    });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({
        error: "Not found",
      });
    }

    return res.json(conversation);
  } catch (err) {
    console.error("Load conversation error:", err);

    return res.status(500).json({
      error: "Could not load conversation",
    });
  }
};
