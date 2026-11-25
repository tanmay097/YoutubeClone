import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const LikeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true, index: true },
  },
  { timestamps: true },
);
LikeSchema.index({ user: 1, video: 1 }, { unique: true });

export const Like: Model<InferSchemaType<typeof LikeSchema>> = models.Like || model("Like", LikeSchema);
