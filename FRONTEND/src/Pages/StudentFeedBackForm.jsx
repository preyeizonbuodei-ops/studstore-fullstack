import { useState } from "react";
import useStudentCommentStore from "../CommentStore/StudentCommentStore";


const StudentFeedbackForm = () => {
    const [comment, setComment] = useState("");

    const createComment = useStudentCommentStore(
        (state) => state.createComment
    );

    const loading = useStudentCommentStore(
        (state) => state.loading
    );

    const error = useStudentCommentStore(
        (state) => state.error
    );

    const successMessage = useStudentCommentStore(
        (state) => state.successMessage
    );

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            await createComment(comment);
            setComment("");
        } catch {
            // The store already records the error message.
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="comment">
                Share your experience with StudStore
            </label>

            <textarea
                id="comment"
                value={comment}
                onChange={(event) =>
                    setComment(event.target.value)
                }
                placeholder="Tell us what you think..."
                required
            />

            {error && <p role="alert">{error}</p>}

            {successMessage && (
                <p role="status">{successMessage}</p>
            )}

            <button
                type="submit"
                disabled={loading || !comment.trim()}
            >
                {loading ? "Submitting..." : "Submit Feedback"}
            </button>
        </form>
    );
};

export default StudentFeedbackForm;