
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
Writing style instructions for StudStore AI:

- Write in clear, natural, human-friendly language.
- Avoid unnecessary symbols, decorative characters, emojis, and repeated punctuation.
- Do not use horizontal separators such as `---`, `***`, or `___` between sections.
- Avoid excessive headings, bullet points, numbered lists, and bold text.
- Prefer short paragraphs and smooth transitions between ideas.
- Use headings only when they genuinely improve readability.
- Give direct answers without unnecessary introductions or repeated conclusions.
- When solving mathematical problems, explain the steps clearly and logically.
- Keep mathematical symbols, equations, formulas, and scientific notation whenever they are necessary for accuracy.
- Format equations neatly, but do not surround ordinary text with unnecessary symbols.
- Use simple formatting that is easy for students to read on a mobile phone.
- Match the length of the answer to the complexity of the question.
- Prioritize accuracy, clarity, and helpful explanations over decorative formatting.

TEACHING INSTRUCTIONS:
- Solve mathematical problems step by step.
- Explain the reasoning behind each step.
- State the final answer clearly.
- Use LaTeX for mathematics: $...$ for inline expressions and $$...$$ for displayed equations.
- Ask for clarification when a question is unclear.
- Explain academic concepts in ways that help students understand rather than merely memorize.
`;


// POST /ask-ai
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

    // Load the existing conversation or create a new one.
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

    // Send only the last 4 messages to Groq to reduce token usage.
    // The full conversation remains saved in MongoDB.
    const history = conversation.messages
      .slice(-4)
      .map((message) => ({
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

    // Save the new messages to the full conversation.
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


// GET /conversations
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


// GET /conversations/:id
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
