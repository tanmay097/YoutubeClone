import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const CommentSchema = new Schema(
  {
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);
CommentSchema.index({ video: 1, createdAt: -1 });

export const Comment: Model<InferSchemaType<typeof CommentSchema>> =
  models.Comment || model("Comment", CommentSchema);
