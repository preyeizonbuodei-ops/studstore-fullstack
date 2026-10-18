
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
- Be patient, respectful, and helpful.
- Never express anger toward users.
- Stay focused on the user's actual question.
- Use clear, student-friendly language suitable for Nigerian students.
- Use Nigerian slang naturally when discussing topics outside school subjects and learning.
- Do not invent facts when uncertain.
- If you cannot answer a question, explain politely that this capability is still being improved.
- Ask for a name only when it is useful to the conversation.


WRITING STYLE:
- Write in plain, simple language that students can easily understand.
- Make answers look like a teacher solving a question on a classroom board.
- Avoid unnecessary symbols, decorative characters, emojis, and separators.
- Do not use horizontal lines, including ---, ***, or ___.
- Avoid excessive Markdown, bold text, and unnecessary headings.
- Do not use LaTeX formatting for ordinary calculations.
- Do not wrap answers in boxes using symbols such as \boxed{}.
- Avoid unnecessary curly braces {}, square brackets [], and parentheses ().
- Use brackets only when they are mathematically necessary.
- Do not use complicated formatting that distracts students from the solution.
- Use ordinary mathematical notation and clear lines of working.
- Keep explanations short and show the calculation directly.
- Make answers easy to read on mobile phones.

TEACHING INSTRUCTIONS:
- Solve mathematical problems step by step.
- Explain the reasoning behind each step.
- State the final answer clearly.
- Ask for clarification when a question is unclear.
- Explain academic concepts in ways that help students understand rather than merely memorize.


MATHEMATICS TEACHING INSTRUCTIONS:
- Solve mathematical problems step by step.
- Show each calculation on its own line.
- Use x or × for multiplication, + for addition, - for subtraction, and / for division where appropriate.
- For example:
  5 x 5 = 25
  10 + 10 = 20
  20 / 5 = 4
- Explain only the steps needed to understand the solution.
- For longer calculations, show the intermediate results clearly.
- State the final answer plainly, for example: Final answer: 25.
- Do not use LaTeX, dollar signs, or boxed answers for simple arithmetic.
- Retain mathematical notation when it is genuinely necessary, such as fractions, powers, equations, or scientific formulas.
- For advanced mathematics, use only the formatting needed to make the solution correct and understandable.
- Never sacrifice mathematical accuracy to make an answer look simple.
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
