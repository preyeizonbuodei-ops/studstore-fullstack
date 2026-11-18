const mongoose = require('mongoose');

const LessonResourceSchema = new mongoose.Schema({
    TopicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic",
        required: true
    },

    type: {
        type: String,
        enum: [ 'video', 'pdf', 'material', 'resource', 'example' ],
        required: true
    },
    
    title: {
        type: String,
        required: true
    },

    url: {
        type: String,
        required: true
    }

}, {
    timestamps: true
})

module.exports = mongoose.model("LessonResource", LessonResourceSchema)