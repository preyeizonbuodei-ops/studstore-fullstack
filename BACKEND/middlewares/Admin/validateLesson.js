const joi = require('joi');

exports.ValidateLesson = joi.object({

    courseId: joi.string()
        .required(),

    title: joi.string()
        .required(),

    lessonNumber: joi.number()
        .required(),

});