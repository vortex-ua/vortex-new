import { CreateReviews, UpdateReviews, DeleteReviews } from "../reviews";

export default function Reviews({ reviews, projects }) {
  return (
    <section>
      <h2>Reviews (admin)</h2>

      {reviews.map(review => {
        const project = projects.find(
          project => project.id === review.project_id
        );

        return (
          <div key={review.id} className="review-blockRess">
            <div className="review-cont">
              <span>
                Project: {project ? project.title : "Not found"}
              </span>

              <span>Author name: {review.author_name}</span>
              <span>Review rating: {review.rating}</span>
              <span>
                Published: {review.is_public ? "yes" : "no"}
              </span>
              <span>Review text: {review.text}</span>
            </div>

            {/* UPDATE */}
            <form className='formRess' action={UpdateReviews}>
              <input type="hidden" name="id" value={review.id} />

              <input
                name="author_name"
                defaultValue={review.author_name}
              />

              <input
                name="rating"
                type="number"
                min="1"
                max="5"
                defaultValue={review.rating}
              />

              <textarea
                name="text"
                defaultValue={review.text}
              />

              <label className="checkbox-container">
                <input type="checkbox" name="is_public" defaultChecked={review.is_public} />
                <span className="checkmark"></span>
                <span className="checkbox-text">Published</span>
              </label>
              <button type="submit">Save</button>
            </form>

            {/* DELETE */}
            <form className='formRess' action={DeleteReviews}>
              <input type="hidden" name="id" value={review.id} />
              <button type="submit">Delete</button>
            </form>
          </div>
        );
      })}

      <hr />

      {/* CREATE */}
      <form className='formRess reviewRess' action={CreateReviews}>
        <h3>Add review</h3>

        <select name="project_id" required>
          <option value="">Choose a project</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>

        <input
          name="author_name"
          placeholder="Author name"
          required
        />

        {/* ❗ FIXED */}
        <select name="rating" required>
          <option value="">Choose rating</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>

        <textarea
          name="text"
          placeholder="Review text"
          required
        />

        <button type="submit">Add</button>
      </form>
    </section>
  );
}
