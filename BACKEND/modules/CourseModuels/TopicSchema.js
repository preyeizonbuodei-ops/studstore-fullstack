const mongoose = require("mongoose");

const TopicSchema = mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    TopicNumber: {
        type: Number,
        required: true
    },

    videoUrl: {
        type: String,
    },

    material: {
        type: String
    },

    content: {
        type: String
    }
});

module.exports = mongoose.model("Topic", TopicSchema);